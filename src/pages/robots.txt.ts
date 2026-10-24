import type { APIRoute } from "astro";
import { buildRobotsTxt } from "../lib/seo";

export const GET: APIRoute = ({ site }) =>
  new Response(buildRobotsTxt(site?.origin), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
