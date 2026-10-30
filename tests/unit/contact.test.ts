import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  buildWhatsappText,
  buildWhatsappUrl,
  DEFAULT_WHATSAPP_NUMBER,
  formatWhatsappNumber,
  LIMITS,
  normalizeWhatsappNumber,
  SECONDARY_WHATSAPP_NUMBER,
  validateContact,
  validateField,
} from "../../src/lib/contact";
import { contactConfigFromEnv, handleContact } from "../../src/lib/contact-server";
import { FileContactStore } from "../../src/lib/contact-store";

const valid = {
  name: "Ana Pérez",
  email: "ana@tunegocio.com",
  message: "Quiero un sistema de reservas & pagos.\n¿Cuánto sale?",
};

function post(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request("http://localhost/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("validateField", () => {
  it("pide el nombre si falta", () => {
    expect(validateField("name", "   ")).toMatch(/Falta tu nombre/);
  });

  it("explica cómo arreglar un email sin dominio", () => {
    expect(validateField("email", "hola@")).toBe(
      "Falta el dominio del email, por ejemplo hola@tunegocio.com",
    );
    expect(validateField("email", "hola@tunegocio")).toMatch(/dominio/);
  });

  it("detecta un email sin @", () => {
    expect(validateField("email", "hola.tunegocio.com")).toMatch(/Falta la @/);
  });

  it("acepta un email válido", () => {
    expect(validateField("email", " hola@tunegocio.com.ar ")).toBeUndefined();
  });

  it("pide el mensaje si está vacío y limita el largo", () => {
    expect(validateField("message", "")).toMatch(/Contanos qué necesitás/);
    expect(validateField("message", "a".repeat(LIMITS.message + 1))).toMatch(/hasta 2000/);
  });
});

describe("validateContact", () => {
  it("junta los errores de todos los campos", () => {
    const result = validateContact({ name: "", email: "x", message: "" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(Object.keys(result.errors).sort()).toEqual(["email", "message", "name"]);
  });

  it("ignora tipos que no son texto", () => {
    const result = validateContact({ name: 42, email: ["a@b.com"], message: null });
    expect(result.ok).toBe(false);
  });

  it("recorta espacios y marca el honeypot", () => {
    const result = validateContact({ ...valid, name: "  Ana  ", company: "Spam SA" });
    expect(result).toMatchObject({ ok: true, honeypot: true, data: { name: "Ana" } });
  });
});

describe("WhatsApp", () => {
  it("codifica acentos, &, ? y saltos de línea", () => {
    const url = buildWhatsappUrl("5493548545450", buildWhatsappText(valid));
    expect(url.startsWith("https://wa.me/5493548545450?text=")).toBe(true);
    const text = new URL(url).searchParams.get("text");
    expect(text).toBe(
      "Hola engineX, soy Ana Pérez (ana@tunegocio.com).\n\nQuiero un sistema de reservas & pagos.\n¿Cuánto sale?",
    );
    expect(url).toContain("%26");
    expect(url).toContain("%3F");
    expect(url).toContain("%0A");
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

describe("handleContact", () => {
  let dir: string;
  const number = "5491100000000";

  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), "enginex-contacts-"));
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("guarda el mensaje y devuelve la URL de WhatsApp con el número configurado", async () => {
    const response = await handleContact(post(valid), {
      store: new FileContactStore(dir),
      whatsappNumber: number,
    });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.whatsappUrl).toBe(buildWhatsappUrl(number, buildWhatsappText(valid)));

    const files = await readdir(dir);
    expect(files).toHaveLength(1);
    const saved = JSON.parse(await readFile(path.join(dir, files[0]), "utf8"));
    expect(saved).toMatchObject(valid);
    expect(typeof saved.receivedAt).toBe("string");
  });

  it("responde 400 con el error del campo si el email es inválido", async () => {
    const response = await handleContact(post({ ...valid, email: "hola@" }), {
      store: new FileContactStore(dir),
      whatsappNumber: number,
    });
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toEqual({
      ok: false,
      errors: { email: "Falta el dominio del email, por ejemplo hola@tunegocio.com" },
    });
    expect(await readdir(dir)).toHaveLength(0);
  });

  it("responde 400 si el mensaje está vacío", async () => {
    const response = await handleContact(post({ ...valid, message: "  " }), {
      store: new FileContactStore(dir),
      whatsappNumber: number,
    });
    expect(response.status).toBe(400);
    expect((await response.json()).errors.message).toBeDefined();
  });

  it("con el honeypot lleno responde 200 y no guarda nada", async () => {
    const response = await handleContact(post({ ...valid, company: "bot" }), {
      store: new FileContactStore(dir),
      whatsappNumber: number,
    });
    expect(response.status).toBe(200);
    expect((await response.json()).ok).toBe(true);
    expect(await readdir(dir)).toHaveLength(0);
  });

  it("rechaza un body demasiado grande con 413", async () => {
    const huge = { ...valid, message: "a".repeat(LIMITS.body + 1) };
    const response = await handleContact(post(huge), {
      store: new FileContactStore(dir),
      whatsappNumber: number,
    });
    expect(response.status).toBe(413);
    expect(await readdir(dir)).toHaveLength(0);
  });

  it("corta un body chunked sin Content-Length apenas pasa el límite", async () => {
    let pulled = 0;
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        pulled++;
        if (pulled > 1000) controller.close();
        else controller.enqueue(new TextEncoder().encode("a".repeat(1024)));
      },
    });
    const request = new Request("http://localhost/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: stream,
      duplex: "half",
    } as RequestInit);
    const response = await handleContact(request, {
      store: new FileContactStore(dir),
      whatsappNumber: number,
    });
    expect(response.status).toBe(413);
    expect(pulled).toBeLessThan(20);
    expect(await readdir(dir)).toHaveLength(0);
  });

  it("rechaza lo que no es JSON", async () => {
    const notJson = await handleContact(post("{roto"), {
      store: new FileContactStore(dir),
      whatsappNumber: number,
    });
    expect(notJson.status).toBe(400);
    const form = await handleContact(
      new Request("http://localhost/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "name=Ana",
      }),
      { store: new FileContactStore(dir), whatsappNumber: number },
    );
    expect(form.status).toBe(415);
  });

  it("responde 500 sin romper si no puede guardar", async () => {
    const blocked = path.join(dir, "archivo");
    await writeFile(blocked, "");
    const response = await handleContact(post(valid), {
      store: new FileContactStore(path.join(blocked, "sub")),
      whatsappNumber: number,
    });
    expect(response.status).toBe(500);
    expect((await response.json()).ok).toBe(false);
  });

  it("lee la configuración de process.env en runtime", () => {
    const config = contactConfigFromEnv({ WHATSAPP_NUMBER: number, CONTACTS_DIR: "tmp/x" });
    expect(config.whatsappNumber).toBe(number);
    expect(config.store).toBeInstanceOf(FileContactStore);
    const { dir: storeDir } = config.store as FileContactStore;
    expect(path.isAbsolute(storeDir)).toBe(true);
    expect(storeDir.endsWith(path.join("tmp", "x"))).toBe(true);
    expect(config.rateLimiter).toBeUndefined();
  });
});
