// Número de WhatsApp de engineX: normalización, formato y links de wa.me.

export const DEFAULT_WHATSAPP_NUMBER = "5493548545450";
/** Segundo número de WhatsApp de engineX, que se muestra junto al principal. */
export const SECONDARY_WHATSAPP_NUMBER = "5493571609047";

/** Deja solo dígitos; si no queda nada válido, usa el número por defecto. */
export function normalizeWhatsappNumber(value: string | undefined): string {
  const digits = (value ?? "").replace(/\D/g, "");
  return digits.length >= 8 ? digits : DEFAULT_WHATSAPP_NUMBER;
}

export function buildWhatsappUrl(number: string, text?: string): string {
  const base = `https://wa.me/${normalizeWhatsappNumber(number)}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

/** "5493548545450" → "+54 9 3548 54-5450". Otros formatos quedan como "+<dígitos>". */
export function formatWhatsappNumber(number: string): string {
  const d = normalizeWhatsappNumber(number);
  if (/^549\d{10}$/.test(d)) return `+54 9 ${d.slice(3, 7)} ${d.slice(7, 9)}-${d.slice(9)}`;
  return `+${d}`;
}
