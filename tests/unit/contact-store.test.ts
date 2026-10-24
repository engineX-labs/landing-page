import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { handleContact } from "../../src/lib/contact-server";
import {
  type ContactRateLimiter,
  type ContactStore,
  clientIp,
  contactBackendFromEnv,
  contactStoreFromEnv,
  FileContactStore,
  REDIS_CONTACTS_KEY,
  RedisContactStore,
  type RedisList,
  redisCredentials,
  type StoredContact,
  UnavailableContactStore,
} from "../../src/lib/contact-store";

const message: StoredContact = {
  name: "Ana Pérez",
  email: "ana@tunegocio.com",
  message: "Hola",
  receivedAt: "2026-10-24T12:00:00.000Z",
};

const valid = { name: "Ana Pérez", email: "ana@tunegocio.com", message: "Hola" };

function post(ip = "200.1.1.1"): Request {
  return new Request("http://localhost/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": `${ip}, 10.0.0.1` },
    body: JSON.stringify(valid),
  });
}

class FakeRedis implements RedisList {
  lists = new Map<string, string[]>();
  async lpush(key: string, ...values: string[]): Promise<number> {
    const list = this.lists.get(key) ?? [];
    list.unshift(...values.reverse());
    this.lists.set(key, list);
    return list.length;
  }
}

class MemoryStore implements ContactStore {
  saved: StoredContact[] = [];
  async save(m: StoredContact) {
    this.saved.push(m);
  }
}

/** Mismo criterio que el límite real: N mensajes por IP. */
function limiter(max: number): ContactRateLimiter & { seen: string[] } {
  const counts = new Map<string, number>();
  const seen: string[] = [];
  return {
    seen,
    async allow(ip) {
      seen.push(ip);
      const n = (counts.get(ip) ?? 0) + 1;
      counts.set(ip, n);
      return n <= max;
    },
  };
}

describe("FileContactStore", () => {
  let dir: string;
  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), "enginex-store-"));
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("guarda un .json por mensaje", async () => {
    await new FileContactStore(dir).save(message);
    await new FileContactStore(dir).save(message);
    const files = await readdir(dir);
    expect(files).toHaveLength(2);
    expect(JSON.parse(await readFile(path.join(dir, files[0]), "utf8"))).toEqual(message);
  });
});

describe("RedisContactStore", () => {
  it("agrega el mensaje como JSON al principio de la lista contacts", async () => {
    const redis = new FakeRedis();
    const store = new RedisContactStore(redis);
    await store.save(message);
    await store.save({ ...message, name: "Beto" });
    const list = redis.lists.get(REDIS_CONTACTS_KEY) ?? [];
    expect(list).toHaveLength(2);
    expect(JSON.parse(list[0]).name).toBe("Beto");
    expect(JSON.parse(list[1])).toEqual(message);
  });
});

describe("elección del almacenamiento", () => {
  it("usa las variables de la integración de Vercel o las de Upstash", () => {
    expect(redisCredentials({ KV_REST_API_URL: "https://kv", KV_REST_API_TOKEN: "t" })).toEqual({
      url: "https://kv",
      token: "t",
    });
    expect(
      redisCredentials({ UPSTASH_REDIS_REST_URL: "https://up", UPSTASH_REDIS_REST_TOKEN: "u" }),
    ).toEqual({ url: "https://up", token: "u" });
    expect(redisCredentials({ KV_REST_API_URL: "https://kv" })).toBeUndefined();
  });

  it("con Redis guarda en Redis", () => {
    expect(contactStoreFromEnv({}, new FakeRedis())).toBeInstanceOf(RedisContactStore);
  });

  it("sin Redis guarda en archivos, salvo en Vercel", () => {
    expect(contactStoreFromEnv({})).toBeInstanceOf(FileContactStore);
    expect(contactStoreFromEnv({ VERCEL: "1" })).toBeInstanceOf(UnavailableContactStore);
  });

  it("con credenciales arma Redis y el límite de envíos", () => {
    const backend = contactBackendFromEnv({
      KV_REST_API_URL: "https://example.upstash.io",
      KV_REST_API_TOKEN: "token",
    });
    expect(backend.store).toBeInstanceOf(RedisContactStore);
    expect(backend.rateLimiter).toBeDefined();
  });

  it("sin credenciales no hay límite", () => {
    expect(contactBackendFromEnv({}).rateLimiter).toBeUndefined();
  });

  it("en Vercel sin Redis el endpoint responde 500 en vez de perder el mensaje", async () => {
    const response = await handleContact(post(), {
      whatsappNumber: "5491100000000",
      store: contactStoreFromEnv({ VERCEL: "1" }),
    });
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body).toEqual({ ok: false, error: "No pudimos guardar tu mensaje." });
  });
});

describe("límite de envíos", () => {
  it("toma la IP del cliente de x-forwarded-for", () => {
    expect(clientIp(post("190.2.3.4"))).toBe("190.2.3.4");
    const realIp = new Request("http://x", { headers: { "x-real-ip": "1.2.3.4" } });
    expect(clientIp(realIp)).toBe("1.2.3.4");
    expect(clientIp(new Request("http://x"))).toBe("desconocida");
  });

  it("el sexto envío de la misma IP responde 429 y no se guarda", async () => {
    const store = new MemoryStore();
    const rateLimiter = limiter(5);
    const config = { whatsappNumber: "5491100000000", store, rateLimiter };
    for (let i = 0; i < 5; i++) expect((await handleContact(post(), config)).status).toBe(200);

    const blocked = await handleContact(post(), config);
    expect(blocked.status).toBe(429);
    expect((await blocked.json()).error).toMatch(/esperá unos minutos/);
    expect(store.saved).toHaveLength(5);

    // Otra IP sigue pudiendo.
    expect((await handleContact(post("181.0.0.9"), config)).status).toBe(200);
    expect(rateLimiter.seen.at(-1)).toBe("181.0.0.9");
  });

  it("los envíos inválidos y los bots no consumen el límite", async () => {
    const rateLimiter = limiter(5);
    const config = { whatsappNumber: "5491100000000", store: new MemoryStore(), rateLimiter };
    const bot = new Request("http://localhost/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...valid, company: "spam" }),
    });
    await handleContact(bot, config);
    const invalid = new Request("http://localhost/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...valid, email: "x" }),
    });
    await handleContact(invalid, config);
    expect(rateLimiter.seen).toHaveLength(0);
  });

  it("si el límite no responde, deja pasar el mensaje", async () => {
    const store = new MemoryStore();
    const response = await handleContact(post(), {
      whatsappNumber: "5491100000000",
      store,
      rateLimiter: {
        allow: async () => {
          throw new Error("redis caído");
        },
      },
    });
    expect(response.status).toBe(200);
    expect(store.saved).toHaveLength(1);
  });
});
