// Guarda contra el olvido: toda variable de entorno que lee el código tiene que estar documentada
// en .env.example y en la tabla de variables del README.
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/** Las define la plataforma (Vercel, Vite): no se configuran a mano. */
const PLATFORM = new Set(["VERCEL", "DEV", "PROD", "MODE", "BASE_URL", "SSR", "NODE_ENV"]);

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const file = path.join(dir, name);
    if (statSync(file).isDirectory()) return sourceFiles(file);
    return /\.(ts|astro|mjs)$/.test(name) ? [file] : [];
  });
}

/** Nombres leídos con env.X, process.env.X, import.meta.env.X o declarados como dirVar. */
function variablesInCode(): string[] {
  const files = [...sourceFiles("src"), "astro.config.mjs", "site.config.mjs"];
  const found = new Set<string>();
  for (const file of files) {
    const text = readFileSync(file, "utf8");
    for (const match of text.matchAll(/\benv\.([A-Z][A-Z0-9_]+)/g)) found.add(match[1]);
    for (const match of text.matchAll(/dirVar:\s*"([A-Z][A-Z0-9_]+)"/g)) found.add(match[1]);
  }
  return [...found].filter((name) => !PLATFORM.has(name)).sort();
}

const variables = variablesInCode();

describe("variables de entorno documentadas", () => {
  it("el escaneo encuentra las variables conocidas (si falla, el escaneo dejó de funcionar)", () => {
    for (const name of ["SITE_URL", "WHATSAPP_NUMBER", "GEMINI_API_KEY", "KV_REST_API_URL"]) {
      expect(variables).toContain(name);
    }
  });

  it.each(variables)("%s está en .env.example", (name) => {
    expect(readFileSync(".env.example", "utf8")).toMatch(new RegExp(`^#?\\s*${name}=`, "m"));
  });

  it.each(variables)("%s está en la tabla del README", (name) => {
    expect(readFileSync("README.md", "utf8")).toContain(`\`${name}\``);
  });
});
