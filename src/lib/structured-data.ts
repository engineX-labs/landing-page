// Datos estructurados (JSON-LD) de Social Engine y de engineX. Solo datos reales: sin dirección, redes ni reseñas.
import {
  companyDescription,
  pageDescription,
  productName,
  faqs as socialEngineFaqs,
} from "./social-engine-content";

interface StructuredDataInput {
  /** Origen del sitio, por ejemplo "https://enginex.com.ar". Sin dominio no hay URLs. */
  site?: string;
  /** Número de WhatsApp solo con dígitos, por ejemplo "5493548545450". */
  whatsappNumber: string;
}

/**
 * Datos de la página: la organización, el sitio, la aplicación (sin `offers`, todavía no hay
 * precios) y las preguntas frecuentes.
 */
export function buildStructuredData({ site, whatsappNumber }: StructuredDataInput) {
  const orgId = site ? `${site}/#organization` : "#organization";
  const organization: Record<string, unknown> = {
    "@type": "Organization",
    "@id": orgId,
    name: "engineX",
    description: companyDescription,
    areaServed: { "@type": "Country", name: "Argentina", identifier: "AR" },
    knowsAbout: ["Métricas de redes sociales", "Instagram", "Facebook"],
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
      name: productName,
      url: `${site}/`,
      inLanguage: "es-AR",
      publisher: { "@id": orgId },
    });
  }
  graph.push({
    "@type": "SoftwareApplication",
    name: productName,
    description: pageDescription,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    inLanguage: "es-AR",
    publisher: { "@id": orgId },
    ...(site ? { url: `${site}/` } : {}),
  });
  graph.push({
    "@type": "FAQPage",
    ...(site ? { "@id": `${site}/#preguntas`, url: `${site}/#preguntas` } : {}),
    inLanguage: "es-AR",
    mainEntity: socialEngineFaqs.map((f) => ({
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
