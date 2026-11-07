// Parte server de Fidel: lee el pedido, aplica los límites, llama a Gemini y arma la respuesta.
import {
  ASSISTANT_LIMITS,
  type AssistantMessage,
  type AssistantResponseBody,
  validateAssistant,
} from "./assistant";
import { type AssistantBackend, assistantBackendFromEnv } from "./assistant-limits";
import { buildSystemPrompt } from "./assistant-prompt";
import { GEMINI_DEFAULTS, type GeminiSettings, geminiSettingsFromEnv } from "./assistant-settings";
import { readJsonBody } from "./contact-server";
import { clientIp } from "./contact-store";

export const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash-lite";

export interface AssistantConfig extends AssistantBackend {
  apiKey?: string;
  model: string;
  /** Ajustes de la llamada a Gemini; sin ellos, los valores por defecto. */
  gemini?: GeminiSettings;
  fetch?: typeof fetch;
}

/** Se lee en runtime desde process.env: en Astro 7 import.meta.env queda fijo en el build. */
export function assistantConfigFromEnv(env: NodeJS.ProcessEnv = process.env): AssistantConfig {
  return {
    ...assistantBackendFromEnv(env),
    apiKey: env.GEMINI_API_KEY,
    model: env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL,
    gemini: geminiSettingsFromEnv(env),
  };
}

function respond(body: AssistantResponseBody | { enabled: boolean }, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

const unavailable = () =>
  respond(
    { ok: false, code: "unavailable", error: "Fidel no está disponible en este momento." },
    503,
  );

/** Lo único que sabe el navegador: si mostrar el widget. */
export function handleAssistantStatus(config: AssistantConfig): Response {
  return respond({ enabled: config.enabled && Boolean(config.apiKey) }, 200);
}

/** Texto de la respuesta de Gemini, o undefined si vino vacía o bloqueada. */
export function extractReply(data: unknown): string | undefined {
  const parts = (data as { candidates?: { content?: { parts?: { text?: unknown }[] } }[] })
    ?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return undefined;
  const text = parts
    .map((p) => (typeof p?.text === "string" ? p.text : ""))
    .join("")
    .trim();
  return text || undefined;
}

async function askGemini(
  config: AssistantConfig,
  messages: AssistantMessage[],
): Promise<string | undefined> {
  const doFetch = config.fetch ?? fetch;
  const gemini = config.gemini ?? GEMINI_DEFAULTS;
  const response = await doFetch(`${gemini.baseUrl}/models/${config.model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": config.apiKey ?? "" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: buildSystemPrompt() }] },
      contents: messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
      generationConfig: {
        maxOutputTokens: gemini.maxOutputTokens,
        temperature: gemini.temperature,
      },
    }),
    signal: AbortSignal.timeout(gemini.timeoutMs),
  });
  if (!response.ok) {
    // Sin el detalle de Google en el log: puede traer datos de la cuenta.
    throw new Error(`Gemini respondió ${response.status}`);
  }
  return extractReply(await response.json());
}

export async function handleAssistant(
  request: Request,
  config: AssistantConfig,
): Promise<Response> {
  if (!config.enabled || !config.apiKey || !config.dailyLimiter) return unavailable();

  const parsed = await readJsonBody(request, ASSISTANT_LIMITS.body);
  if (!parsed.ok)
    return respond({ ok: false, code: "invalid", error: parsed.error }, parsed.status);

  const result = validateAssistant(parsed.body);
  if (!result.ok) return respond({ ok: false, code: "invalid", error: result.error }, 400);

  // Al bot se le responde con algo neutro, sin gastar tokens.
  if (result.honeypot) return respond({ ok: true, reply: "Gracias por escribirnos." }, 200);

  const ip = clientIp(request);
  if (config.rateLimiter && ip) {
    let allowed = true;
    try {
      allowed = await config.rateLimiter.allow(ip);
    } catch (error) {
      // El tope diario sigue protegiendo el gasto, así que acá se deja pasar.
      console.error("[assistant] no se pudo consultar el límite por IP", error);
    }
    if (!allowed) {
      return respond(
        {
          ok: false,
          code: "rate_limited",
          error: "Estás escribiendo muy seguido: esperá unos minutos.",
        },
        429,
      );
    }
  }

  // Si el contador falla no se llama a Gemini: sin tope no se gasta.
  try {
    if (!(await config.dailyLimiter.take())) return unavailable();
  } catch (error) {
    console.error("[assistant] no se pudo consultar el tope diario", error);
    return unavailable();
  }

  try {
    const reply = await askGemini(config, result.data.messages);
    if (!reply) throw new Error("Gemini no devolvió texto");
    return respond({ ok: true, reply }, 200);
  } catch (error) {
    console.error(
      "[assistant] falló la llamada a Gemini",
      error instanceof Error ? error.message : "",
    );
    return respond({ ok: false, code: "error", error: "No pudimos responderte ahora." }, 502);
  }
}
