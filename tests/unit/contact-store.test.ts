import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  clientIp,
  FileContactStore,
  REDIS_WAITLIST_KEY,
  RedisContactStore,
  type RedisList,
  redisCredentials,
} from "../../src/lib/contact-store";

const record = { email: "ana@tunegocio.com", receivedAt: "2026-10-24T12:00:00.000Z" };

class FakeRedis implements RedisList {
  lists = new Map<string, string[]>();
  async lpush(key: string, ...values: string[]): Promise<number> {
    const list = this.lists.get(key) ?? [];
    list.unshift(...values.reverse());
    this.lists.set(key, list);
    return list.length;
  }
}

describe("FileContactStore", () => {
  let dir: string;
  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), "enginex-store-"));
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("guarda un .json por registro", async () => {
    await new FileContactStore(dir).save(record);
    await new FileContactStore(dir).save(record);
    const files = await readdir(dir);
    expect(files).toHaveLength(2);
    expect(JSON.parse(await readFile(path.join(dir, files[0]), "utf8"))).toEqual(record);
  });
});

describe("RedisContactStore", () => {
  it("agrega el registro como JSON al principio de la lista waitlist", async () => {
    const redis = new FakeRedis();
    const store = new RedisContactStore(redis);
    await store.save(record);
    await store.save({ ...record, email: "beto@tunegocio.com" });
    const list = redis.lists.get(REDIS_WAITLIST_KEY) ?? [];
    expect(list).toHaveLength(2);
    expect(JSON.parse(list[0]).email).toBe("beto@tunegocio.com");
    expect(JSON.parse(list[1])).toEqual(record);
  });
});

describe("credenciales de Redis", () => {
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
});

describe("IP del cliente", () => {
  it("toma la IP de x-forwarded-for o de x-real-ip", () => {
    const forwarded = new Request("http://x", {
      headers: { "x-forwarded-for": "190.2.3.4, 10.0.0.1" },
    });
    expect(clientIp(forwarded)).toBe("190.2.3.4");
    const realIp = new Request("http://x", { headers: { "x-real-ip": "1.2.3.4" } });
    expect(clientIp(realIp)).toBe("1.2.3.4");
    expect(clientIp(new Request("http://x"))).toBeUndefined();
  });
});
