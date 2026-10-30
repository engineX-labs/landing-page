import {
  buildWhatsappUrl,
  formatWhatsappNumber,
  normalizeWhatsappNumber,
  SECONDARY_WHATSAPP_NUMBER,
} from "./contact";
import { whatsappGreeting } from "./content";

// Se resuelve al prerenderizar la página: el número sale de la misma variable que usa el endpoint.
const number = normalizeWhatsappNumber(process.env.WHATSAPP_NUMBER);

export const whatsapp = {
  number,
  display: formatWhatsappNumber(number),
  url: buildWhatsappUrl(number),
  /** Para los botones "Escribinos": abre el chat con un saludo ya escrito. */
  chatUrl: buildWhatsappUrl(number, whatsappGreeting),
};

/** Los dos números de WhatsApp para contacto y pie de página (el principal va primero). */
export const whatsappLines = [number, SECONDARY_WHATSAPP_NUMBER].map((n) => ({
  display: formatWhatsappNumber(n),
  url: buildWhatsappUrl(n),
  chatUrl: buildWhatsappUrl(n, whatsappGreeting),
}));

/** Página de la demo: con JS se abre en el modal (`DemoDialog`). */
export const demoHref = "/demo/freggiaro";

export const nav = [
  { href: "#servicios", label: "Servicios" },
  { href: "#proyectos", label: "Proyectos" },
  { href: "#como-trabajamos", label: "Cómo trabajamos" },
  { href: demoHref, label: "Demo", demo: true },
  { href: "#contacto", label: "Contacto" },
] as const;
