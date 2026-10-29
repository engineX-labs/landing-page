import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const projects = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/projects" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      client: z.string(),
      /** El resultado para el cliente, no la tecnología. */
      summary: z.string(),
      tags: z.array(z.string()).max(5).default([]),
      image: image().optional(),
      imageAlt: z.string().optional(),
      href: z.url().optional(),
      /** Página de la demo interactiva (`/demo/...`). La tarjeta la abre en un modal. */
      demo: z
        .string()
        .regex(/^\/[\w\-/]+$/)
        .optional(),
      cta: z.string().optional(),
      /** Etiqueta sobre la captura: qué pasa al tocar la tarjeta ("Demo interactiva", "Sitio en vivo"). */
      badge: z.string().optional(),
      order: z.number().default(100),
      /** Los borradores se ven en desarrollo y no salen en el build de producción. */
      draft: z.boolean().default(false),
    }),
});

export const collections = { projects };
