// robots.txt, sitemap.xml y llms.txt, como funciones puras para poder testearlas.
import { description, faqs, services, steps } from "./content";

/** Crawlers de motores con IA, permitidos todos (búsqueda y entrenamiento). */
export const AI_CRAWLERS = [
  "OAI-SearchBot",
  "ChatGPT-User",
  "GPTBot",
  "PerplexityBot",
  "Perplexity-User",
  "Claude-SearchBot",
  "Claude-User",
  "ClaudeBot",
  "Google-Extended",
  "CCBot",
] as const;

export function buildRobotsTxt(site?: string): string {
  const rules = ["Allow: /", "Disallow: /api/"];
  const lines = [
    "User-agent: *",
    ...rules,
    "",
    "# Motores con IA (búsqueda y entrenamiento): permitidos, con las mismas reglas.",
    ...AI_CRAWLERS.map((bot) => `User-agent: ${bot}`),
    ...rules,
  ];
  if (site) lines.push("", `Sitemap: ${site}/sitemap.xml`);
  return `${lines.join("\n")}\n`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function buildSitemapXml(site: string, paths: string[], lastmod: Date): string {
  const day = lastmod.toISOString().slice(0, 10);
  const urls = paths
    .map(
      (p) =>
        `  <url>\n    <loc>${escapeXml(new URL(p, `${site}/`).href)}</loc>\n    <lastmod>${day}</lastmod>\n  </url>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export interface LlmsProject {
  title: string;
  client: string;
  summary: string;
  tags: string[];
  href?: string;
}

export function buildLlmsTxt({
  site,
  whatsappUrl,
  whatsappDisplay,
  projects,
}: {
  site?: string;
  whatsappUrl: string;
  whatsappDisplay: string;
  projects: LlmsProject[];
}): string {
  const link = (anchor: string) => (site ? `${site}/#${anchor}` : `/#${anchor}`);
  const out: string[] = [
    "# engineX",
    "",
    `> Agencia de software de Argentina. ${description}`,
    "",
    "engineX diseña y desarrolla sistemas a medida para negocios que quieren crecer. Trabaja en español, con propuesta y presupuesto sin cargo, y responde las consultas en 24 h.",
    "",
    "## Servicios",
    "",
    ...services.map((s) => `- [${s.title}](${link("servicios")}): ${s.text}`),
    "",
    "## Proyectos",
    "",
    ...projects.map((p) => {
      const title = p.href ? `[${p.title}](${p.href})` : p.title;
      return `- ${title} (${p.client}): ${p.summary} Stack: ${p.tags.join(", ")}.`;
    }),
    "",
    "## Cómo trabajamos",
    "",
    ...steps.map((s, i) => `${i + 1}. ${s.title}: ${s.text}`),
    "",
    "## Preguntas frecuentes",
    "",
    ...faqs.flatMap((f) => [`### ${f.question}`, "", f.answer, ""]),
    "## Contacto",
    "",
    `- [Formulario de contacto](${link("contacto")})`,
    `- [WhatsApp ${whatsappDisplay}](${whatsappUrl})`,
  ];
  return `${out.join("\n")}\n`;
}
