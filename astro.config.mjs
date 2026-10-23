// @ts-check
import node from "@astrojs/node";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

// Sitio prerenderizado; solo /api/contact corre en el servidor (prerender = false).
export default defineConfig({
  output: "static",
  adapter: node({ mode: "standalone" }),
  // Astro 7 usa 'jsx' por defecto y se come los espacios entre elementos inline.
  compressHTML: true,
  vite: {
    plugins: [tailwindcss()],
  },
});
