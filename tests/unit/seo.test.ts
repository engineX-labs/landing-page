import { describe, expect, it } from "vitest";
import { parseSiteUrl, resolveSiteUrl } from "../../site.config.mjs";
import {
  AI_CRAWLERS,
  buildLlmsTxt,
  buildRobotsTxt,
  buildSitemapXml,
  sitePaths,
} from "../../src/lib/seo";
import { faqs } from "../../src/lib/social-engine-content";
import { buildStructuredData, serializeJsonLd } from "../../src/lib/structured-data";

const SITE = "https://enginex.com.ar";

describe("SITE_URL", () => {
  it("acepta un dominio con https", () => {
    expect(parseSiteUrl(SITE)).toBe(SITE);
    expect(parseSiteUrl(`  ${SITE}  `)).toBe(SITE);
  });

  it("vacío significa sin dominio", () => {
    expect(parseSiteUrl("")).toBeUndefined();
    expect(parseSiteUrl(undefined)).toBeUndefined();
  });

  it.each([
    ["sin https", "http://enginex.com.ar", /https/],
    ["sin protocolo", "enginex.com.ar", /no es una URL/],
    ["con barra final", "https://enginex.com.ar/", /sin barra final/],
    ["con ruta", "https://enginex.com.ar/landing", /sin barra final ni ruta/],
    ["con puerto", "https://enginex.com.ar:8443", /puerto/],
  ])("rechaza un dominio %s", (_, value, message) => {
    expect(() => parseSiteUrl(value)).toThrow(message);
  });

  it("la variable de entorno tiene prioridad", () => {
    expect(resolveSiteUrl({ SITE_URL: "https://otro.com" })).toBe("https://otro.com");
  });
});

describe("robots.txt", () => {
  it("con dominio apunta al sitemap absoluto y bloquea la API", () => {
    const robots = buildRobotsTxt(SITE);
    expect(robots).toContain("User-agent: *\nAllow: /\nDisallow: /api/");
    expect(robots).toContain(`Sitemap: ${SITE}/sitemap.xml`);
  });

  it("sin dominio no publica la línea Sitemap", () => {
    expect(buildRobotsTxt()).not.toContain("Sitemap:");
  });

  it("permite los crawlers de IA con las mismas reglas", () => {
    const robots = buildRobotsTxt(SITE);
    for (const bot of AI_CRAWLERS) expect(robots).toContain(`User-agent: ${bot}`);
    for (const bot of ["GPTBot", "ClaudeBot", "Google-Extended", "CCBot", "PerplexityBot"]) {
      expect(AI_CRAWLERS).toContain(bot);
    }
    // Un grupo propio reemplaza al de "*": tiene que repetir el bloqueo de /api/.
    expect(robots.match(/Disallow: \/api\//g)).toHaveLength(2);
    expect(robots).not.toMatch(/Disallow: \/\s*$/m);
  });
});

describe("sitemap.xml", () => {
  it("lista la home con URL absoluta y fecha", () => {
    const xml = buildSitemapXml(SITE, ["/"], new Date("2026-10-23T12:00:00Z"));
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(xml).toContain(`<loc>${SITE}/</loc>`);
    expect(xml).toContain("<lastmod>2026-10-23</lastmod>");
    expect(xml).not.toContain("/api");
  });

  it("escapa caracteres especiales de XML", () => {
    expect(buildSitemapXml(SITE, ["/a?b=1&c=2"], new Date())).toContain("/a?b=1&amp;c=2");
  });
});

describe("JSON-LD", () => {
  it("describe a engineX con dominio y WhatsApp, sin datos inventados", () => {
    const data = buildStructuredData({ site: SITE, whatsappNumber: "5493548545450" });
    const [org, website, app] = data["@graph"];
    expect(org).toMatchObject({
      name: "engineX",
      url: `${SITE}/`,
      logo: `${SITE}/brand/enginex-app-icon-512.png`,
      contactPoint: { telephone: "+5493548545450", contactType: "sales" },
    });
    expect(org).not.toHaveProperty("address");
    expect(org).not.toHaveProperty("sameAs");
    expect(org).not.toHaveProperty("aggregateRating");
    expect(website).toMatchObject({ "@type": "WebSite", url: `${SITE}/`, inLanguage: "es-AR" });
    expect(app).toMatchObject({
      "@type": "SoftwareApplication",
      name: "Social Engine",
      applicationCategory: "BusinessApplication",
      url: `${SITE}/`,
      publisher: { "@id": `${SITE}/#organization` },
    });
    expect(app).not.toHaveProperty("offers");
  });

  it("sin dominio no publica URLs del sitio", () => {
    const data = buildStructuredData({ whatsappNumber: "5493548545450" });
    expect(data["@graph"].map((n) => n["@type"])).toEqual([
      "Organization",
      "SoftwareApplication",
      "FAQPage",
    ]);
    for (const node of data["@graph"]) {
      expect(node).not.toHaveProperty("url");
      expect(node).not.toHaveProperty("logo");
    }
    expect(JSON.stringify(data)).not.toContain("undefined");
  });

  it("publica las preguntas frecuentes de la página como FAQPage", () => {
    const data = buildStructuredData({ site: SITE, whatsappNumber: "5493548545450" });
    const faq = data["@graph"].find((n) => n["@type"] === "FAQPage");
    expect(faq).toMatchObject({ url: `${SITE}/#preguntas`, inLanguage: "es-AR" });
    const entities = faq?.mainEntity as { name: string; acceptedAnswer: { text: string } }[];
    expect(entities).toHaveLength(faqs.length);
    expect(entities.map((q) => q.name)).toEqual(faqs.map((f) => f.question));
    expect(entities.every((q) => q.acceptedAnswer.text.length > 0)).toBe(true);
  });

  it("no deja cerrar el <script> desde los datos", () => {
    expect(serializeJsonLd({ a: "</script><script>" })).not.toContain("</script>");
  });
});

describe("llms.txt", () => {
  const base = {
    whatsapp: [
      { display: "+54 9 3548 54-5450", url: "https://wa.me/5493548545450" },
      { display: "+54 9 3571 60-9047", url: "https://wa.me/5493571609047" },
    ],
  };

  it("presenta Social Engine, sus preguntas y el contacto con URLs absolutas", () => {
    const txt = buildLlmsTxt({ ...base, site: SITE });
    expect(txt.startsWith("# Social Engine\n")).toBe(true);
    expect(txt).toContain("## Preguntas frecuentes");
    expect(txt).toContain(`### ${faqs[0].question}`);
    expect(txt).toContain(`[Lista de espera](${SITE}/#lista)`);
    expect(txt).toContain("[WhatsApp +54 9 3548 54-5450](https://wa.me/5493548545450)");
    expect(txt).toContain("[WhatsApp +54 9 3571 60-9047](https://wa.me/5493571609047)");
  });

  it("sin dominio usa rutas relativas", () => {
    expect(buildLlmsTxt(base)).toContain("[Lista de espera](/#lista)");
  });

  it("no menciona servicios a medida, proyectos ni la demo", () => {
    expect(buildLlmsTxt({ ...base, site: SITE })).not.toMatch(
      /a medida|Servicios|Proyectos|Freggiaro|Reservo|formulario/i,
    );
  });
});

describe("sitio de una sola página", () => {
  it("el sitemap incluye solo la raíz", () => {
    expect(sitePaths).toEqual(["/"]);
    const xml = buildSitemapXml(SITE, sitePaths, new Date("2026-11-01T12:00:00Z"));
    expect(xml).toContain(`<loc>${SITE}/</loc>`);
    expect(xml).not.toContain("/social-engine");
  });
});
