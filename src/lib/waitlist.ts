// Validación de la lista de espera de Social Engine.
// Funciones puras: las usan el endpoint /api/waitlist y el script de la landing.

export const WAITLIST_LIMITS = {
  email: 254,
  /** Tamaño máximo del body del request, en bytes. */
  body: 2_000,
} as const;

/** Desde qué formulario de la landing se anotó la persona. */
export const WAITLIST_SOURCES = ["hero", "cierre"] as const;
export type WaitlistSource = (typeof WAITLIST_SOURCES)[number];

export interface WaitlistInput {
  email: string;
  source: WaitlistSource;
}

export type WaitlistErrors = { email?: string };

export type WaitlistValidation =
  | { ok: true; data: WaitlistInput; honeypot: boolean }
  | { ok: false; errors: WaitlistErrors };

export type WaitlistResponseBody =
  | { ok: true }
  | { ok: false; errors?: WaitlistErrors; error?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Mensaje de error del email, en voseo y diciendo cómo arreglarlo. Vacío si está bien. */
export function validateWaitlistEmail(raw: string): string | undefined {
  const value = raw.trim();
  if (!value) return "Falta tu email, por ejemplo hola@tunegocio.com";
  if (value.length > WAITLIST_LIMITS.email) return "El email es demasiado largo. Revisalo.";
  if (!value.includes("@")) return "Falta la @ del email, por ejemplo hola@tunegocio.com";
  if (!EMAIL_RE.test(value)) return "Falta el dominio del email, por ejemplo hola@tunegocio.com";
  return undefined;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asSource(value: unknown): WaitlistSource {
  return WAITLIST_SOURCES.find((source) => source === value) ?? "hero";
}

/** Valida el body. `company` es el honeypot: si viene con algo, es un bot. */
export function validateWaitlist(input: unknown): WaitlistValidation {
  const body = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const email = asString(body.email);

  const error = validateWaitlistEmail(email);
  if (error) return { ok: false, errors: { email: error } };

  return {
    ok: true,
    honeypot: asString(body.company).trim().length > 0,
    data: { email: email.trim(), source: asSource(body.source) },
  };
}
