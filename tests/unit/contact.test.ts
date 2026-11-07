import { describe, expect, it } from "vitest";
import {
  buildWhatsappUrl,
  DEFAULT_WHATSAPP_NUMBER,
  formatWhatsappNumber,
  normalizeWhatsappNumber,
  SECONDARY_WHATSAPP_NUMBER,
} from "../../src/lib/contact";

describe("WhatsApp", () => {
  it("codifica acentos, &, ? y saltos de línea del texto", () => {
    const url = buildWhatsappUrl("5493548545450", "Hola & ¿qué tal?\nGracias");
    expect(url.startsWith("https://wa.me/5493548545450?text=")).toBe(true);
    expect(new URL(url).searchParams.get("text")).toBe("Hola & ¿qué tal?\nGracias");
    expect(url).toContain("%26");
    expect(url).toContain("%3F");
    expect(url).toContain("%0A");
  });

  it("sin texto devuelve el link pelado", () => {
    expect(buildWhatsappUrl("5493548545450")).toBe("https://wa.me/5493548545450");
  });

  it("limpia el número y usa el de desarrollo si no hay uno válido", () => {
    expect(normalizeWhatsappNumber("+54 9 3548 54-5450")).toBe("5493548545450");
    expect(normalizeWhatsappNumber(undefined)).toBe(DEFAULT_WHATSAPP_NUMBER);
    expect(normalizeWhatsappNumber("abc")).toBe(DEFAULT_WHATSAPP_NUMBER);
  });

  it("formatea el número para mostrarlo", () => {
    expect(formatWhatsappNumber("5493548545450")).toBe("+54 9 3548 54-5450");
    expect(formatWhatsappNumber(SECONDARY_WHATSAPP_NUMBER)).toBe("+54 9 3571 60-9047");
    expect(formatWhatsappNumber("14155550100")).toBe("+14155550100");
  });
});
