// Lectura de valores numéricos y URLs desde variables de entorno.
// Un valor ausente, mal escrito o fuera de rango nunca rompe: se usa el valor por defecto.
import type { Duration } from "@upstash/ratelimit";

interface Range {
  min: number;
  max: number;
}

/** Entero decimal sin signo ni exponente (`"15000"`); lo demás es inválido. */
export function intFromEnv(
  raw: string | undefined,
  fallback: number,
  { min, max }: Partial<Range> = {},
): number {
  const value = raw?.trim() ?? "";
  if (!/^\d+$/.test(value)) return fallback;
  const parsed = Number.parseInt(value, 10);
  const inRange = parsed >= (min ?? 1) && parsed <= (max ?? Number.MAX_SAFE_INTEGER);
  return inRange ? parsed : fallback;
}

/** Número decimal no negativo (`"0.4"`), dentro de [min, max]. */
export function numberFromEnv(raw: string | undefined, fallback: number, range: Range): number {
  const value = raw?.trim() ?? "";
  if (!/^\d+(\.\d+)?$/.test(value)) return fallback;
  const parsed = Number(value);
  return parsed >= range.min && parsed <= range.max ? parsed : fallback;
}

/** Duración para el límite de Upstash: número entero y unidad (`"10 m"`, `"30s"`). */
export function durationFromEnv(raw: string | undefined, fallback: Duration): Duration {
  const match = /^(\d+)\s*(ms|s|m|h|d)$/.exec(raw?.trim() ?? "");
  if (!match || Number(match[1]) < 1) return fallback;
  return `${Number(match[1])} ${match[2]}` as Duration;
}

const LOOPBACK = new Set(["localhost", "127.0.0.1", "[::1]"]);

/**
 * URL base de una API, sin barra final. Va con la key en un header, así que solo se acepta https
 * (http solo hacia la propia máquina, para tests y desarrollo), sin usuario, query ni hash.
 */
export function apiBaseFromEnv(raw: string | undefined, fallback: string): string {
  const value = raw?.trim() ?? "";
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return fallback;
  }
  const secure =
    url.protocol === "https:" || (url.protocol === "http:" && LOOPBACK.has(url.hostname));
  const clean = !url.username && !url.password && !url.search && !url.hash;
  return secure && clean ? value.replace(/\/+$/, "") : fallback;
}
