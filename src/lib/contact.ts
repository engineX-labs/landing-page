// Validación del formulario de contacto y armado del mensaje de WhatsApp.
// Funciones puras: las usan el endpoint /api/contact y el script del formulario.

export const DEFAULT_WHATSAPP_NUMBER = "5493548545460";

export const LIMITS = {
  name: 100,
  email: 254,
  message: 2000,
  /** Tamaño máximo del body del request, en bytes. */
  body: 10_000,
} as const;

export type ContactField = "name" | "email" | "message";

export interface ContactInput {
  name: string;
  email: string;
  message: string;
}

export type ContactErrors = Partial<Record<ContactField, string>>;

export type ValidationResult =
  | { ok: true; data: ContactInput; honeypot: boolean }
  | { ok: false; errors: ContactErrors };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Mensaje de error de un campo, en voseo y diciendo cómo arreglarlo. Vacío si está bien. */
export function validateField(field: ContactField, raw: string): string | undefined {
  const value = raw.trim();
  if (field === "name") {
    if (!value) return "Falta tu nombre, así sabemos cómo llamarte.";
    if (value.length > LIMITS.name) return `Usá hasta ${LIMITS.name} caracteres.`;
    return undefined;
  }
  if (field === "email") {
    if (!value) return "Falta tu email, por ejemplo hola@tunegocio.com";
    if (value.length > LIMITS.email) return "El email es demasiado largo. Revisalo.";
    if (!value.includes("@")) return "Falta la @ del email, por ejemplo hola@tunegocio.com";
    if (!EMAIL_RE.test(value)) return "Falta el dominio del email, por ejemplo hola@tunegocio.com";
    return undefined;
  }
  if (!value) return "Contanos qué necesitás, aunque sea en una línea.";
  if (value.length > LIMITS.message)
    return `Usá hasta ${LIMITS.message} caracteres. Si es más largo, lo seguimos por WhatsApp.`;
  return undefined;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/** Valida el body del formulario. `company` es el honeypot: si viene con algo, es un bot. */
export function validateContact(input: unknown): ValidationResult {
  const body = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const raw: ContactInput = {
    name: asString(body.name),
    email: asString(body.email),
    message: asString(body.message),
  };

  const errors: ContactErrors = {};
  for (const field of ["name", "email", "message"] as const) {
    const error = validateField(field, raw[field]);
    if (error) errors[field] = error;
  }
  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    honeypot: asString(body.company).trim().length > 0,
    data: {
      name: raw.name.trim(),
      email: raw.email.trim(),
      message: raw.message.trim(),
    },
  };
}

/** Deja solo dígitos; si no queda nada válido, usa el número por defecto. */
export function normalizeWhatsappNumber(value: string | undefined): string {
  const digits = (value ?? "").replace(/\D/g, "");
  return digits.length >= 8 ? digits : DEFAULT_WHATSAPP_NUMBER;
}

export function buildWhatsappText({ name, email, message }: ContactInput): string {
  return `Hola engineX, soy ${name} (${email}).\n\n${message}`;
}

export function buildWhatsappUrl(number: string, text?: string): string {
  const base = `https://wa.me/${normalizeWhatsappNumber(number)}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

/** "5493548545460" → "+54 9 3548 54-5460". Otros formatos quedan como "+<dígitos>". */
export function formatWhatsappNumber(number: string): string {
  const d = normalizeWhatsappNumber(number);
  if (/^549\d{10}$/.test(d)) return `+54 9 ${d.slice(3, 7)} ${d.slice(7, 9)}-${d.slice(9)}`;
  return `+${d}`;
}
