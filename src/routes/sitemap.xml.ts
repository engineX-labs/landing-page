import type { APIRoute } from "astro";
import { buildSitemapXml, sitePaths } from "../lib/seo";

// Se registra desde astro.config.mjs solo cuando hay SITE_URL.
export const GET: APIRoute = ({ site }) => {
  if (!site) return new Response("Falta SITE_URL", { status: 404 });
  return new Response(buildSitemapXml(site.origin, sitePaths, new Date()), {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
};
