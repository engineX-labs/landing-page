// Parte server de la lista de espera de Social Engine: lee el request, guarda el email y responde.
import { json, rateLimitResponse, readJsonBody } from "./contact-server";
import {
  type ContactRateLimiter,
  type ContactStore,
  type StoredWaitlist,
  waitlistBackendFromEnv,
} from "./contact-store";
import { validateWaitlist, WAITLIST_LIMITS } from "./waitlist";

export interface WaitlistConfig {
  /** Dónde se guarda cada email (archivos o Redis). */
  store: ContactStore<StoredWaitlist>;
  /** Límite de envíos por IP; sin él no hay límite. */
  rateLimiter?: ContactRateLimiter;
  now?: () => Date;
}

/** Se lee en runtime desde process.env: en Astro 7 import.meta.env queda fijo en el build. */
export function waitlistConfigFromEnv(env: NodeJS.ProcessEnv = process.env): WaitlistConfig {
  return waitlistBackendFromEnv(env);
}

export async function handleWaitlist(request: Request, config: WaitlistConfig): Promise<Response> {
  const parsed = await readJsonBody(request, WAITLIST_LIMITS.body);
  if (!parsed.ok) return json({ ok: false, error: parsed.error }, parsed.status);

  const result = validateWaitlist(parsed.body);
  if (!result.ok) return json({ ok: false, errors: result.errors }, 400);

  // Al bot se le responde igual que a una persona, pero no se guarda nada.
  if (result.honeypot) return json({ ok: true }, 200);

  const limited = await rateLimitResponse(request, config.rateLimiter, "waitlist");
  if (limited) return limited;

  try {
    const now = config.now ?? (() => new Date());
    await config.store.save({ ...result.data, receivedAt: now().toISOString() });
  } catch (error) {
    console.error("[waitlist] no se pudo guardar el email", error);
    return json({ ok: false, error: "No pudimos guardar tu email." }, 500);
  }
  return json({ ok: true }, 200);
}
