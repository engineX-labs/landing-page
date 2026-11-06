import { getCollection } from "astro:content";
import type { APIRoute } from "astro";
import {
  assistantConfigFromEnv,
  handleAssistant,
  handleAssistantStatus,
} from "../../lib/assistant-server";

// Ruta server de Fidel; la key de Gemini solo existe acá.
export const prerender = false;

async function config() {
  const projects = (await getCollection("projects", ({ data }) => !data.draft))
    .sort((a, b) => a.data.order - b.data.order)
    .map(({ data }) => ({
      title: data.title,
      client: data.client,
      summary: data.summary,
      tags: data.tags,
    }));
  return assistantConfigFromEnv(projects);
}

export const GET: APIRoute = async () => handleAssistantStatus(await config());

export const POST: APIRoute = async ({ request }) => handleAssistant(request, await config());
