// Límites del asistente: por IP (ventana deslizante) y un tope global por día, que es el techo del gasto.
import { Redis } from "@upstash/redis";
import { assistantRateLimitFromEnv } from "./assistant-settings";
import { type ContactRateLimiter, redisCredentials, upstashRateLimiter } from "./contact-store";

/** Mensajes por día en total, entre todas las visitas. Se cambia con ASSISTANT_DAILY_LIMIT. */
export const DEFAULT_DAILY_LIMIT = 300;

/** Cuenta mensajes del día; `take` devuelve false cuando ya se llegó al tope. */
export interface DailyLimiter {
  take(): Promise<boolean>;
}

/** Lo único que se usa de Redis para el contador diario. */
export interface RedisCounter {
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<unknown>;
}

/** Día en UTC, por ejemplo "2026-10-30". */
function dayKey(now: Date): string {
  return now.toISOString().slice(0, 10);
}

export class RedisDailyLimiter implements DailyLimiter {
  constructor(
    private readonly redis: RedisCounter,
    private readonly limit: number,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async take(): Promise<boolean> {
    const key = `enginex:assistant:day:${dayKey(this.now())}`;
    const count = await this.redis.incr(key);
    // La clave se borra sola: dos días alcanzan para cubrir el cambio de fecha.
    if (count === 1) await this.redis.expire(key, 2 * 24 * 60 * 60);
    return count <= this.limit;
  }
}

/** Contador en memoria: para desarrollo, tests y un servidor propio sin Redis. */
export class MemoryDailyLimiter implements DailyLimiter {
  private day = "";
  private count = 0;

  constructor(
    private readonly limit: number,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async take(): Promise<boolean> {
    const day = dayKey(this.now());
    if (day !== this.day) {
      this.day = day;
      this.count = 0;
    }
    this.count += 1;
    return this.count <= this.limit;
  }
}

type Env = Record<string, string | undefined>;

export function dailyLimitFromEnv(env: Env): number {
  const value = Number.parseInt(env.ASSISTANT_DAILY_LIMIT ?? "", 10);
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_DAILY_LIMIT;
}

export interface AssistantBackend {
  /** Sin esto el asistente está apagado: no hay key, o falta Redis en Vercel. */
  enabled: boolean;
  dailyLimiter?: DailyLimiter;
  rateLimiter?: ContactRateLimiter;
}

/**
 * Con Redis, el tope diario es global y el límite por IP se activa en Vercel (donde la IP es
 * confiable). Sin Redis en Vercel el asistente se apaga: preferimos no tenerlo a tenerlo sin tope.
 * Fuera de Vercel sin Redis alcanza un contador en memoria, que vale por proceso.
 */
export function assistantBackendFromEnv(env: Env): AssistantBackend {
  if (!env.GEMINI_API_KEY) return { enabled: false };
  const limit = dailyLimitFromEnv(env);
  const credentials = redisCredentials(env);
  if (credentials) {
    const redis = new Redis(credentials);
    return {
      enabled: true,
      dailyLimiter: new RedisDailyLimiter(redis, limit),
      rateLimiter: env.VERCEL
        ? upstashRateLimiter(redis, "enginex:assistant", assistantRateLimitFromEnv(env))
        : undefined,
    };
  }
  if (env.VERCEL) return { enabled: false };
  return { enabled: true, dailyLimiter: new MemoryDailyLimiter(limit) };
}
