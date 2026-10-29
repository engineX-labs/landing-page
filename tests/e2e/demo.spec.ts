import { expect, type Page, test } from "@playwright/test";

const DEMO = "/demo/freggiaro";
const demo = "[data-demo]";

const card = (page: Page) => page.getByRole("link", { name: /Freggiaro, sistema de gestión/ });
const dialog = (page: Page) => page.getByRole("dialog", { name: "Demo de Freggiaro" });
const frame = (page: Page) => page.frameLocator("[data-demo-frame]");

test.describe("modal en la home", () => {
  test("la home no carga la demo hasta que se abre", async ({ page }) => {
    const requests: string[] = [];
    page.on("request", (req) => requests.push(req.url()));
    await page.goto("/");

    await expect(page.locator("#proyectos .ex-card")).toHaveCount(2);
    await expect(page.locator(demo)).toHaveCount(0);
    await expect(page.locator("[data-demo-frame]")).not.toHaveAttribute("src", /.+/);
    expect(requests.some((url) => url.includes(DEMO))).toBe(false);

    await expect(card(page)).toHaveAttribute("href", DEMO);
    await expect(card(page)).toHaveAttribute("aria-haspopup", "dialog");
  });

  test("la tarjeta abre el modal con la demo y la X lo cierra devolviendo el foco", async ({
    page,
  }) => {
    await page.goto("/");
    await card(page).click();
    await expect(dialog(page)).toBeVisible();
    await expect(page).toHaveURL(/\/$/);
    await expect(frame(page).locator("[data-title]")).toHaveText("Dashboard");
    await expect(page.locator("[data-demo-loading]")).toBeHidden();
    // Dentro del modal la demo no muestra su barra propia.
    await expect(frame(page).locator(".demo-bar")).toBeHidden();

    // Se puede usar de verdad desde el modal.
    await frame(page).getByRole("tab", { name: "Ventas" }).click();
    await frame(page).getByRole("button", { name: "Facturar" }).first().click();
    await expect(
      frame(page).getByText("Factura B 0003-00000320", { exact: true }).first(),
    ).toBeVisible();

    await page.getByRole("button", { name: "Cerrar demo" }).click();
    await expect(dialog(page)).toBeHidden();
    await expect(card(page)).toBeFocused();
  });

  test("en escritorio el modal queda centrado", async ({ page }) => {
    await page.goto("/");
    await card(page).click();
    const viewport = page.viewportSize();
    if (!viewport) throw new Error("sin viewport");
    await expect
      .poll(async () => {
        const box = await dialog(page).boundingBox();
        return box ? Math.round(box.x * 2 + box.width) : 0;
      })
      .toBe(viewport.width);
  });

  test("Esc dentro de la demo cierra el modal", async ({ page }) => {
    await page.goto("/");
    await card(page).click();
    const tab = frame(page).getByRole("tab", { name: "Productos" });
    await tab.click();
    await tab.press("Escape");
    await expect(dialog(page)).toBeHidden();
    await expect(card(page)).toBeFocused();
  });

  test("«Quiero algo así» cierra el modal y lleva al formulario", async ({ page }) => {
    await page.goto("/");
    await card(page).click();
    await dialog(page).getByRole("link", { name: "Quiero algo así" }).click();
    await expect(dialog(page)).toBeHidden();
    await expect(page).toHaveURL(/#contacto$/);
    await expect(page.getByLabel("Nombre")).toBeInViewport();
  });

  test("/#demo-freggiaro abre el modal al cargar y al cerrar se limpia el hash", async ({
    page,
  }) => {
    await page.goto("/#demo-freggiaro");
    await expect(dialog(page)).toBeVisible();
    await expect(frame(page).locator("[data-title]")).toHaveText("Dashboard");
    await page.keyboard.press("Escape");
    await expect(dialog(page)).toBeHidden();
    await expect(page).toHaveURL(/\/$/);
  });

  test("con Ctrl/Cmd la tarjeta abre la página de la demo, como un link", async ({ page }) => {
    await page.goto("/");
    const [popup] = await Promise.all([
      page.context().waitForEvent("page"),
      card(page).click({ modifiers: ["ControlOrMeta"] }),
    ]);
    await expect(dialog(page)).toBeHidden();
    await popup.waitForLoadState();
    expect(new URL(popup.url()).pathname).toBe(DEMO);
  });
});

test.describe("página de la demo", () => {
  test("sola: tiene su barra, no se indexa y no está en el sitemap", async ({ page, request }) => {
    await page.goto(DEMO);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex");
    await expect(page.getByRole("link", { name: "engineX, volver al inicio" })).toHaveAttribute(
      "href",
      "/",
    );
    await expect(page.getByRole("link", { name: "Quiero algo así" })).toHaveAttribute(
      "href",
      "/#contacto",
    );
    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(sitemap).not.toContain(DEMO);
  });

  test("el menú cambia de panel y se mueve con el teclado", async ({ page }) => {
    await page.goto(DEMO);
    const dashboard = page.getByRole("tab", { name: "Dashboard" });
    const productos = page.getByRole("tab", { name: "Productos" });
    const ventas = page.getByRole("tab", { name: "Ventas" });
    const facturacion = page.getByRole("tab", { name: "Facturación" });
    const title = page.locator(`${demo} [data-title]`);

    await expect(dashboard).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("tabpanel", { name: "Dashboard" })).toBeVisible();
    await expect(title).toHaveText("Dashboard");

    await dashboard.focus();
    await page.keyboard.press("ArrowDown");
    await expect(productos).toBeFocused();
    await expect(page.getByRole("tabpanel", { name: "Productos" })).toBeVisible();
    await expect(page.getByRole("tabpanel", { name: "Dashboard" })).toBeHidden();
    await expect(title).toHaveText("Productos");

    await page.keyboard.press("End");
    await expect(facturacion).toBeFocused();
    await expect(page.getByRole("tabpanel", { name: "Facturación" })).toBeVisible();

    await page.keyboard.press("ArrowUp");
    await expect(ventas).toBeFocused();

    await page.keyboard.press("Home");
    await expect(dashboard).toBeFocused();
  });

  test("dashboard: cambiar el período cambia los números", async ({ page }) => {
    await page.goto(DEMO);
    const panel = page.locator("#demo-panel-dashboard");
    await expect(panel.getByText("$ 18.746.300")).toBeVisible();

    await panel.getByRole("button", { name: "Año" }).click();
    await expect(panel.getByRole("button", { name: "Año" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(panel.getByText("$ 196.420.800")).toBeVisible();
    await expect(panel.getByText("$ 18.746.300")).toBeHidden();

    await panel.getByRole("button", { name: "Hoy" }).click();
    await expect(panel.getByText("$ 842.600")).toBeVisible();
  });

  test("dashboard: el gráfico muestra el valor del punto bajo el cursor", async ({ page }) => {
    await page.goto(DEMO);
    const view = page.locator("#demo-panel-dashboard [data-period-view='mes']");
    const chart = view.locator("[data-chart]");
    const readout = view.locator("[data-readout]");
    await expect(readout).toHaveText("Pasá el cursor o tocá el gráfico");

    await chart.scrollIntoViewIfNeeded();
    const box = await chart.boundingBox();
    if (!box) throw new Error("el gráfico no tiene caja");
    await page.mouse.move(box.x + box.width - 4, box.y + box.height / 2);
    await expect(readout).toHaveText("27 oct: $ 2.448.300");
    await expect(chart.locator("[data-marker]")).toBeVisible();

    await page.mouse.move(box.x + 4, box.y + box.height / 2);
    await expect(readout).toHaveText("01 oct: $ 746.000");
  });

  test("productos: la búsqueda y la categoría filtran, y avisan cuántos quedan", async ({
    page,
  }) => {
    await page.goto(DEMO);
    await page.getByRole("tab", { name: "Productos" }).click();
    const panel = page.locator("#demo-panel-productos");
    const rows = panel.locator("tbody tr:not([hidden])");
    const count = panel.getByRole("status");

    await expect(rows).toHaveCount(8);
    await expect(count).toHaveText("8 de 8 productos");

    await panel.getByLabel("Buscar").fill("RULEMAN");
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toContainText("Rulemán de empuje SKF VKC");
    await expect(count).toHaveText("1 de 8 productos");

    await panel.getByLabel("Buscar").fill("");
    await panel.getByRole("button", { name: "Frenos" }).click();
    await expect(rows).toHaveCount(2);

    await panel.getByLabel("Buscar").fill("embrague");
    await expect(rows).toHaveCount(0);
    await expect(panel.getByText("No encontramos productos con esa búsqueda.")).toBeVisible();
  });

  test("clientes: búsqueda, filtro de deuda y pago simulado", async ({ page }) => {
    await page.goto(DEMO);
    await page.getByRole("tab", { name: "Clientes" }).click();
    const panel = page.locator("#demo-panel-clientes");
    const rows = panel.locator("tbody tr:not([hidden])");
    const total = panel.locator("[data-debt-total]");
    const debtors = panel.locator("[data-debtors]");
    const reset = panel.getByRole("button", { name: "Reiniciar saldos" });

    await expect(rows).toHaveCount(8);
    // La tabla no se aplasta dentro del panel: muestra todas sus filas enteras.
    const wrap = panel.locator(".fg-table-wrap");
    expect(await wrap.evaluate((el) => el.scrollHeight - el.clientHeight)).toBeLessThanOrEqual(1);
    await expect(total).toHaveText("$ 704.900");
    await expect(debtors).toHaveText("4");

    await panel.getByLabel("Buscar cliente").fill("30-71234567");
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toContainText("Transporte Andino");
    await panel.getByLabel("Buscar cliente").fill("");

    await panel.getByRole("button", { name: "Con saldo pendiente" }).click();
    await expect(rows).toHaveCount(4);
    await expect(panel.getByText("4 de 8 clientes")).toBeVisible();

    const andino = rows.filter({ hasText: "Transporte Andino" });
    await andino.getByRole("button", { name: "Registrar pago" }).click();
    await expect(total).toHaveText("$ 292.600");
    await expect(debtors).toHaveText("3");
    await expect(rows).toHaveCount(3);
    const notice = panel.locator("[data-pay-status]");
    await expect(notice).toContainText("Registramos un pago de $ 412.300 de Transporte Andino");
    await expect(notice).toBeFocused();

    await panel.getByRole("button", { name: "Todos" }).click();
    await expect(
      panel.locator("tbody tr", { hasText: "Transporte Andino" }).getByText("Al día"),
    ).toBeVisible();

    await reset.click();
    await expect(total).toHaveText("$ 704.900");
    await expect(debtors).toHaveText("4");
    await expect(reset).toBeHidden();
    await expect(notice).toBeHidden();
  });

  test("ventas: facturar emite un comprobante, aparece en Facturación y se reinicia", async ({
    page,
  }) => {
    await page.goto(DEMO);
    await page.getByRole("tab", { name: "Ventas" }).click();
    const panel = page.locator("#demo-panel-ventas");
    const fiscal = page.locator("#demo-panel-facturacion");
    const status = panel.getByRole("status");
    const reset = panel.getByRole("button", { name: "Reiniciar ventas" });
    const goto = panel.getByRole("button", { name: "Ver en Facturación" });

    await expect(panel.getByText("Sin facturar")).toHaveCount(3);
    await expect(reset).toBeHidden();

    await panel.getByRole("button", { name: "Facturar" }).first().click();
    await expect(panel.getByText("Factura B 0003-00000320", { exact: true })).toBeVisible();
    await expect(status).toContainText(
      "Emitimos la Factura B 0003-00000320 para Lubricentro Norte",
    );
    await expect(status).toContainText("sin validez fiscal");

    // Una venta ya facturada no se factura de nuevo.
    await panel.getByRole("button", { name: "Facturada" }).click({ force: true });
    await expect(panel.getByText("Factura B 0003-00000321", { exact: true })).toHaveCount(0);

    await panel.getByRole("button", { name: "Facturar" }).first().click();
    await expect(panel.getByText("Factura B 0003-00000321", { exact: true })).toBeVisible();

    await goto.click();
    await expect(page.getByRole("tab", { name: "Facturación" })).toBeFocused();
    await expect(fiscal.locator("tbody tr:not([hidden])")).toHaveCount(5);
    await expect(fiscal.getByText("Factura B 0003-00000320", { exact: true })).toBeVisible();

    await page.getByRole("tab", { name: "Ventas" }).click();
    await reset.click();
    await expect(panel.getByText("Sin facturar")).toHaveCount(3);
    await page.getByRole("tab", { name: "Facturación" }).click();
    await expect(fiscal.locator("tbody tr:not([hidden])")).toHaveCount(3);
  });

  test("usa los colores de Freggiaro", async ({ page }) => {
    await page.goto(DEMO);
    await expect(page.locator(demo)).toHaveCSS("background-color", "rgb(15, 15, 15)");
    await expect(page.getByRole("tab", { name: "Dashboard" })).toHaveCSS(
      "background-color",
      "rgb(251, 191, 36)",
    );
    await expect(page.locator(demo).getByRole("img", { name: "Freggiaro" })).toBeVisible();
  });
});

test.describe("movimiento reducido", () => {
  test.use({ reducedMotion: "reduce" });

  test("el modal entra solo con opacidad", async ({ page }) => {
    await page.goto("/");
    await card(page).click();
    await expect(dialog(page)).toHaveCSS("animation-name", "ex-fade");
  });
});

test.describe("móvil", () => {
  test.use({ viewport: { width: 375, height: 812 }, hasTouch: true });

  test("el modal ocupa la pantalla y la demo no scrollea de costado", async ({ page }) => {
    await page.goto("/");
    await card(page).click();
    // Se mide cuando termina la animación de entrada.
    await expect
      .poll(async () => dialog(page).boundingBox())
      .toMatchObject({ x: 0, y: 0, width: 375, height: 812 });

    const app = frame(page);
    for (const name of ["Dashboard", "Productos", "Clientes", "Ventas", "Facturación"]) {
      await app.getByRole("tab", { name }).click();
      const overflow = await app.locator("html").evaluate((el) => el.scrollWidth - el.clientWidth);
      expect(overflow, `pestaña ${name}`).toBe(0);
      const tables = await app
        .locator(".fg-table-wrap:visible")
        .evaluateAll((els) => els.map((el) => el.scrollWidth - el.clientWidth));
      expect(
        tables.every((d) => d <= 0),
        `tablas de ${name}: ${tables}`,
      ).toBe(true);
    }
  });
});
