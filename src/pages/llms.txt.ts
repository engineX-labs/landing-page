import { getCollection } from "astro:content";
import type { APIRoute } from "astro";
import { buildLlmsTxt } from "../lib/seo";
import { whatsapp } from "../lib/site";

export const GET: APIRoute = async ({ site }) => {
  const projects = (
    await getCollection("projects", ({ data }) => import.meta.env.DEV || !data.draft)
  )
    .sort((a, b) => a.data.order - b.data.order)
    .map(({ data }) => ({
      title: data.title,
      client: data.client,
      summary: data.summary,
      tags: data.tags,
      // La demo es una ruta interna: en llms.txt va absoluta, o no va si no hay dominio.
      href: data.href ?? (data.demo && site ? new URL(data.demo, site).href : undefined),
    }));

  const body = buildLlmsTxt({
    site: site?.origin,
    whatsappUrl: whatsapp.url,
    whatsappDisplay: whatsapp.display,
    projects,
  });
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
};
