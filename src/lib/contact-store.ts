// Dónde se guardan los mensajes del formulario y cuántos se aceptan por IP.
// En Vercel el disco se borra: ahí se usa Upstash Redis. En local y en un servidor propio, archivos.
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import type { ContactInput } from "./contact";

export interface StoredContact extends ContactInput {
  receivedAt: string;
}

export interface ContactStore {
  save(message: StoredContact): Promise<void>;
}

/** Un .json por mensaje en una carpeta. Para desarrollo, tests y servidores con disco persistente. */
export class FileContactStore implements ContactStore {
  constructor(readonly dir: string) {}

  async save(message: StoredContact): Promise<void> {
    const stamp = message.receivedAt.replace(/[:.]/g, "-");
    const file = path.join(this.dir, `${stamp}-${randomUUID()}.json`);
    await mkdir(this.dir, { recursive: true });
    await writeFile(file, `${JSON.stringify(message, null, 2)}\n`, { flag: "wx" });
  }
}

/** Lo único que se usa de Redis: agregar al principio de una lista. */
export interface RedisList {
  lpush(key: string, ...values: string[]): Promise<number>;
}

export const REDIS_CONTACTS_KEY = "contacts";

/** Cada mensaje va como JSON al principio de la lista `contacts` (el más nuevo primero). */
export class RedisContactStore implements ContactStore {
  constructor(
    private readonly redis: RedisList,
    private readonly key = REDIS_CONTACTS_KEY,
  ) {}

  async save(message: StoredContact): Promise<void> {
    await this.redis.lpush(this.key, JSON.stringify(message));
  }
}

/** En Vercel sin Redis: falla a propósito para que el mensaje no se pierda en silencio. */
export class UnavailableContactStore implements ContactStore {
  async save(): Promise<void> {
    throw new Error(
      "No hay almacenamiento para los mensajes: conectá Upstash Redis (KV_REST_API_URL y KV_REST_API_TOKEN).",
    );
  }
}

export interface RedisCredentials {
  url: string;
  token: string;
}

type Env = Record<string, string | undefined>;

/** Acepta las variables de la integración de Vercel (KV_*) o las de Upstash (UPSTASH_*). */
export function redisCredentials(env: Env): RedisCredentials | undefined {
  const url = env.KV_REST_API_URL || env.UPSTASH_REDIS_REST_URL;
  const token = env.KV_REST_API_TOKEN || env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url, token } : undefined;
}

export function contactStoreFromEnv(env: Env, redis?: RedisList): ContactStore {
  if (redis) return new RedisContactStore(redis);
  if (env.VERCEL) return new UnavailableContactStore();
  return new FileContactStore(path.resolve(env.CONTACTS_DIR || "data/contacts"));
}

export interface ContactRateLimiter {
  /** true si la IP todavía puede mandar un mensaje. */
  allow(ip: string): Promise<boolean>;
}

export const RATE_LIMIT = { messages: 5, window: "10 m" } as const;

export function upstashRateLimiter(redis: Redis): ContactRateLimiter {
  const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(RATE_LIMIT.messages, RATE_LIMIT.window),
    prefix: "enginex:contact",
  });
  return {
    async allow(ip) {
      const { success } = await ratelimit.limit(ip);
      return success;
    },
  };
}

/**
 * IP del cliente según Vercel, que completa x-forwarded-for con la IP real (y pisa la que mande el
 * cliente). Fuera de Vercel ese header se puede falsificar: por eso el límite solo se usa ahí.
 * Sin IP devuelve undefined, para no meter a todas las visitas en el mismo cupo.
 */
export function clientIp(request: Request): string | undefined {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip")?.trim() || undefined;
}

/**
 * Store y límite según el entorno: con Redis los mensajes van a Redis; sin Redis, a archivos.
 * El límite por IP solo se activa en Vercel con Redis, donde la IP es confiable.
 */
export function contactBackendFromEnv(env: Env): {
  store: ContactStore;
  rateLimiter?: ContactRateLimiter;
} {
  const credentials = redisCredentials(env);
  if (!credentials) return { store: contactStoreFromEnv(env) };
  const redis = new Redis(credentials);
  const store = contactStoreFromEnv(env, redis);
  return env.VERCEL ? { store, rateLimiter: upstashRateLimiter(redis) } : { store };
}
