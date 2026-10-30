import { describe, expect, it } from "vitest";
import {
  type ContactRateLimiter,
  type ContactStore,
  FileContactStore,
  RedisContactStore,
  type RedisList,
  UnavailableContactStore,
  waitlistBackendFromEnv,
} from "../../src/lib/contact-store";
import { validateWaitlist, WAITLIST_LIMITS } from "../../src/lib/waitlist";
import { handleWaitlist } from "../../src/lib/waitlist-server";

describe("validateWaitlist", () => {
  it("acepta un email y lo devuelve sin espacios", () => {
    expect(validateWaitlist({ email: "  ana@tunegocio.com ", source: "cierre" })).toEqual({
      ok: true,
      honeypot: false,
      data: { email: "ana@tunegocio.com", source: "cierre" },
    });
  });

  it("sin origen o con uno desconocido usa hero", () => {
    const sinOrigen = validateWaitlist({ email: "ana@tunegocio.com" });
    const raro = validateWaitlist({ email: "ana@tunegocio.com", source: "otro" });
    expect(sinOrigen.ok && sinOrigen.data.source).toBe("hero");
    expect(raro.ok && raro.data.source).toBe("hero");
  });

  it("explica cómo arreglar cada error de email", () => {
    const vacio = validateWaitlist({ email: "" });
    const sinArroba = validateWaitlist({ email: "ana.tunegocio.com" });
    const sinDominio = validateWaitlist({ email: "ana@tunegocio" });
    const largo = validateWaitlist({ email: `${"a".repeat(WAITLIST_LIMITS.email)}@x.com` });
    expect(vacio).toEqual({
      ok: false,
      errors: { email: expect.stringMatching(/Falta tu email/) },
    });
    expect(sinArroba.ok === false && sinArroba.errors.email).toMatch(/Falta la @/);
    expect(sinDominio.ok === false && sinDominio.errors.email).toMatch(/Falta el dominio/);
    expect(largo.ok === false && largo.errors.email).toMatch(/demasiado largo/);
  });

  it("un body que no es un objeto es un email vacío", () => {
    expect(validateWaitlist(null).ok).toBe(false);
    expect(validateWaitlist("ana@tunegocio.com").ok).toBe(false);
  });

  it("marca como bot al que completa el campo oculto company", () => {
    const result = validateWaitlist({ email: "ana@tunegocio.com", company: "ACME" });
    expect(result.ok && result.honeypot).toBe(true);
  });
});

class MemoryStore<T> implements ContactStore<T> {
  saved: T[] = [];
  async save(record: T) {
    this.saved.push(record);
  }
}

function post(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request("http://localhost/api/waitlist", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": "200.1.1.1", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

const fixedNow = () => new Date("2026-11-01T10:00:00.000Z");

describe("handleWaitlist", () => {
  it("guarda el email con origen y fecha, y responde ok", async () => {
    const store = new MemoryStore<unknown>();
    const response = await handleWaitlist(post({ email: "ana@tunegocio.com", source: "hero" }), {
      store,
      now: fixedNow,
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(store.saved).toEqual([
      { email: "ana@tunegocio.com", source: "hero", receivedAt: "2026-11-01T10:00:00.000Z" },
    ]);
  });

  it("415 si no es JSON y 400 si el JSON está roto", async () => {
    const config = { store: new MemoryStore<unknown>() };
    const texto = new Request("http://localhost/api/waitlist", { method: "POST", body: "x" });
    expect((await handleWaitlist(texto, config)).status).toBe(415);
    expect((await handleWaitlist(post("{roto"), config)).status).toBe(400);
  });

  it("413 si el body supera el límite, declarado o no", async () => {
    const config = { store: new MemoryStore<unknown>() };
    const grande = { email: "ana@tunegocio.com", extra: "x".repeat(WAITLIST_LIMITS.body) };
    const declarado = post(grande, { "content-length": String(WAITLIST_LIMITS.body + 1) });
    expect((await handleWaitlist(declarado, config)).status).toBe(413);
    expect((await handleWaitlist(post(grande), config)).status).toBe(413);
  });

  it("400 con el error del campo si el email es inválido, y no guarda", async () => {
    const store = new MemoryStore<unknown>();
    const response = await handleWaitlist(post({ email: "ana@" }), { store });
    expect(response.status).toBe(400);
    expect((await response.json()).errors.email).toMatch(/dominio/);
    expect(store.saved).toHaveLength(0);
  });

  it("al bot le responde ok pero no guarda ni consume el límite", async () => {
    const store = new MemoryStore<unknown>();
    const seen: string[] = [];
    const rateLimiter: ContactRateLimiter = {
      async allow(ip) {
        seen.push(ip);
        return true;
      },
    };
    const response = await handleWaitlist(post({ email: "bot@x.com", company: "x" }), {
      store,
      rateLimiter,
    });
    expect(response.status).toBe(200);
    expect(store.saved).toHaveLength(0);
    expect(seen).toHaveLength(0);
  });

  it("429 cuando la IP pasó el límite", async () => {
    const store = new MemoryStore<unknown>();
    const rateLimiter: ContactRateLimiter = { allow: async () => false };
    const response = await handleWaitlist(post({ email: "ana@tunegocio.com" }), {
      store,
      rateLimiter,
    });
    expect(response.status).toBe(429);
    expect((await response.json()).error).toMatch(/esperá unos minutos/);
    expect(store.saved).toHaveLength(0);
  });

  it("si el límite falla, deja pasar el email", async () => {
    const store = new MemoryStore<unknown>();
    const rateLimiter: ContactRateLimiter = {
      allow: async () => {
        throw new Error("redis caído");
      },
    };
    const response = await handleWaitlist(post({ email: "ana@tunegocio.com" }), {
      store,
      rateLimiter,
    });
    expect(response.status).toBe(200);
    expect(store.saved).toHaveLength(1);
  });

  it("500 sin perder el error en silencio si no se puede guardar", async () => {
    const response = await handleWaitlist(post({ email: "ana@tunegocio.com" }), {
      store: new UnavailableContactStore(),
    });
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ ok: false, error: "No pudimos guardar tu email." });
  });
});

class FakeRedis implements RedisList {
  lists = new Map<string, string[]>();
  async lpush(key: string, ...values: string[]): Promise<number> {
    const list = this.lists.get(key) ?? [];
    list.unshift(...values);
    this.lists.set(key, list);
    return list.length;
  }
}

describe("waitlistBackendFromEnv", () => {
  it("sin Redis guarda en archivos (WAITLIST_DIR) y en Vercel falla a propósito", () => {
    expect(waitlistBackendFromEnv({}).store).toBeInstanceOf(FileContactStore);
    expect(waitlistBackendFromEnv({}).rateLimiter).toBeUndefined();
    expect(waitlistBackendFromEnv({ VERCEL: "1" }).store).toBeInstanceOf(UnavailableContactStore);
  });

  it("con Redis usa la lista waitlist y, en Vercel, el límite por IP", () => {
    const env = { KV_REST_API_URL: "https://example.upstash.io", KV_REST_API_TOKEN: "token" };
    expect(waitlistBackendFromEnv(env).store).toBeInstanceOf(RedisContactStore);
    expect(waitlistBackendFromEnv(env).rateLimiter).toBeUndefined();
    expect(waitlistBackendFromEnv({ ...env, VERCEL: "1" }).rateLimiter).toBeDefined();
  });

  it("el store de Redis escribe en waitlist, no en contacts", async () => {
    const redis = new FakeRedis();
    await new RedisContactStore(redis, "waitlist").save({ email: "a@b.co" });
    expect([...redis.lists.keys()]).toEqual(["waitlist"]);
  });
});
