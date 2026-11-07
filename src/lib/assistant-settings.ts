// Ajustes de Fidel que se pueden cambiar con variables de entorno, con sus valores por defecto.
// Lo que comparte con el widget (largo de mensajes, historial, tamaño del pedido) no va acá: el
// navegador no lee process.env, así que esos topes siguen en assistant.ts.
import type { Duration } from "@upstash/ratelimit";
import { ASSISTANT_LIMITS } from "./assistant";
import { apiBaseFromEnv, durationFromEnv, intFromEnv, numberFromEnv } from "./env-values";

type Env = Record<string, string | undefined>;

export interface GeminiSettings {
  /** URL base de la API de Gemini, sin barra final. */
  baseUrl: string;
  /** Tiempo máximo de espera de la respuesta. */
  timeoutMs: number;
  temperature: number;
  /** Tope de tokens de cada respuesta. */
  maxOutputTokens: number;
}

export const GEMINI_DEFAULTS: GeminiSettings = {
  baseUrl: "https://generativelanguage.googleapis.com/v1beta",
  timeoutMs: 15_000,
  temperature: 0.4,
  maxOutputTokens: ASSISTANT_LIMITS.outputTokens,
};

export function geminiSettingsFromEnv(env: Env): GeminiSettings {
  return {
    baseUrl: apiBaseFromEnv(env.GEMINI_API_BASE, GEMINI_DEFAULTS.baseUrl),
    timeoutMs: intFromEnv(env.GEMINI_TIMEOUT_MS, GEMINI_DEFAULTS.timeoutMs, {
      min: 1_000,
      max: 60_000,
    }),
    temperature: numberFromEnv(env.GEMINI_TEMPERATURE, GEMINI_DEFAULTS.temperature, {
      min: 0,
      max: 2,
    }),
    maxOutputTokens: intFromEnv(env.ASSISTANT_MAX_OUTPUT_TOKENS, GEMINI_DEFAULTS.maxOutputTokens, {
      min: 50,
      max: 2_000,
    }),
  };
}

export interface AssistantRateLimit {
  messages: number;
  window: Duration;
}

/** Mensajes por IP en una ventana. */
export const RATE_LIMIT_DEFAULTS: AssistantRateLimit = { messages: 12, window: "10 m" };

export function assistantRateLimitFromEnv(env: Env): AssistantRateLimit {
  return {
    messages: intFromEnv(env.ASSISTANT_RATE_LIMIT_MESSAGES, RATE_LIMIT_DEFAULTS.messages, {
      min: 1,
      max: 1_000,
    }),
    window: durationFromEnv(env.ASSISTANT_RATE_LIMIT_WINDOW, RATE_LIMIT_DEFAULTS.window),
  };
}
