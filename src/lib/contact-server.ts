// Utilidades de los endpoints server: leer el body con límite, responder JSON y aplicar el límite por IP.
import { type ContactRateLimiter, clientIp } from "./contact-store";
import type { WaitlistResponseBody } from "./waitlist";

export function json(body: WaitlistResponseBody, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

/** Lee el body como texto; devuelve null si supera `limit` bytes, sin bufferear el resto. */
export async function readBodyWithLimit(request: Request, limit: number): Promise<string | null> {
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

export type JsonBodyResult =
  | { ok: true; body: unknown }
  | { ok: false; status: 400 | 413 | 415; error: string };

/** Valida el content-type, lee el body con límite de tamaño y lo parsea como JSON. */
export async function readJsonBody(request: Request, limit: number): Promise<JsonBodyResult> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return { ok: false, status: 415, error: "Mandá los datos como JSON." };
  }

  const tooLong = { ok: false, status: 413, error: "El mensaje es demasiado largo." } as const;
  const unreadable = { ok: false, status: 400, error: "No pudimos leer el mensaje." } as const;

  const declared = Number(request.headers.get("content-length") ?? "0");
  if (declared > limit) return tooLong;

  // Sin Content-Length (chunked) se corta la lectura apenas pasa el límite.
  let text: string | null;
  try {
    text = await readBodyWithLimit(request, limit);
  } catch {
    return unreadable;
  }
  if (text === null) return tooLong;

  try {
    return { ok: true, body: JSON.parse(text) };
  } catch {
    return unreadable;
  }
}

/** Respuesta `429` si la IP pasó el límite; undefined si puede seguir (o no hay límite que aplicar). */
export async function rateLimitResponse(
  request: Request,
  rateLimiter: ContactRateLimiter | undefined,
  tag: string,
): Promise<Response | undefined> {
  const ip = clientIp(request);
  if (!rateLimiter || !ip) return undefined;
  let allowed = true;
  try {
    allowed = await rateLimiter.allow(ip);
  } catch (error) {
    // Si el límite no responde, se deja pasar: es mejor recibir el mensaje que perderlo.
    console.error(`[${tag}] no se pudo consultar el límite de envíos`, error);
  }
  return allowed
    ? undefined
    : json({ ok: false, error: "Mandaste varios mensajes seguidos: esperá unos minutos." }, 429);
}
