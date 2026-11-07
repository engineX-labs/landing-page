import { describe, expect, it } from "vitest";
import {
  apiBaseFromEnv,
  durationFromEnv,
  intFromEnv,
  numberFromEnv,
} from "../../src/lib/env-values";

describe("intFromEnv", () => {
  it("lee un entero positivo", () => {
    expect(intFromEnv("15000", 1)).toBe(15000);
    expect(intFromEnv(" 7 ", 1)).toBe(7);
  });

  it.each([undefined, "", "   ", "abc", "1.5", "0", "-3", "12abc", "1e3"])(
    "vuelve al valor por defecto con %j",
    (raw) => {
      expect(intFromEnv(raw, 42)).toBe(42);
    },
  );

  it("respeta el mínimo y el máximo: fuera de rango vuelve al default", () => {
    expect(intFromEnv("5", 10, { min: 5, max: 20 })).toBe(5);
    expect(intFromEnv("4", 10, { min: 5, max: 20 })).toBe(10);
    expect(intFromEnv("21", 10, { min: 5, max: 20 })).toBe(10);
  });
});

describe("numberFromEnv", () => {
  it("lee decimales dentro del rango, incluido el 0", () => {
    expect(numberFromEnv("0.7", 0.4, { min: 0, max: 2 })).toBe(0.7);
    expect(numberFromEnv("0", 0.4, { min: 0, max: 2 })).toBe(0);
  });

  it.each([undefined, "", "x", "NaN", "Infinity", "-0.1", "2.1"])(
    "vuelve al default con %j",
    (raw) => {
      expect(numberFromEnv(raw, 0.4, { min: 0, max: 2 })).toBe(0.4);
    },
  );
});

describe("durationFromEnv", () => {
  it("acepta número y unidad, con o sin espacio, y lo normaliza", () => {
    expect(durationFromEnv("10 m", "1 h")).toBe("10 m");
    expect(durationFromEnv("30s", "1 h")).toBe("30 s");
    expect(durationFromEnv(" 2 h ", "1 m")).toBe("2 h");
  });

  it.each([undefined, "", "10", "m", "10 minutos", "-5 m", "0 m", "1.5 h", "10 w"])(
    "vuelve al default con %j",
    (raw) => {
      expect(durationFromEnv(raw, "10 m")).toBe("10 m");
    },
  );
});

describe("apiBaseFromEnv", () => {
  const fallback = "https://generativelanguage.googleapis.com/v1beta";

  it("acepta https y saca la barra final", () => {
    expect(apiBaseFromEnv("https://proxy.example.com/v1beta/", fallback)).toBe(
      "https://proxy.example.com/v1beta",
    );
  });

  it("acepta http solo hacia la propia máquina (tests y desarrollo)", () => {
    expect(apiBaseFromEnv("http://127.0.0.1:9999/v1beta", fallback)).toBe(
      "http://127.0.0.1:9999/v1beta",
    );
    expect(apiBaseFromEnv("http://localhost:9999", fallback)).toBe("http://localhost:9999");
  });

  it("rechaza http hacia afuera, otros protocolos, credenciales en la URL y basura: la key viaja en un header", () => {
    for (const raw of [
      "http://proxy.example.com/v1beta",
      "ftp://proxy.example.com",
      "https://user:pass@proxy.example.com",
      "proxy.example.com",
      "",
      undefined,
    ]) {
      expect(apiBaseFromEnv(raw, fallback)).toBe(fallback);
    }
  });
});
