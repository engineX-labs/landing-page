import type { APIRoute } from "astro";
import { buildLlmsTxt } from "../lib/seo";
import { whatsappLines } from "../lib/site";

export const GET: APIRoute = ({ site }) =>
  new Response(buildLlmsTxt({ site: site?.origin, whatsapp: whatsappLines }), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
