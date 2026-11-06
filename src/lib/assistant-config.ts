// Datos que Fidel puede decir de engineX (sección 11 de su documento de contexto).
// Un dato vacío se le pasa al modelo como "no confirmado": nunca llegan marcadores sin completar.
import { evaluatingProducts, PRICE_FROM, supportHours } from "./content";

export const assistantFacts = {
  /** Atención humana por WhatsApp. */
  hours: `${supportHours}, hora de Argentina`,
  /** Prueba gratuita de Social Engine. */
  trial: "7 días",
  /** Precio de Social Engine; vacío = todavía no está definido. */
  price: PRICE_FROM,
  /** Líneas de producto en evaluación. */
  evaluating: evaluatingProducts,
  instagram: "@enginex.labs",
} as const;

/** Frase que el widget convierte en link; el modelo nunca escribe URLs ni teléfonos. */
export const LINK_TOKENS = {
  whatsapp: { label: "WhatsApp", external: true },
  lista: { label: "la lista de espera", external: false },
} as const;
export type LinkToken = keyof typeof LINK_TOKENS;

/** Lista de espera de Social Engine. */
export const WAITLIST_HREF = "/social-engine#lista";
