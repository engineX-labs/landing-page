import { buildWhatsappUrl, formatWhatsappNumber, normalizeWhatsappNumber } from "./contact";

// Se resuelve al prerenderizar la página: el número sale de la misma variable que usa el endpoint.
const number = normalizeWhatsappNumber(process.env.WHATSAPP_NUMBER);

export const whatsapp = {
  number,
  display: formatWhatsappNumber(number),
  url: buildWhatsappUrl(number),
};

export const nav = [
  { href: "#servicios", label: "Servicios" },
  { href: "#proyectos", label: "Proyectos" },
  { href: "#como-trabajamos", label: "Cómo trabajamos" },
  { href: "#contacto", label: "Contacto" },
] as const;
