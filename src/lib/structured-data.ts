// Datos estructurados (JSON-LD) de engineX. Solo datos reales: sin dirección, redes ni reseñas.
import { description, faqs, services } from "./content";

interface StructuredDataInput {
  /** Origen del sitio, por ejemplo "https://enginex.com.ar". Sin dominio no hay URLs. */
  site?: string;
  /** Número de WhatsApp solo con dígitos, por ejemplo "5493548545460". */
  whatsappNumber: string;
}

export function buildStructuredData({ site, whatsappNumber }: StructuredDataInput) {
  const orgId = site ? `${site}/#organization` : "#organization";
  const organization: Record<string, unknown> = {
    "@type": ["Organization", "ProfessionalService"],
    "@id": orgId,
    name: "engineX",
    description,
    areaServed: { "@type": "Country", name: "Argentina", identifier: "AR" },
    knowsAbout: services.map((s) => s.title),
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "sales",
      telephone: `+${whatsappNumber}`,
      availableLanguage: "es",
      url: `https://wa.me/${whatsappNumber}`,
    },
  };
  if (site) {
    organization.url = `${site}/`;
    organization.logo = `${site}/brand/enginex-app-icon-512.png`;
  }

  const graph: Record<string, unknown>[] = [organization];
  if (site) {
    graph.push({
      "@type": "WebSite",
      "@id": `${site}/#website`,
      name: "engineX",
      url: `${site}/`,
      inLanguage: "es-AR",
      publisher: { "@id": orgId },
    });
  }

  // Las mismas preguntas que muestra la sección "Preguntas frecuentes" de la home.
  graph.push({
    "@type": "FAQPage",
    ...(site ? { "@id": `${site}/#preguntas`, url: `${site}/#preguntas` } : {}),
    inLanguage: "es-AR",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  });

  return { "@context": "https://schema.org", "@graph": graph };
}

/** JSON listo para un <script type="application/ld+json">, sin poder cerrar el tag. */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
