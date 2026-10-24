// @ts-check
import node from "@astrojs/node";
import vercel from "@astrojs/vercel";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import { loadEnv } from "vite";
import { resolveSiteUrl } from "./site.config.mjs";

// El .env no llega solo a process.env: lo cargamos acá para el build y el dev
// (lo que ya viene en el entorno tiene prioridad).
const mode = process.argv.includes("dev") ? "development" : "production";
for (const [key, value] of Object.entries(loadEnv(mode, process.cwd(), ""))) {
  process.env[key] ??= value;
}

// El dominio se configura en site.config.mjs (o con SITE_URL).
const site = resolveSiteUrl();
if (!site) {
  console.warn(
    "\n[engineX] Falta SITE_URL: se compila sin sitemap.xml ni URLs absolutas. Configuralo en site.config.mjs.\n",
  );
}

// Vercel define VERCEL=1 en sus builds: ahí va su adapter. En el resto (dev, preview, e2e,
// servidor propio) se usa Node.
const onVercel = Boolean(process.env.VERCEL);
const hasRedis = Boolean(
  (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL) &&
    (process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN),
);
if (onVercel && !hasRedis) {
  console.warn(
    "\n[engineX] Build en Vercel sin Upstash Redis: el formulario no va a poder guardar mensajes. Conectalo desde Storage.\n",
  );
}

/** /sitemap.xml solo existe con dominio: un sitemap sin URLs absolutas no sirve. */
function sitemapWhenSite() {
  return {
    name: "enginex-sitemap",
    hooks: {
      /** @param {{ injectRoute: (route: { pattern: string; entrypoint: string; prerender?: boolean }) => void }} options */
      "astro:config:setup": ({ injectRoute }) => {
        if (site) {
          injectRoute({
            pattern: "/sitemap.xml",
            entrypoint: "./src/routes/sitemap.xml.ts",
            prerender: true,
          });
        }
      },
    },
  };
}

// Sitio prerenderizado; solo /api/contact corre en el servidor (prerender = false).
export default defineConfig({
  site,
  output: "static",
  // Con Node, el único endpoint recibe un JSON chico: el default del adapter es 1 GB.
  adapter: onVercel ? vercel() : node({ mode: "standalone", bodySizeLimit: 64 * 1024 }),
  // Astro 7 usa 'jsx' por defecto y se come los espacios entre elementos inline.
  compressHTML: true,
  integrations: [sitemapWhenSite()],
  vite: {
    plugins: [tailwindcss()],
  },
});
