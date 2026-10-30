import type { APIRoute } from "astro";
import {
  handleWaitlist,
  type WaitlistConfig,
  waitlistConfigFromEnv,
} from "../../lib/waitlist-server";

// Como /api/contact, corre en el servidor (en Vercel es una función serverless).
export const prerender = false;

// Se arma en el primer request (con las variables de runtime) y se reusa mientras viva la instancia.
let config: WaitlistConfig | undefined;

export const POST: APIRoute = ({ request }) => {
  config ??= waitlistConfigFromEnv();
  return handleWaitlist(request, config);
};
