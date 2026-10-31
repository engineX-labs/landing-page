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
  /** Tope de tokens de cada respuesta. */
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
      "Hola, soy Fidel, el asistente de IA de engineX. Puedo contarte qué hacemos y cómo trabajamos.",
    suggestions: ["¿Qué servicios ofrecen?", "¿Cómo trabajan?", "¿Cuánto cuesta un sistema?"],
  },
  "social-engine": {
    greeting:
      "Hola, soy Fidel, el asistente de IA de engineX. Puedo contarte cómo funciona Social Engine.",
    suggestions: [
      "¿Qué es Social Engine?",
      "¿Con qué redes funciona?",
      "¿Cómo me sumo a la lista de espera?",
    ],
  },
};
