// Parte server del formulario de contacto: lee el request, guarda el mensaje y arma la respuesta.
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  buildWhatsappText,
  buildWhatsappUrl,
  type ContactErrors,
  type ContactInput,
  LIMITS,
  validateContact,
} from "./contact";

export interface ContactConfig {
  /** Carpeta donde se guarda un .json por mensaje. */
  dir: string;
  whatsappNumber: string;
  now?: () => Date;
}

export type ContactResponseBody =
  | { ok: true; whatsappUrl: string }
  | { ok: false; errors?: ContactErrors; error?: string };

/**
 * Se lee en runtime desde process.env: en Astro 7 import.meta.env queda fijo en el build.
 */
export function contactConfigFromEnv(env: NodeJS.ProcessEnv = process.env): ContactConfig {
  return {
    dir: path.resolve(env.CONTACTS_DIR || "data/contacts"),
    whatsappNumber: env.WHATSAPP_NUMBER ?? "",
  };
}

function json(body: ContactResponseBody, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

export async function saveContact(
  data: ContactInput,
  { dir, now = () => new Date() }: Pick<ContactConfig, "dir" | "now">,
): Promise<string> {
  const date = now();
  const file = path.join(dir, `${date.toISOString().replace(/[:.]/g, "-")}-${randomUUID()}.json`);
  await mkdir(dir, { recursive: true });
  await writeFile(
    file,
    `${JSON.stringify({ ...data, receivedAt: date.toISOString() }, null, 2)}\n`,
    {
      flag: "wx",
    },
  );
  return file;
}

export async function handleContact(request: Request, config: ContactConfig): Promise<Response> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return json({ ok: false, error: "Mandá los datos como JSON." }, 415);
  }

  const declared = Number(request.headers.get("content-length") ?? "0");
  if (declared > LIMITS.body)
    return json({ ok: false, error: "El mensaje es demasiado largo." }, 413);

  let text: string;
  try {
    text = await request.text();
  } catch {
    return json({ ok: false, error: "No pudimos leer el mensaje." }, 400);
  }
  if (new TextEncoder().encode(text).length > LIMITS.body) {
    return json({ ok: false, error: "El mensaje es demasiado largo." }, 413);
  }

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return json({ ok: false, error: "No pudimos leer el mensaje." }, 400);
  }

  const result = validateContact(body);
  if (!result.ok) return json({ ok: false, errors: result.errors }, 400);

  const whatsappUrl = buildWhatsappUrl(config.whatsappNumber, buildWhatsappText(result.data));

  // Al bot se le responde igual que a una persona, pero no se guarda nada.
  if (result.honeypot) return json({ ok: true, whatsappUrl }, 200);

  try {
    await saveContact(result.data, config);
  } catch (error) {
    console.error("[contact] no se pudo guardar el mensaje", error);
    return json(
      { ok: false, error: "No pudimos guardar tu mensaje. Escribinos directo por WhatsApp." },
      500,
    );
  }
  return json({ ok: true, whatsappUrl }, 200);
}
