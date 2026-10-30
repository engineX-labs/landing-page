import { readdir, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { expect, type Page, test } from "@playwright/test";
import { E2E_SITE_URL, E2E_WAITLIST_DIR } from "../../playwright.config";

const VERBS = ["Planificá", "Publicá", "Respondé", "Medí"];

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
    await page.goto("/social-engine");
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1 .sr-only")).toHaveText(
      "Planificá, publicá, respondé y medí tus redes sin saltar de app en app",
    );
    await expect(page.locator("h1 .se-rotator > span")).toHaveText(VERBS);
    await expect(page.locator("h1 [aria-hidden='true']")).toHaveCount(1);
  });

  test("un solo botón primario en la portada", async ({ page }) => {
    await page.goto("/social-engine");
    await expect(page.locator("#inicio .ex-btn-primary")).toHaveCount(1);
  });

  test("el degradé está en cada verbo y no en el contenedor: con background-clip del contenedor se verían todos a la vez", async ({
    page,
  }) => {
    await page.goto("/social-engine");
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
    await page.goto("/social-engine");
    const current = () =>
      page.$$eval(".se-rotator > span", (spans) =>
        spans.findIndex((s) => Number(getComputedStyle(s).opacity) > 0.9),
      );
    await expect.poll(current, { timeout: 5000 }).toBeGreaterThanOrEqual(0);
    const first = await current();
    await expect.poll(current, { timeout: 8000 }).not.toBe(first);
  });

  test("el tema es Papel: fondo claro y color-scheme light", async ({ page }) => {
    await page.goto("/social-engine");
    await expect(page.locator("html")).toHaveClass(/\bse\b/);
    await expect(page.locator('meta[name="color-scheme"]')).toHaveAttribute("content", "light");
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(bg).toBe("rgb(244, 244, 242)");
  });

  test("la home no cambió de tema y linkea a Social Engine desde el pie", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).not.toHaveClass(/\bse\b/);
    const link = page.locator("footer").getByRole("link", { name: "Social Engine" });
    await expect(link).toHaveAttribute("href", "/social-engine");
  });
});

test.describe("lista de espera", () => {
  test.beforeEach(async () => {
    await rm(E2E_WAITLIST_DIR, { recursive: true, force: true });
  });

  test("anotarse guarda el email con su origen y confirma", async ({ page }) => {
    await page.goto("/social-engine");
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
    await page.goto("/social-engine");
    const form = page.locator('form[data-waitlist="cierre"]');
    await form.getByLabel("Tu email").fill("beto@tunegocio.com");
    await form.getByRole("button", { name: "Sumarme a la lista" }).click();
    await expect(form.getByRole("status")).toBeVisible();
    const [file] = await readdir(E2E_WAITLIST_DIR);
    const saved = JSON.parse(await readFile(path.join(E2E_WAITLIST_DIR, file), "utf8"));
    expect(saved.source).toBe("cierre");
  });

  test("un email inválido muestra el error junto al campo y no guarda nada", async ({ page }) => {
    await page.goto("/social-engine");
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
    await page.goto("/social-engine");
    const tabs = page.getByRole("tab");
    await expect(tabs).toHaveCount(7);
    await expect(tabs.first()).toHaveAttribute("aria-selected", "true");
    await expect(page.locator("#panel-sync")).toBeVisible();

    await tabs.first().focus();
    await page.keyboard.press("ArrowDown");
    await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
    await expect(tabs.nth(1)).toBeFocused();
    await expect(page.locator("#panel-planning")).toBeVisible();
    await expect(page.locator("#panel-sync")).toBeHidden();

    await page.keyboard.press("End");
    await expect(page.locator("#panel-assistant")).toBeVisible();
    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#panel-sync")).toBeVisible();
  });

  test("los botones anterior y siguiente recorren los módulos y mueven los puntos", async ({
    page,
  }) => {
    await page.goto("/social-engine");
    await page.getByRole("button", { name: "Módulo siguiente" }).click();
    await expect(page.locator("#panel-planning")).toBeVisible();
    await expect(page.locator(".se-dot[data-active]")).toHaveCount(1);
    await page.getByRole("button", { name: "Módulo anterior" }).click();
    await page.getByRole("button", { name: "Módulo anterior" }).click();
    await expect(page.locator("#panel-assistant")).toBeVisible();
  });
});

test.describe("movimiento", () => {
  test("la línea conectora se dibuja a medida que se scrollea", async ({ page }) => {
    await page.goto("/social-engine");
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
    await page.goto("/social-engine");
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
    await page.goto("/social-engine");

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
    await page.goto("/social-engine");
    await expect(page.locator("html")).not.toHaveClass(/\bjs\b/);
    const hidden = await page.$$eval(
      ".se-reveal, .se-stagger > *",
      (els) => els.filter((el) => Number(getComputedStyle(el).opacity) < 1).length,
    );
    expect(hidden).toBe(0);
    await expect(page.getByRole("heading", { name: /Cómo funciona/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Un plan para cada forma/ })).toBeVisible();
    await context.close();
  });
});

test.describe("accesibilidad y SEO", () => {
  test("el foco de los controles es de 2px sólido con 2px de separación", async ({ page }) => {
    await page.goto("/social-engine");
    await page.getByRole("tab").first().focus();
    await page.keyboard.press("Tab");
    expect(await outlineOf(page)).toEqual({ style: "solid", width: "2px", offset: "2px" });
    await page.locator('form[data-waitlist="hero"] button').focus();
    expect(await outlineOf(page)).toEqual({ style: "solid", width: "2px", offset: "2px" });
  });

  test("los mockups son decorativos y no se anuncian", async ({ page }) => {
    await page.goto("/social-engine");
    const exposed = await page.$$eval(
      ".mk-window",
      (els) => els.filter((el) => el.getAttribute("aria-hidden") !== "true").length,
    );
    expect(exposed).toBe(0);
  });

  test("lleva su JSON-LD de SoftwareApplication y su canonical, sin el de la home", async ({
    page,
  }) => {
    await page.goto("/social-engine");
    const graph = await page.$$eval('script[type="application/ld+json"]', (nodes) =>
      nodes.flatMap((n) => JSON.parse(n.textContent ?? "{}")["@graph"]),
    );
    const types = graph.map((node: { "@type": unknown }) => node["@type"]);
    expect(types).toContain("SoftwareApplication");
    expect(types).toContain("FAQPage");
    const faq = graph.find((node: { "@type": string }) => node["@type"] === "FAQPage");
    expect(faq.mainEntity[0].name).toBe("¿Qué es Social Engine?");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      `${E2E_SITE_URL}/social-engine`,
    );
    await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute(
      "content",
      "Social Engine",
    );
  });

  test("el sitemap y llms.txt incluyen la página", async ({ request }) => {
    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(sitemap).toContain(`<loc>${E2E_SITE_URL}/social-engine</loc>`);
    const llms = await (await request.get("/llms.txt")).text();
    expect(llms).toContain(`[Social Engine](${E2E_SITE_URL}/social-engine)`);
  });
});

test.describe("móvil", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("no hay scroll horizontal y el formulario ocupa el ancho", async ({ page }) => {
    await page.goto("/social-engine");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
    const box = await page.locator('form[data-waitlist="hero"] .se-form').boundingBox();
    expect(box?.width).toBeGreaterThan(300);
  });
});
