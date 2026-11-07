// Validación del asistente Fidel. Funciones puras: las usan el endpoint /api/assistant y el widget.

export const ASSISTANT_NAME = "Fidel";

export const ASSISTANT_PAGES = ["enginex", "social-engine"] as const;
export type AssistantPage = (typeof ASSISTANT_PAGES)[number];

export const ASSISTANT_LIMITS = {
  /** Caracteres por mensaje de la persona. */
  userChars: 500,
  /** Caracteres por respuesta de Fidel que el cliente reenvía como historial. */
  assistantChars: 2_000,
  /** Mensajes de historial (6 turnos de ida y vuelta); lo más viejo se descarta. */
  history: 12,
  /** Tope de tokens de cada respuesta (por defecto; ASSISTANT_MAX_OUTPUT_TOKENS lo cambia). */
  outputTokens: 400,
  /** Tamaño máximo del body del request, en bytes. */
  body: 20_000,
} as const;

export interface AssistantMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AssistantInput {
  page: AssistantPage;
  messages: AssistantMessage[];
}

export type AssistantValidation =
  | { ok: true; data: AssistantInput; honeypot: boolean }
  | { ok: false; error: string };

/** `code` le dice al widget qué mostrar; `error` es texto para la persona. */
export type AssistantResponseBody =
  | { ok: true; reply: string }
  | {
      ok: false;
      code: "invalid" | "rate_limited" | "unavailable" | "error";
      error: string;
    };

export const ASSISTANT_FALLBACK =
  "No pude responderte ahora. Escribinos por WhatsApp y te contestamos en el día.";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function validateAssistant(raw: unknown): AssistantValidation {
  const invalid = (error: string): AssistantValidation => ({ ok: false, error });
  if (!isRecord(raw)) return invalid("No pudimos leer el mensaje.");

  const page = ASSISTANT_PAGES.find((p) => p === raw.page);
  if (!page) return invalid("No pudimos leer el mensaje.");
  if (!Array.isArray(raw.messages)) return invalid("No pudimos leer el mensaje.");

  // Solo roles de conversación: las instrucciones salen del servidor, nunca del cliente.
  const messages: AssistantMessage[] = [];
  for (const item of raw.messages) {
    if (!isRecord(item) || typeof item.content !== "string") {
      return invalid("No pudimos leer el mensaje.");
    }
    if (item.role !== "user" && item.role !== "assistant") {
      return invalid("No pudimos leer el mensaje.");
    }
    const content = item.content.trim();
    if (!content) return invalid("Escribí tu consulta.");
    const max = item.role === "user" ? ASSISTANT_LIMITS.userChars : ASSISTANT_LIMITS.assistantChars;
    if (content.length > max) return invalid("El mensaje es demasiado largo.");
    messages.push({ role: item.role, content });
  }

  // Se queda con lo más reciente y arranca siempre en un mensaje de la persona.
  const recent = messages.slice(-ASSISTANT_LIMITS.history);
  while (recent.length > 0 && recent[0].role !== "user") recent.shift();
  if (recent.length === 0) return invalid("Escribí tu consulta.");
  if (recent.at(-1)?.role !== "user") return invalid("No pudimos leer el mensaje.");
  for (let i = 1; i < recent.length; i++) {
    if (recent[i].role === recent[i - 1].role) return invalid("No pudimos leer el mensaje.");
  }

  const honeypot = typeof raw.company === "string" && raw.company.trim() !== "";
  return { ok: true, data: { page, messages: recent }, honeypot };
}

/** Saludo y preguntas sugeridas del panel vacío, por página. */
export const ASSISTANT_INTRO: Record<AssistantPage, { greeting: string; suggestions: string[] }> = {
  enginex: {
    greeting:
      "Soy Fidel, el asistente de IA de engineX. Contame qué negocio tenés y te cuento si Social Engine te sirve.",
    suggestions: ["¿Qué es Social Engine?", "¿Cuánto cuesta?", "¿Hacen sistemas a medida?"],
  },
  "social-engine": {
    greeting:
      "Soy Fidel, el asistente de IA de engineX. Contame qué negocio tenés y te cuento si Social Engine te sirve.",
    suggestions: [
      "¿Qué hace Social Engine?",
      "¿Hay prueba gratuita?",
      "¿Cómo me sumo a la lista de espera?",
    ],
  },
};

/** Un tramo de la respuesta de Fidel: texto o un link a uno de los destinos permitidos. */
export type AssistantPart =
  | { type: "text"; text: string }
  | { type: "link"; token: "whatsapp" | "lista" };

/**
 * Fidel escribe `[[whatsapp]]` o `[[lista]]` donde va un link; el widget arma el link con el destino
 * real. Cualquier otro `[[...]]` se descarta, así el modelo no puede mandar a otro lado.
 */
export function splitAssistantText(text: string): AssistantPart[] {
  const parts: AssistantPart[] = [];
  let last = 0;
  for (const match of text.matchAll(/\[\[([^\]]{0,30})\]\]/g)) {
    const before = text.slice(last, match.index);
    if (before) parts.push({ type: "text", text: before });
    const token = match[1].trim().toLowerCase();
    if (token === "whatsapp" || token === "lista") parts.push({ type: "link", token });
    last = (match.index ?? 0) + match[0].length;
  }
  const rest = text.slice(last);
  if (rest) parts.push({ type: "text", text: rest });
  return parts;
}
