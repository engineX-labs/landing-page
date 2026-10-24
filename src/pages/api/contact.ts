import type { APIRoute } from "astro";
import { contactConfigFromEnv, handleContact } from "../../lib/contact-server";

// Única ruta server del sitio; el resto se prerenderiza.
export const prerender = false;

export const POST: APIRoute = ({ request }) => handleContact(request, contactConfigFromEnv());
