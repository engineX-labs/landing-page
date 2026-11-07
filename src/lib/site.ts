import {
  buildWhatsappUrl,
  formatWhatsappNumber,
  normalizeWhatsappNumber,
  SECONDARY_WHATSAPP_NUMBER,
} from "./contact";

// Se resuelve al prerenderizar la página: el número sale de la misma variable que usa el endpoint.
const number = normalizeWhatsappNumber(process.env.WHATSAPP_NUMBER);

export const whatsapp = {
  number,
  display: formatWhatsappNumber(number),
  url: buildWhatsappUrl(number),
  /** Para los botones "Escribinos": abre el chat con un saludo ya escrito. */
};

/** Los dos números de WhatsApp para contacto y pie de página (el principal va primero). */
export const whatsappLines = [number, SECONDARY_WHATSAPP_NUMBER].map((n) => ({
  display: formatWhatsappNumber(n),
  url: buildWhatsappUrl(n),
}));
