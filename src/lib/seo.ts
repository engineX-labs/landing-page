// robots.txt, sitemap.xml y llms.txt, como funciones puras para poder testearlas.
import { supportHours } from "./assistant-config";
import { companyDescription, faqs, pageDescription, productName } from "./social-engine-content";

/** Páginas indexables, para el sitemap. */
export const sitePaths = ["/"];

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

export function buildLlmsTxt({
  site,
  whatsapp,
}: {
  site?: string;
  whatsapp: { display: string; url: string }[];
}): string {
  const out: string[] = [
    `# ${productName}`,
    "",
    `> ${pageDescription}`,
    "",
    `${productName} es un producto de engineX, empresa de software de Argentina. ${companyDescription} Trabaja en español y atiende por WhatsApp ${supportHours}, hora de Argentina.`,
    "",
    "## Preguntas frecuentes",
    "",
    ...faqs.flatMap((f) => [`### ${f.question}`, "", f.answer, ""]),
    "## Contacto",
    "",
    `- [Lista de espera](${site ? `${site}/#lista` : "/#lista"})`,
    ...whatsapp.map((w) => `- [WhatsApp ${w.display}](${w.url})`),
  ];
  return `${out.join("\n")}\n`;
}
