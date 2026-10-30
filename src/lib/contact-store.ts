// Dónde se guardan los mensajes del formulario y cuántos se aceptan por IP.
// En Vercel el disco se borra: ahí se usa Upstash Redis. En local y en un servidor propio, archivos.
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import type { ContactInput } from "./contact";
import type { WaitlistInput } from "./waitlist";

export interface StoredContact extends ContactInput {
  receivedAt: string;
}

export interface StoredWaitlist extends WaitlistInput {
  receivedAt: string;
}

/** Dónde se guarda un registro (mensaje de contacto o email de la lista de espera). */
export interface ContactStore<T = StoredContact> {
  save(record: T): Promise<void>;
}

/** Un .json por mensaje en una carpeta. Para desarrollo, tests y servidores con disco persistente. */
export class FileContactStore<T extends { receivedAt: string } = StoredContact>
  implements ContactStore<T>
{
  constructor(readonly dir: string) {}

  async save(record: T): Promise<void> {
    const stamp = record.receivedAt.replace(/[:.]/g, "-");
    const file = path.join(this.dir, `${stamp}-${randomUUID()}.json`);
    await mkdir(this.dir, { recursive: true });
    await writeFile(file, `${JSON.stringify(record, null, 2)}\n`, { flag: "wx" });
  }
}

/** Lo único que se usa de Redis: agregar al principio de una lista. */
export interface RedisList {
  lpush(key: string, ...values: string[]): Promise<number>;
}

export const REDIS_CONTACTS_KEY = "contacts";

export const REDIS_WAITLIST_KEY = "waitlist";

/** Cada registro va como JSON al principio de una lista (`contacts` por defecto), el más nuevo primero. */
export class RedisContactStore<T = unknown> implements ContactStore<T> {
  constructor(
    private readonly redis: RedisList,
    private readonly key = REDIS_CONTACTS_KEY,
  ) {}

  async save(record: T): Promise<void> {
    await this.redis.lpush(this.key, JSON.stringify(record));
  }
}

/** En Vercel sin Redis: falla a propósito para que el mensaje no se pierda en silencio. */
export class UnavailableContactStore implements ContactStore<never> {
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

/** Qué lista de Redis y qué carpeta usa cada tipo de registro. */
interface StoreTarget {
  redisKey: string;
  dirVar: string;
  defaultDir: string;
  limitPrefix: string;
}

const CONTACTS_TARGET: StoreTarget = {
  redisKey: REDIS_CONTACTS_KEY,
  dirVar: "CONTACTS_DIR",
  defaultDir: "data/contacts",
  limitPrefix: "enginex:contact",
};

const WAITLIST_TARGET: StoreTarget = {
  redisKey: REDIS_WAITLIST_KEY,
  dirVar: "WAITLIST_DIR",
  defaultDir: "data/waitlist",
  limitPrefix: "enginex:waitlist",
};

function storeFromEnv<T extends { receivedAt: string }>(
  env: Env,
  target: StoreTarget,
  redis?: RedisList,
): ContactStore<T> {
  if (redis) return new RedisContactStore<T>(redis, target.redisKey);
  if (env.VERCEL) return new UnavailableContactStore();
  return new FileContactStore<T>(path.resolve(env[target.dirVar] || target.defaultDir));
}

export function contactStoreFromEnv(env: Env, redis?: RedisList): ContactStore {
  return storeFromEnv<StoredContact>(env, CONTACTS_TARGET, redis);
}

export interface ContactRateLimiter {
  /** true si la IP todavía puede mandar un mensaje. */
  allow(ip: string): Promise<boolean>;
}

export const RATE_LIMIT = { messages: 5, window: "10 m" } as const;

export function upstashRateLimiter(
  redis: Redis,
  prefix = CONTACTS_TARGET.limitPrefix,
): ContactRateLimiter {
  const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(RATE_LIMIT.messages, RATE_LIMIT.window),
    prefix,
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
 * Store y límite según el entorno: con Redis los registros van a Redis; sin Redis, a archivos.
 * El límite por IP solo se activa en Vercel con Redis, donde la IP es confiable.
 */
function backendFromEnv<T extends { receivedAt: string }>(
  env: Env,
  target: StoreTarget,
): { store: ContactStore<T>; rateLimiter?: ContactRateLimiter } {
  const credentials = redisCredentials(env);
  if (!credentials) return { store: storeFromEnv<T>(env, target) };
  const redis = new Redis(credentials);
  const store = storeFromEnv<T>(env, target, redis);
  return env.VERCEL
    ? { store, rateLimiter: upstashRateLimiter(redis, target.limitPrefix) }
    : { store };
}

export function contactBackendFromEnv(env: Env) {
  return backendFromEnv<StoredContact>(env, CONTACTS_TARGET);
}

export function waitlistBackendFromEnv(env: Env) {
  return backendFromEnv<StoredWaitlist>(env, WAITLIST_TARGET);
}
