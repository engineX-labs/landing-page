// Datos que Fidel puede decir de engineX (sección 11 de su documento de contexto).
// Un dato vacío se le pasa al modelo como "no confirmado": nunca llegan marcadores sin completar.

/** Atención humana por WhatsApp. */
export const supportHours = "de lunes a sábados, de 10 a 18 h";

/**
 * Precio "desde" de Social Engine, ya formateado (por ejemplo "$ 15.000 por mes").
 * Lo define el equipo. Vacío, las preguntas del precio y Fidel responden sin cifra.
 */
export const PRICE_FROM = "";

export const assistantFacts = {
  /** Atención humana por WhatsApp. */
  hours: `${supportHours}, hora de Argentina`,
  /** Prueba gratuita de Social Engine. */
  trial: "7 días",
  /** Precio de Social Engine; vacío = todavía no está definido. */
  price: PRICE_FROM,
  instagram: "@enginex.labs",
} as const;

/** Frase que el widget convierte en link; el modelo nunca escribe URLs ni teléfonos. */
export const LINK_TOKENS = {
  whatsapp: { label: "WhatsApp", external: true },
  lista: { label: "la lista de espera", external: false },
} as const;
export type LinkToken = keyof typeof LINK_TOKENS;

/** Lista de espera de Social Engine. */
export const WAITLIST_HREF = "/#lista";
