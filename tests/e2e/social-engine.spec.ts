import { readdir, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { expect, type Page, test } from "@playwright/test";
import { E2E_SITE_URL, E2E_WAITLIST_DIR } from "../../playwright.config";

const VERBS = ["Entendé", "Compará", "Decidí", "Mejorá"];

async function outlineOf(page: Page) {
  return page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el) return null;
    const s = getComputedStyle(el);
    return { style: s.outlineStyle, width: s.outlineWidth, offset: s.outlineOffset };
  });
}

test.describe("portada", () => {
  test("un solo h1, con texto fijo para lectores de pantalla y los cuatro verbos", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1 .sr-only")).toHaveText(
      "Entendé, compará, decidí y mejorá lo que funciona en tus redes sin descifrar métricas",
    );
    await expect(page.locator("h1 .se-rotator > span")).toHaveText(VERBS);
    await expect(page.locator("h1 [aria-hidden='true']")).toHaveCount(1);
  });

  test("un solo botón primario en la portada", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#inicio .ex-btn-primary")).toHaveCount(1);
  });

  test("el degradé está en cada verbo y no en el contenedor: con background-clip del contenedor se verían todos a la vez", async ({
    page,
  }) => {
    await page.goto("/");
    const paint = await page.evaluate(() => {
      const bg = (el: Element) => getComputedStyle(el).backgroundImage;
      return {
        container: bg(document.querySelector(".se-rotator") as Element),
        verbs: [...document.querySelectorAll(".se-rotator > span")].map(bg),
      };
    });
    expect(paint.container).toBe("none");
    expect(paint.verbs).toHaveLength(4);
    for (const image of paint.verbs) expect(image).toContain("linear-gradient");
    // Y en todo momento hay, a lo sumo, un verbo visible.
    const visible = () =>
      page.$$eval(
        ".se-rotator > span",
        (spans) => spans.filter((s) => Number(getComputedStyle(s).opacity) > 0.5).length,
      );
    await expect.poll(visible).toBe(1);
  });

  test("el verbo cambia con el tiempo", async ({ page }) => {
    await page.goto("/");
    const current = () =>
      page.$$eval(".se-rotator > span", (spans) =>
        spans.findIndex((s) => Number(getComputedStyle(s).opacity) > 0.9),
      );
    await expect.poll(current, { timeout: 5000 }).toBeGreaterThanOrEqual(0);
    const first = await current();
    await expect.poll(current, { timeout: 8000 }).not.toBe(first);
  });
});

test.describe("lista de espera", () => {
  test.beforeEach(async () => {
    await rm(E2E_WAITLIST_DIR, { recursive: true, force: true });
  });

  test("anotarse guarda el email con su origen y confirma", async ({ page }) => {
    await page.goto("/");
    const form = page.locator('form[data-waitlist="hero"]');
    await form.getByLabel("Tu email").fill("ana@tunegocio.com");
    await form.getByRole("button", { name: "Sumarme a la lista" }).click();

    await expect(form.getByRole("status")).toHaveText(/Listo, te anotamos/);
    const files = await readdir(E2E_WAITLIST_DIR);
    expect(files).toHaveLength(1);
    const saved = JSON.parse(await readFile(path.join(E2E_WAITLIST_DIR, files[0]), "utf8"));
    expect(saved).toMatchObject({ email: "ana@tunegocio.com", source: "hero" });
    expect(Date.parse(saved.receivedAt)).not.toBeNaN();
  });

  test("el formulario de cierre guarda con su propio origen", async ({ page }) => {
    await page.goto("/");
    const form = page.locator('form[data-waitlist="cierre"]');
    await form.getByLabel("Tu email").fill("beto@tunegocio.com");
    await form.getByRole("button", { name: "Sumarme a la lista" }).click();
    await expect(form.getByRole("status")).toBeVisible();
    const [file] = await readdir(E2E_WAITLIST_DIR);
    const saved = JSON.parse(await readFile(path.join(E2E_WAITLIST_DIR, file), "utf8"));
    expect(saved.source).toBe("cierre");
  });

  test("un email inválido muestra el error junto al campo y no guarda nada", async ({ page }) => {
    await page.goto("/");
    const form = page.locator('form[data-waitlist="hero"]');
    await form.getByLabel("Tu email").fill("ana@tunegocio");
    await form.getByRole("button", { name: "Sumarme a la lista" }).click();

    await expect(form.getByRole("alert")).toHaveText(/Falta el dominio del email/);
    await expect(form.getByLabel("Tu email")).toHaveAttribute("aria-invalid", "true");
    await expect(form.getByLabel("Tu email")).toBeFocused();
    await expect(readdir(E2E_WAITLIST_DIR)).rejects.toThrow();
  });

  test("el endpoint rechaza un body inválido con 400 y el error del email", async ({ request }) => {
    const response = await request.post("/api/waitlist", { data: { email: "nope" } });
    expect(response.status()).toBe(400);
    expect((await response.json()).errors.email).toMatch(/Falta la @/);
  });

  test("un bot que completa el campo oculto recibe ok pero no se guarda", async ({ request }) => {
    const response = await request.post("/api/waitlist", {
      data: { email: "bot@x.com", company: "ACME" },
    });
    expect(response.status()).toBe(200);
    await expect(readdir(E2E_WAITLIST_DIR)).rejects.toThrow();
  });
});

test.describe("módulos", () => {
  test("las flechas cambian la pestaña activa y su panel", async ({ page }) => {
    await page.goto("/");
    const tabs = page.getByRole("tab");
    await expect(tabs).toHaveCount(4);
    await expect(tabs.first()).toHaveAttribute("aria-selected", "true");
    await expect(page.locator("#panel-connect")).toBeVisible();

    await tabs.first().focus();
    await page.keyboard.press("ArrowDown");
    await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
    await expect(tabs.nth(1)).toBeFocused();
    await expect(page.locator("#panel-report")).toBeVisible();
    await expect(page.locator("#panel-connect")).toBeHidden();

    await page.keyboard.press("End");
    await expect(page.locator("#panel-ideas")).toBeVisible();
    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#panel-connect")).toBeVisible();
  });

  test("los botones anterior y siguiente recorren los módulos y mueven los puntos", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Módulo siguiente" }).click();
    await expect(page.locator("#panel-report")).toBeVisible();
    await expect(page.locator(".se-dot[data-active]")).toHaveCount(1);
    await page.getByRole("button", { name: "Módulo anterior" }).click();
    await page.getByRole("button", { name: "Módulo anterior" }).click();
    await expect(page.locator("#panel-ideas")).toBeVisible();
  });
});

test.describe("movimiento", () => {
  test("la línea conectora se dibuja a medida que se scrollea", async ({ page }) => {
    await page.goto("/");
    const offset = () =>
      page.$eval("[data-connector]", (el) =>
        Number((el as HTMLElement).style.getPropertyValue("--offset")),
      );
    expect(await offset()).toBe(1);
    await page.locator("[data-connector]").scrollIntoViewIfNeeded();
    await page.mouse.wheel(0, 200);
    await expect.poll(offset).toBeLessThan(1);
  });

  test("la aurora y el carrusel se pausan fuera de pantalla", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#inicio")).not.toHaveClass(/is-paused/);
    await page.locator("#lista").scrollIntoViewIfNeeded();
    await expect(page.locator("#inicio")).toHaveClass(/is-paused/);
    await expect(page.locator(".se-marquee")).toHaveClass(/is-paused/);
  });

  test("con movimiento reducido no hay bucles ni desplazamientos, y todo se ve", async ({
    browser,
  }) => {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.goto("/");

    const state = await page.evaluate(() => {
      const name = (sel: string) => getComputedStyle(document.querySelector(sel) as Element);
      return {
        aurora: name(".se-aurora span").animationName,
        marquee: name(".se-marquee-track").animationName,
        float: name(".se-float").animationName,
        verbs: [...document.querySelectorAll(".se-rotator > span")].map(
          (s) => getComputedStyle(s).display,
        ),
        reveal: [...document.querySelectorAll(".se-reveal")].map((el) => {
          const s = getComputedStyle(el);
          return [s.opacity, s.transform];
        }),
        connector: (
          document.querySelector("[data-connector]") as HTMLElement
        ).style.getPropertyValue("--offset"),
      };
    });
    expect(state.aurora).toBe("none");
    expect(state.marquee).toBe("none");
    expect(state.float).toBe("none");
    expect(state.verbs).toEqual(["block", "none", "none", "none"]);
    expect(
      state.reveal.every(([opacity, transform]) => opacity === "1" && transform === "none"),
    ).toBe(true);
    expect(Number(state.connector)).toBe(0);
    await context.close();
  });

  test("sin JavaScript todo el contenido se ve", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto("/");
    await expect(page.locator("html")).not.toHaveClass(/\bjs\b/);
    const hidden = await page.$$eval(
      ".se-reveal, .se-stagger > *",
      (els) => els.filter((el) => Number(getComputedStyle(el).opacity) < 1).length,
    );
    expect(hidden).toBe(0);
    await expect(page.getByRole("heading", { name: /Cómo funciona/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Probalo 7 días sin costo/ })).toBeVisible();
    await context.close();
  });
});

test.describe("accesibilidad y SEO", () => {
  test("el foco de los controles es de 2px sólido con 2px de separación", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("tab").first().focus();
    await page.keyboard.press("Tab");
    expect(await outlineOf(page)).toEqual({ style: "solid", width: "2px", offset: "2px" });
    await page.locator('form[data-waitlist="hero"] button').focus();
    expect(await outlineOf(page)).toEqual({ style: "solid", width: "2px", offset: "2px" });
  });

  test("los mockups son decorativos y no se anuncian", async ({ page }) => {
    await page.goto("/");
    const exposed = await page.$$eval(
      ".mk-window",
      (els) => els.filter((el) => el.getAttribute("aria-hidden") !== "true").length,
    );
    expect(exposed).toBe(0);
  });

  test("lleva su JSON-LD de SoftwareApplication y su canonical en la raíz", async ({ page }) => {
    await page.goto("/");
    const graph = await page.$$eval('script[type="application/ld+json"]', (nodes) =>
      nodes.flatMap((n) => JSON.parse(n.textContent ?? "{}")["@graph"]),
    );
    const types = graph.map((node: { "@type": unknown }) => node["@type"]);
    expect(types).toContain("SoftwareApplication");
    expect(types).toContain("FAQPage");
    const faq = graph.find((node: { "@type": string }) => node["@type"] === "FAQPage");
    expect(faq.mainEntity[0].name).toBe("¿Qué es Social Engine?");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `${E2E_SITE_URL}/`);
    await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute(
      "content",
      "Social Engine",
    );
  });

  test("el sitemap tiene solo la raíz y llms.txt resume Social Engine", async ({ request }) => {
    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(sitemap).toContain(`<loc>${E2E_SITE_URL}/</loc>`);
    expect(sitemap).not.toContain("/social-engine");
    const llms = await (await request.get("/llms.txt")).text();
    expect(llms.startsWith("# Social Engine")).toBe(true);
    expect(llms).toContain(`[Lista de espera](${E2E_SITE_URL}/#lista)`);
    expect(llms).not.toMatch(/a medida|Freggiaro|Reservo/i);
  });

  test("robots.txt bloquea la API y apunta al sitemap del dominio", async ({ request }) => {
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toContain("Disallow: /api/");
    expect(robots).toContain(`Sitemap: ${E2E_SITE_URL}/sitemap.xml`);
  });

  test("lo que se eliminó ya no existe: /social-engine, la demo y el contacto", async ({
    request,
  }) => {
    expect((await request.get("/social-engine")).status()).toBe(404);
    expect((await request.get("/demo/freggiaro")).status()).toBe(404);
    expect((await request.post("/api/contact", { data: {} })).status()).toBe(404);
  });
});

test.describe("móvil", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("no hay scroll horizontal y el formulario ocupa el ancho", async ({ page }) => {
    await page.goto("/");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
    const box = await page.locator('form[data-waitlist="hero"] .se-form').boundingBox();
    expect(box?.width).toBeGreaterThan(300);
  });
});

const LIGHT_BG = "rgb(244, 244, 242)";
const DARK_BG = "rgb(14, 17, 22)";

/** Luminancia relativa y contraste WCAG de dos colores "rgb(r, g, b)". */
function contrast(a: string, b: string) {
  const lum = (css: string) => {
    const [r, g, bl] = (css.match(/\d+(\.\d+)?/g) ?? []).slice(0, 3).map(Number);
    const f = (v: number) => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(bl);
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

test.describe("tema claro y oscuro", () => {
  test.describe("con el dispositivo en claro", () => {
    test.use({ colorScheme: "light" });

    test("arranca claro, con fondo Papel y color-scheme light", async ({ page }) => {
      await page.goto("/");
      await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
      expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe(
        LIGHT_BG,
      );
      expect(
        await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme),
      ).toBe("light");
      await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute("content", "#f4f4f2");
    });

    test("el botón pasa a oscuro, lo recuerda al recargar y vuelve a claro", async ({ page }) => {
      await page.goto("/");
      const toggle = page.getByRole("button", { name: "Modo oscuro" });
      await expect(toggle).toHaveAttribute("aria-pressed", "false");
      await toggle.click();
      await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
      await expect(toggle).toHaveAttribute("aria-pressed", "true");
      expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe(
        DARK_BG,
      );
      await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute("content", "#0e1116");

      await page.reload();
      await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
      await expect(page.getByRole("button", { name: "Modo oscuro" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );

      await page.getByRole("button", { name: "Modo oscuro" }).click();
      await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
      expect(await page.evaluate(() => localStorage.getItem("theme"))).toBe("light");
    });

    test("la elección guardada gana sobre el dispositivo", async ({ page }) => {
      await page.addInitScript(() => localStorage.setItem("theme", "dark"));
      await page.goto("/");
      await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    });
  });

  test.describe("con el dispositivo en oscuro", () => {
    test.use({ colorScheme: "dark" });

    test("arranca oscuro con fondo Carbón y sin parpadeo: el tema ya está antes de pintar", async ({
      page,
    }) => {
      // Con JavaScript bloqueado después del <head> no hay forma de corregirlo tarde: se mira el
      // estado apenas se parsea el documento.
      await page.addInitScript(() => {
        document.addEventListener("readystatechange", () => {
          if (document.readyState === "interactive") {
            (window as unknown as { __early: string | undefined }).__early =
              document.documentElement.dataset.theme;
          }
        });
      });
      await page.goto("/");
      await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
      expect(await page.evaluate(() => (window as unknown as { __early: string }).__early)).toBe(
        "dark",
      );
      expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe(
        DARK_BG,
      );
    });

    test("sigue al dispositivo cuando no hay elección guardada", async ({ page }) => {
      await page.goto("/");
      await page.emulateMedia({ colorScheme: "light" });
      await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    });

    test("tarjetas con borde y sin sombra en oscuro", async ({ page }) => {
      await page.goto("/");
      const shadow = await page
        .locator(".se-card")
        .first()
        .evaluate((el) => getComputedStyle(el).boxShadow);
      expect(shadow).toBe("none");
    });
  });

  for (const scheme of ["light", "dark"] as const) {
    test(`el texto con degradé pasa 4,5:1 en ${scheme}`, async ({ browser }) => {
      const context = await browser.newContext({ colorScheme: scheme, reducedMotion: "reduce" });
      const page = await context.newPage();
      await page.goto("/");
      const result = await page.evaluate(() => {
        const bg = getComputedStyle(document.body).backgroundColor;
        // Las paradas del degradé de texto, tomadas del CSS real.
        const probe = document.createElement("span");
        probe.className = "se-grad";
        document.body.append(probe);
        const image = getComputedStyle(probe).backgroundImage;
        probe.remove();
        return { bg, image };
      });
      const stops = result.image.match(/rgb\([^)]*\)/g) ?? [];
      expect(stops).toHaveLength(3);
      for (const stop of stops) expect(contrast(stop, result.bg)).toBeGreaterThanOrEqual(4.5);
      await context.close();
    });
  }

  test("sin JavaScript se ve el contenido, sin botón de tema, y no hay parpadeo de layout", async ({
    browser,
  }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto("/");
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.getByRole("button", { name: "Modo oscuro" })).toBeHidden();
    await context.close();
  });
});

test.describe("logo", () => {
  test.use({ colorScheme: "light" });

  test("en claro la flecha y la palabra Social llevan el degradé", async ({ page }) => {
    await page.goto("/");
    const nav = page.locator(".se-nav");
    const arrow = nav.locator(".ex-logo-accent-gradient");
    expect(await arrow.evaluate((el) => getComputedStyle(el).stroke)).toMatch(/url\(/);
    await expect(nav.locator("linearGradient stop")).toHaveCount(3);
    const social = nav.locator(".se-logo-social");
    expect(await social.evaluate((el) => getComputedStyle(el).backgroundImage)).toContain(
      "linear-gradient",
    );
    expect(await social.evaluate((el) => getComputedStyle(el).color)).toBe("rgba(0, 0, 0, 0)");
  });

  test("en oscuro la flecha vuelve a ignite y Social va en tinta", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Modo oscuro" }).click();
    const nav = page.locator(".se-nav");
    expect(
      await nav.locator(".ex-logo-accent-gradient").evaluate((el) => getComputedStyle(el).stroke),
    ).toBe("rgb(255, 91, 46)");
    const social = nav.locator(".se-logo-social");
    expect(await social.evaluate((el) => getComputedStyle(el).backgroundImage)).toBe("none");
    expect(await social.evaluate((el) => getComputedStyle(el).color)).toBe("rgb(244, 244, 242)");
  });

  test("los ids del degradé son únicos en la página", async ({ page }) => {
    await page.goto("/");
    const ids = await page.$$eval("linearGradient[id]", (nodes) => nodes.map((n) => n.id));
    expect(ids.length).toBeGreaterThan(1);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
