// Parte server del formulario de contacto: lee el request, guarda el mensaje y arma la respuesta.
import {
  buildWhatsappText,
  buildWhatsappUrl,
  type ContactErrors,
  LIMITS,
  validateContact,
} from "./contact";
import {
  type ContactRateLimiter,
  type ContactStore,
  clientIp,
  contactBackendFromEnv,
} from "./contact-store";

export interface ContactConfig {
  whatsappNumber: string;
  /** Dónde se guarda cada mensaje (archivos o Redis). */
  store: ContactStore;
  /** Límite de envíos por IP; sin él no hay límite. */
  rateLimiter?: ContactRateLimiter;
  now?: () => Date;
}

export type ContactResponseBody =
  | { ok: true; whatsappUrl: string }
  | { ok: false; errors?: ContactErrors; error?: string };

/**
 * Se lee en runtime desde process.env: en Astro 7 import.meta.env queda fijo en el build.
 */
export function contactConfigFromEnv(env: NodeJS.ProcessEnv = process.env): ContactConfig {
  return {
    whatsappNumber: env.WHATSAPP_NUMBER ?? "",
    ...contactBackendFromEnv(env),
  };
}

function json(body: ContactResponseBody, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

/** Lee el body como texto; devuelve null si supera `limit` bytes, sin bufferear el resto. */
export async function readBodyWithLimit(request: Request, limit: number): Promise<string | null> {
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

export async function handleContact(request: Request, config: ContactConfig): Promise<Response> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return json({ ok: false, error: "Mandá los datos como JSON." }, 415);
  }

  const declared = Number(request.headers.get("content-length") ?? "0");
  if (declared > LIMITS.body)
    return json({ ok: false, error: "El mensaje es demasiado largo." }, 413);

  // Sin Content-Length (chunked) se corta la lectura apenas pasa el límite.
  let text: string | null;
  try {
    text = await readBodyWithLimit(request, LIMITS.body);
  } catch {
    return json({ ok: false, error: "No pudimos leer el mensaje." }, 400);
  }
  if (text === null) return json({ ok: false, error: "El mensaje es demasiado largo." }, 413);

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return json({ ok: false, error: "No pudimos leer el mensaje." }, 400);
  }

  const result = validateContact(body);
  if (!result.ok) return json({ ok: false, errors: result.errors }, 400);

  const whatsappUrl = buildWhatsappUrl(config.whatsappNumber, buildWhatsappText(result.data));

  // Al bot se le responde igual que a una persona, pero no se guarda nada.
  if (result.honeypot) return json({ ok: true, whatsappUrl }, 200);

  const ip = clientIp(request);
  if (config.rateLimiter && ip) {
    let allowed = true;
    try {
      allowed = await config.rateLimiter.allow(ip);
    } catch (error) {
      // Si el límite no responde, se deja pasar: es mejor recibir el mensaje que perderlo.
      console.error("[contact] no se pudo consultar el límite de envíos", error);
    }
    if (!allowed) {
      return json(
        { ok: false, error: "Mandaste varios mensajes seguidos: esperá unos minutos." },
        429,
      );
    }
  }

  try {
    const now = config.now ?? (() => new Date());
    await config.store.save({ ...result.data, receivedAt: now().toISOString() });
  } catch (error) {
    console.error("[contact] no se pudo guardar el mensaje", error);
    // El formulario agrega "Escribinos directo por WhatsApp." con el link.
    return json({ ok: false, error: "No pudimos guardar tu mensaje." }, 500);
  }
  return json({ ok: true, whatsappUrl }, 200);
}
