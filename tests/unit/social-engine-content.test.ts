import { describe, expect, it } from "vitest";
import {
  benefits,
  faqs,
  heroTitleText,
  howItWorks,
  modules,
  networks,
  pageDescription,
  trial,
} from "../../src/lib/social-engine-content";

describe("contenido de Social Engine", () => {
  it("el título para lectores de pantalla lista los cuatro verbos, solo el primero con mayúscula", () => {
    expect(heroTitleText).toBe(
      "Entendé, compará, decidí y mejorá lo que funciona en tus redes sin descifrar métricas",
    );
  });

  it("describe el MVP: cuatro módulos con claves únicas, cuatro pasos y solo Instagram y Facebook", () => {
    expect(modules.map((m) => m.key)).toEqual(["connect", "report", "chat", "ideas"]);
    expect(howItWorks).toHaveLength(4);
    expect(benefits).toHaveLength(3);
    expect([...networks]).toEqual(["Instagram", "Facebook"]);
  });

  it("no promete lo que el MVP no tiene: programar, bandeja, automatizaciones ni otras redes", () => {
    const text = JSON.stringify({ modules, howItWorks, benefits, faqs, trial, pageDescription });
    expect(text).not.toMatch(
      /TikTok|LinkedIn|YouTube|MCP|ChatGPT|Claude|calendario|bandeja|automatizacion/i,
    );
  });

  it("no publica precios ni cifras de uso inventadas; la prueba es de 7 días", () => {
    const text = JSON.stringify({ faqs, trial, modules });
    expect(text).not.toMatch(/US\$|USD|\$\s?\d|\d+\s?%|\d+\.\d{3}\s+(empresas|clientes)/i);
    expect(trial.points).toContain("Prueba gratuita de 7 días");
    expect(faqs.some((f) => f.question === "¿Hay prueba gratuita?")).toBe(true);
  });

  it("el copy no usa tuteo", () => {
    const text = JSON.stringify({ faqs, modules, howItWorks, benefits, trial });
    expect(text).not.toMatch(/\b(tienes|puedes|quieres|tu equipo puede)\b/i);
  });
});
