import type { APIRoute } from "astro";
import {
  assistantConfigFromEnv,
  handleAssistant,
  handleAssistantStatus,
} from "../../lib/assistant-server";

// Ruta server de Fidel; la key de Gemini solo existe acá.
export const prerender = false;

export const GET: APIRoute = async () => handleAssistantStatus(assistantConfigFromEnv());

export const POST: APIRoute = async ({ request }) =>
  handleAssistant(request, assistantConfigFromEnv());
