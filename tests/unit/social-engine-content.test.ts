import { describe, expect, it } from "vitest";
import {
  benefits,
  faqs,
  heroTitleText,
  howItWorks,
  modules,
  planGuarantees,
  plans,
} from "../../src/lib/social-engine-content";

describe("contenido de Social Engine", () => {
  it("el título para lectores de pantalla lista los cuatro verbos, solo el primero con mayúscula", () => {
    expect(heroTitleText).toBe(
      "Planificá, publicá, respondé y medí tus redes sin saltar de app en app",
    );
  });

  it("hay siete módulos con claves únicas y cuatro pasos", () => {
    expect(modules).toHaveLength(7);
    expect(new Set(modules.map((m) => m.key)).size).toBe(7);
    expect(howItWorks).toHaveLength(4);
    expect(benefits).toHaveLength(3);
  });

  it("no publica precios ni cifras de uso inventadas", () => {
    const text = JSON.stringify({ plans, faqs, planGuarantees, modules });
    expect(text).not.toMatch(/US\$|USD|\$\s?\d|\d+\s?%|\d+\.\d{3}\s+(empresas|clientes)/i);
  });

  it("un solo plan es el recomendado y el copy no usa tuteo", () => {
    expect(plans.filter((p) => p.featured)).toHaveLength(1);
    const text = JSON.stringify({ plans, faqs, modules, howItWorks, benefits });
    expect(text).not.toMatch(/\b(tienes|puedes|quieres|tu equipo puede)\b/i);
  });
});
