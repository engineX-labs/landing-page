import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";
import {
  isTheme,
  otherTheme,
  resolveTheme,
  THEME_COLORS,
  THEME_STORAGE_KEY,
  themeInitScript,
} from "../../src/lib/theme";

describe("resolveTheme", () => {
  it("la elección guardada gana sobre el dispositivo", () => {
    expect(resolveTheme("dark", true)).toBe("dark");
    expect(resolveTheme("light", false)).toBe("light");
  });

  it("sin elección sigue al dispositivo; un valor inválido se ignora", () => {
    expect(resolveTheme(null, true)).toBe("light");
    expect(resolveTheme(null, false)).toBe("dark");
    expect(resolveTheme("rojo", true)).toBe("light");
    expect(resolveTheme(undefined, false)).toBe("dark");
  });

  it("alterna y reconoce solo los dos temas", () => {
    expect(otherTheme("light")).toBe("dark");
    expect(otherTheme("dark")).toBe("light");
    expect(isTheme("light")).toBe(true);
    expect(isTheme("auto")).toBe(false);
  });
});

/** Corre el script del <head> con un documento y un almacenamiento falsos. */
function runInit({
  stored,
  prefersLight,
  storageThrows = false,
  noMatchMedia = false,
}: {
  stored?: string;
  prefersLight?: boolean;
  storageThrows?: boolean;
  noMatchMedia?: boolean;
}) {
  const meta = {
    content: "",
    setAttribute(_: string, v: string) {
      this.content = v;
    },
  };
  const root = { dataset: {} as Record<string, string>, style: {} as Record<string, string> };
  const sandbox: Record<string, unknown> = {
    document: { documentElement: root, querySelector: () => meta },
    localStorage: {
      getItem: (key: string) => {
        if (storageThrows) throw new Error("bloqueado");
        return key === THEME_STORAGE_KEY ? (stored ?? null) : null;
      },
    },
  };
  if (!noMatchMedia) sandbox.matchMedia = () => ({ matches: Boolean(prefersLight) });
  runInNewContext(themeInitScript, sandbox);
  return { theme: root.dataset.theme, colorScheme: root.style.colorScheme, color: meta.content };
}

describe("script del <head>", () => {
  it("aplica la elección guardada, el color de la barra y color-scheme", () => {
    expect(runInit({ stored: "dark", prefersLight: true })).toEqual({
      theme: "dark",
      colorScheme: "dark",
      color: THEME_COLORS.dark,
    });
    expect(runInit({ stored: "light" }).color).toBe(THEME_COLORS.light);
  });

  it("sin elección usa el dispositivo", () => {
    expect(runInit({ prefersLight: true }).theme).toBe("light");
    expect(runInit({ prefersLight: false }).theme).toBe("dark");
  });

  it("ignora valores inválidos y sobrevive a un almacenamiento bloqueado o sin matchMedia", () => {
    expect(runInit({ stored: "rojo", prefersLight: true }).theme).toBe("light");
    expect(runInit({ storageThrows: true, prefersLight: true }).theme).toBe("light");
    expect(runInit({ noMatchMedia: true }).theme).toBe("dark");
  });

  it("da lo mismo que resolveTheme", () => {
    for (const stored of [undefined, "light", "dark", "x"]) {
      for (const prefersLight of [true, false]) {
        expect(runInit({ stored, prefersLight }).theme).toBe(
          resolveTheme(stored ?? null, prefersLight),
        );
      }
    }
  });
});
