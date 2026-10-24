import type { APIRoute } from "astro";
import { type ContactConfig, contactConfigFromEnv, handleContact } from "../../lib/contact-server";

// Única ruta server del sitio; el resto se prerenderiza. En Vercel es una función serverless.
export const prerender = false;

// Se arma en el primer request (con las variables de runtime) y se reusa mientras viva la instancia.
let config: ContactConfig | undefined;

export const POST: APIRoute = ({ request }) => {
  config ??= contactConfigFromEnv();
  return handleContact(request, config);
};
