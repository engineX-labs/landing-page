// @ts-check
import node from "@astrojs/node";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

// Sitio prerenderizado; solo /api/contact corre en el servidor (prerender = false).
export default defineConfig({
  output: "static",
  // El único endpoint recibe un JSON chico: el default del adapter es 1 GB.
  adapter: node({ mode: "standalone", bodySizeLimit: 64 * 1024 }),
  // Astro 7 usa 'jsx' por defecto y se come los espacios entre elementos inline.
  compressHTML: true,
  vite: {
    plugins: [tailwindcss()],
  },
});
