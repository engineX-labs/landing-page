import { readdir, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { expect, type Page, test } from "@playwright/test";
import { E2E_CONTACTS_DIR, E2E_SITE_URL, E2E_WHATSAPP_NUMBER } from "../../playwright.config";

async function outlineOf(page: Page) {
  return page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el) return null;
    const s = getComputedStyle(el);
    return { style: s.outlineStyle, width: s.outlineWidth, offset: s.outlineOffset };
  });
}

test.describe("formulario de contacto", () => {
  test.beforeEach(async () => {
    await rm(E2E_CONTACTS_DIR, { recursive: true, force: true });
  });

  test("envío completo: guarda el mensaje y ofrece seguir por WhatsApp", async ({ page }) => {
    await page.goto("/#contacto");
    await page.getByLabel("Nombre").fill("Ana Pérez");
    await page.getByLabel("Email").fill("ana@tunegocio.com");
    await page
      .getByLabel("¿Qué querés resolver?")
      .fill("Reservas y cobros para mis cabañas. ¿Se puede?");
    await page.getByRole("button", { name: "Enviar mensaje" }).click();

    await expect(page.getByText("Recibimos tu mensaje")).toBeVisible();
    const link = page.getByRole("link", { name: "Seguir por WhatsApp" });
    await expect(link).toHaveAttribute("target", "_blank");

    const href = (await link.getAttribute("href")) ?? "";
    const url = new URL(href);
    expect(url.origin + url.pathname).toBe(`https://wa.me/${E2E_WHATSAPP_NUMBER}`);
    expect(url.searchParams.get("text")).toBe(
      "Hola engineX, soy Ana Pérez (ana@tunegocio.com).\n\nReservas y cobros para mis cabañas. ¿Se puede?",
    );

    const files = await readdir(E2E_CONTACTS_DIR);
    expect(files).toHaveLength(1);
    const saved = JSON.parse(await readFile(path.join(E2E_CONTACTS_DIR, files[0]), "utf8"));
    expect(saved).toMatchObject({ name: "Ana Pérez", email: "ana@tunegocio.com" });
  });

  test("email inválido: el error queda conectado por aria-describedby", async ({ page }) => {
    await page.goto("/#contacto");
    const email = page.getByLabel("Email");
    await email.fill("hola@");
    await email.blur();

    const error = page.locator("#contact-email-error");
    await expect(error).toBeVisible();
    await expect(error).toContainText("Falta el dominio del email, por ejemplo hola@tunegocio.com");
    await expect(email).toHaveAttribute("aria-invalid", "true");
    const describedBy = (await email.getAttribute("aria-describedby")) ?? "";
    expect(describedBy.split(" ")).toContain("contact-email-error");
    await expect(page.getByRole("textbox", { name: "Email" })).toHaveAccessibleDescription(
      /Falta el dominio/,
    );

    await email.fill("hola@tunegocio.com");
    await expect(error).toBeHidden();
    await expect(email).not.toHaveAttribute("aria-invalid", "true");
  });

  test("enviar vacío no llama al servidor y enfoca el primer error", async ({ page }) => {
    await page.goto("/#contacto");
    let requests = 0;
    page.on("request", (req) => {
      if (req.url().includes("/api/contact")) requests++;
    });
    await page.getByRole("button", { name: "Enviar mensaje" }).click();
    await expect(page.getByLabel("Nombre")).toBeFocused();
    await expect(page.locator("#contact-message-error")).toBeVisible();
    expect(requests).toBe(0);
  });
});

test("teclado: el foco se ve con el anillo de 2px en todo lo clickeable", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Saltar al contenido" })).toBeFocused();
  expect(await outlineOf(page)).toMatchObject({ style: "solid", width: "2px", offset: "2px" });

  const seen = new Set<string>();
  for (let i = 0; i < 9; i++) {
    await page.keyboard.press("Tab");
    const info = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement;
      return el.textContent?.trim() || el.getAttribute("aria-label") || el.tagName;
    });
    seen.add(info);
    expect(await outlineOf(page), `foco en "${info}"`).toMatchObject({
      style: "solid",
      width: "2px",
    });
  }
  expect([...seen]).toEqual(expect.arrayContaining(["Servicios", "Demo", "Ver proyectos"]));
});

test("un solo h1, como máximo un display-xl y un solo primary en el hero", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1")).toHaveCount(1);
  expect(await page.locator(".display-xl").count()).toBeLessThanOrEqual(1);
  await expect(page.locator("#inicio .ex-btn-primary")).toHaveCount(1);
  await expect(page.locator("header .ex-btn-primary")).toHaveCount(0);
});

test.describe("hero", () => {
  test("el primario abre WhatsApp con un saludo y el secundario lleva a proyectos", async ({
    page,
  }) => {
    await page.goto("/");
    const hero = page.locator("#inicio");
    const primary = hero.locator(".ex-btn-primary");
    await expect(primary).toHaveAccessibleName(/Escribinos por WhatsApp/);
    await expect(primary).toHaveAttribute("target", "_blank");
    const url = new URL((await primary.getAttribute("href")) ?? "");
    expect(url.origin + url.pathname).toBe(`https://wa.me/${E2E_WHATSAPP_NUMBER}`);
    expect(url.searchParams.get("text")).toContain("Hola engineX");

    await expect(hero.getByRole("link", { name: "Ver proyectos" })).toHaveAttribute(
      "href",
      "#proyectos",
    );
  });

  test("las capturas del hero son decorativas: no promocionan la demo", async ({ page }) => {
    await page.goto("/");
    const visual = page.locator("#inicio .hero-visual");
    await expect(visual).toHaveAttribute("aria-hidden", "true");
    await expect(visual.locator("a")).toHaveCount(0);
    await expect(page.locator("#inicio [data-opens-demo]")).toHaveCount(0);
    await expect(page.locator("#inicio")).not.toContainText("Probala");
  });

  test("las señales de confianza están debajo de los botones", async ({ page }) => {
    await page.goto("/");
    const trust = page.locator("#inicio .hero-trust li");
    await expect(trust).toHaveCount(3);
    await expect(trust.first()).toHaveText("Propuesta y presupuesto sin cargo");
  });
});

test.describe("sin JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("el titular se ve igual: la animación es CSS", async ({ page }) => {
    await page.goto("/");
    const title = page.locator("#hero-title");
    await expect(title).toHaveText("Sistemas de gestión y facturación ARCA para tu negocio");
    await expect(title).toHaveCSS("opacity", "1");
    await expect(title).toHaveCSS("transform", "none");
  });
});

test("el ítem Demo del menú abre el modal", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("navigation", { name: "Principal" })
    .getByRole("link", { name: "Demo" })
    .click();
  await expect(page.getByRole("dialog", { name: "Demo de Freggiaro" })).toBeVisible();
});

test("preguntas frecuentes: se abren con teclado y están en el JSON-LD", async ({ page }) => {
  await page.goto("/#preguntas");
  const first = page.locator("#preguntas details").first();
  const summary = first.locator("summary");
  await expect(page.locator("#preguntas details")).toHaveCount(6);
  await summary.focus();
  await page.keyboard.press("Enter");
  await expect(first).toHaveAttribute("open", "");
  await expect(first.locator(".faq-a")).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(first).not.toHaveAttribute("open", "");

  const raw = await page.locator('script[type="application/ld+json"]').textContent();
  const faq = JSON.parse(raw ?? "")["@graph"].find(
    (n: { "@type": string }) => n["@type"] === "FAQPage",
  );
  expect(faq.mainEntity).toHaveLength(6);
  expect(faq.mainEntity[0].name).toBe(await summary.textContent().then((t) => t?.trim()));
});

test("proyectos: la etiqueta avisa qué pasa al tocar cada tarjeta", async ({ page }) => {
  await page.goto("/");
  const cards = page.locator("#proyectos .ex-card");
  await expect(cards.filter({ hasText: "Freggiaro" }).locator(".ex-card-badge")).toHaveText(
    "Demo interactiva",
  );
  await expect(cards.filter({ hasText: "Reservo" }).locator(".ex-card-badge")).toHaveText(
    "Sitio en vivo",
  );
});

test("producción: solo proyectos reales, sin los borradores", async ({ page }) => {
  await page.goto("/");
  const cards = page.locator("#proyectos .ex-card");
  await expect(cards).toHaveCount(3);
  const reservo = page.getByRole("link", {
    name: /Reservo, gestión de reservas para alojamientos/,
  });
  await expect(reservo).toHaveAttribute("href", "https://www.mireservo.online");
  await expect(reservo.locator("img")).toHaveAttribute("alt", /calendario de reservas/);
});

test("la granja: tarjeta con link al sitio en punycode y logo en la barra de clientes", async ({
  page,
}) => {
  await page.goto("/");
  const granja = page.getByRole("link", { name: /Cabañas La Granja, landing para un complejo/ });
  await expect(granja).toHaveAttribute("href", "https://www.xn--cabaaslagranja-tnb.com");
  await expect(granja.locator("img")).toHaveAttribute("alt", /pileta/);

  const clientes = page.getByRole("region", { name: "Confían en nosotros" });
  await expect(clientes.getByRole("img", { name: "Cabañas La Granja" })).toBeVisible();
  await expect(clientes.getByRole("img", { name: "Freggiaro Frenos y Embragues" })).toBeVisible();
  await expect(clientes.getByRole("listitem")).toHaveCount(2);
  await expect(clientes.getByRole("link")).toHaveCount(0);
  // La barra va justo debajo del hero.
  const [hero, barra, servicios] = await Promise.all(
    ["#inicio", "#clientes-title", "#servicios"].map((sel) =>
      page.locator(sel).evaluate((el) => el.getBoundingClientRect().top + window.scrollY),
    ),
  );
  expect(hero).toBeLessThan(barra);
  expect(barra).toBeLessThan(servicios);
});

test.describe("movimiento reducido", () => {
  test.use({ reducedMotion: "reduce" });

  test("la captura de las tarjetas no se mueve en hover", async ({ page }) => {
    await page.goto("/#proyectos");
    const card = page.locator("#proyectos .ex-card-link").first();
    await card.hover();
    await expect(card.locator(".ex-card-shot")).toHaveCSS("transform", "none");
  });

  test("el hero entra solo con opacidad, sin desplazamiento", async ({ page }) => {
    await page.goto("/");
    const items = page.locator("[data-hero]");
    const count = await items.count();
    expect(count).toBeGreaterThan(0);

    // Durante la animación nunca hay transform.
    const during = await items.evaluateAll((els) =>
      els.map((el) => getComputedStyle(el).transform),
    );
    expect(during.every((t) => t === "none")).toBe(true);

    await expect(items.first()).toHaveCSS("opacity", "1");
    await expect(items.last()).toHaveCSS("opacity", "1");
    const after = await items.evaluateAll((els) => els.map((el) => getComputedStyle(el).transform));
    expect(after.every((t) => t === "none")).toBe(true);
  });
});

test("sin movimiento reducido el hero termina visible y en su lugar", async ({ page }) => {
  await page.goto("/");
  const title = page.locator("#hero-title");
  await expect(title).toHaveCSS("opacity", "1");
  await expect(title).toHaveCSS("transform", "none");
});

test.describe("móvil", () => {
  test.use({ viewport: { width: 375, height: 812 }, hasTouch: true });

  test("sin scroll horizontal, titulares a escala móvil y menú que abre y cierra", async ({
    page,
  }) => {
    await page.goto("/");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBe(0);
    await expect(page.locator("#hero-title")).toHaveCSS("font-size", "36px");

    // El nombre accesible cambia con el estado: "Abrir menú" / "Cerrar menú".
    const toggle = page.locator('button[aria-controls="menu-movil"]');
    await expect(toggle).toHaveAccessibleName("Abrir menú");
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(toggle).toHaveAccessibleName("Cerrar menú");
    const menu = page.locator("#menu-movil");
    await expect(menu).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await expect(toggle).toBeFocused();
    await expect(toggle).toHaveAccessibleName("Abrir menú");

    await toggle.click();
    await menu.getByRole("link", { name: "Contacto" }).click();
    await expect(menu).toBeHidden();
    await expect(page).toHaveURL(/#contacto$/);
  });
});

test.describe("SEO y GEO", () => {
  test("robots.txt bloquea la API y apunta al sitemap del dominio", async ({ request }) => {
    const res = await request.get("/robots.txt");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("text/plain");
    const body = await res.text();
    expect(body).toContain("Disallow: /api/");
    expect(body).toContain(`Sitemap: ${E2E_SITE_URL}/sitemap.xml`);
  });

  test("sitemap.xml lista la home con el dominio", async ({ request }) => {
    const res = await request.get("/sitemap.xml");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("xml");
    expect(await res.text()).toContain(`<loc>${E2E_SITE_URL}/</loc>`);
  });

  test("llms.txt resume engineX", async ({ request }) => {
    const res = await request.get("/llms.txt");
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body.startsWith("# engineX")).toBe(true);
    expect(body).toContain(`${E2E_SITE_URL}/#contacto`);
  });

  test("la home tiene URLs absolutas y JSON-LD válido", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `${E2E_SITE_URL}/`);
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
      "content",
      `${E2E_SITE_URL}/`,
    );
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      "content",
      `${E2E_SITE_URL}/brand/enginex-app-icon-512.png`,
    );
    const raw = await page.locator('script[type="application/ld+json"]').textContent();
    const data = JSON.parse(raw ?? "");
    const org = data["@graph"].find((n: { name?: string }) => n.name === "engineX");
    expect(org.url).toBe(`${E2E_SITE_URL}/`);
    expect(org.contactPoint.telephone).toBe(`+${E2E_WHATSAPP_NUMBER}`);
  });
});

test.describe("móvil: WhatsApp y demo a mano", () => {
  test.use({ viewport: { width: 375, height: 812 }, hasTouch: true });

  test("la barra de WhatsApp aparece al pasar el hero y se esconde en Contacto", async ({
    page,
  }) => {
    await page.goto("/");
    const bar = page.locator("[data-wa-bar]");
    const link = bar.getByRole("link", { name: /Escribinos por WhatsApp/ });
    await expect(bar).toHaveAttribute("data-visible", "false");
    await expect(link).toBeHidden();

    await page.locator("#servicios").scrollIntoViewIfNeeded();
    await expect(bar).toHaveAttribute("data-visible", "true");
    await expect(link).toBeVisible();
    const url = new URL((await link.getAttribute("href")) ?? "");
    expect(url.pathname).toBe(`/${E2E_WHATSAPP_NUMBER}`);

    await page.locator("#contacto").scrollIntoViewIfNeeded();
    await expect(bar).toHaveAttribute("data-visible", "false");

    // Al final de la página la barra no tapa el footer: el body le reserva lugar.
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const padding = await page.evaluate(() =>
      Number.parseFloat(getComputedStyle(document.body).paddingBottom),
    );
    expect(padding).toBeGreaterThanOrEqual(72);
  });

  test("Demo en el menú cierra el menú y abre el modal", async ({ page }) => {
    await page.goto("/");
    await page.locator('button[aria-controls="menu-movil"]').click();
    const menu = page.locator("#menu-movil");
    await menu.getByRole("link", { name: "Demo" }).click();
    await expect(menu).toBeHidden();
    await expect(page.getByRole("dialog", { name: "Demo de Freggiaro" })).toBeVisible();
  });

  test("en escritorio la barra no existe", async ({ browser }) => {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await page.goto("/");
    await page.locator("#servicios").scrollIntoViewIfNeeded();
    await expect(page.locator("[data-wa-bar]")).toBeHidden();
    await page.close();
  });
});
