import { expect, type Page, test } from "@playwright/test";
import { E2E_WHATSAPP_NUMBER } from "../../playwright.config";

type Handler = (body: { messages: { role: string; content: string }[] }) => {
  status: number;
  body: unknown;
};

/** El servidor de pruebas no tiene key de Gemini: se simula /api/assistant, sin llamar a Google. */
async function stubAssistant(page: Page, handler: Handler, calls: unknown[] = []) {
  await page.route("**/api/assistant", async (route) => {
    const request = route.request();
    if (request.method() === "GET") {
      return route.fulfill({ json: { enabled: true } });
    }
    const body = request.postDataJSON();
    calls.push(body);
    const { status, body: json } = handler(body);
    return route.fulfill({ status, json });
  });
}

const ok: Handler = ({ messages }) => ({
  status: 200,
  body: { ok: true, reply: `Respuesta a: ${messages.at(-1)?.content}` },
});

const path = "/";

test.describe("Fidel", () => {
  test("abre, responde y cierra con Esc devolviendo el foco", async ({ page }) => {
    const calls: unknown[] = [];
    await stubAssistant(page, ok, calls);
    await page.goto(path);

    const toggle = page.getByRole("button", { name: "Preguntale a Fidel" });
    await expect(toggle).toBeVisible();
    await toggle.click();

    const dialog = page.getByRole("dialog", { name: "Fidel" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/asistente de IA de engineX/).first()).toBeVisible();

    const input = page.getByLabel("Tu pregunta para Fidel");
    await expect(input).toBeFocused();
    await input.fill("¿Qué hacen?");
    await input.press("Enter");

    await expect(dialog.getByText("Respuesta a: ¿Qué hacen?")).toBeVisible();
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({
      messages: [{ role: "user", content: "¿Qué hacen?" }],
    });

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(toggle).toBeFocused();
  });

  test("las preguntas sugeridas envían la consulta", async ({ page }) => {
    await stubAssistant(page, ok);
    await page.goto(path);
    await page.getByRole("button", { name: "Preguntale a Fidel" }).click();
    const chip = page.locator(".assistant-chip").first();
    const text = (await chip.textContent()) ?? "";
    await chip.click();
    await expect(page.getByText(`Respuesta a: ${text}`)).toBeVisible();
    await expect(page.locator(".assistant-chip")).toHaveCount(0);
  });

  test("si se llegó al límite, muestra un mensaje amable con WhatsApp y conserva el texto", async ({
    page,
  }) => {
    await stubAssistant(page, () => ({
      status: 503,
      body: { ok: false, code: "unavailable", error: "no disponible" },
    }));
    await page.goto(path);
    await page.getByRole("button", { name: "Preguntale a Fidel" }).click();
    const input = page.getByLabel("Tu pregunta para Fidel");
    await input.fill("Hola");
    await input.press("Enter");

    const link = page.getByRole("link", { name: /Escribinos por WhatsApp/ }).last();
    await expect(link).toBeVisible();
    expect(new URL((await link.getAttribute("href")) ?? "").pathname).toBe(
      `/${E2E_WHATSAPP_NUMBER}`,
    );
    await expect(input).toHaveValue("Hola");
  });

  test("tras un error se puede reintentar sin romper el historial", async ({ page }) => {
    let first = true;
    const calls: { messages: unknown[] }[] = [];
    await stubAssistant(
      page,
      (body) => {
        if (first) {
          first = false;
          return { status: 502, body: { ok: false, code: "error", error: "x" } };
        }
        return ok(body);
      },
      calls,
    );
    await page.goto(path);
    await page.getByRole("button", { name: "Preguntale a Fidel" }).click();
    const input = page.getByLabel("Tu pregunta para Fidel");
    await input.fill("Hola");
    await input.press("Enter");
    await expect(page.getByRole("link", { name: /Escribinos por WhatsApp/ }).last()).toBeVisible();
    await input.press("Enter");
    await expect(page.getByText("Respuesta a: Hola")).toBeVisible();
    expect(calls[1].messages).toHaveLength(1);
  });

  test("los marcadores [[whatsapp]] y [[lista]] son links; las URLs sueltas no", async ({
    page,
  }) => {
    await stubAssistant(page, () => ({
      status: 200,
      body: {
        ok: true,
        reply: "Escribinos por [[whatsapp]] o sumate a [[lista]]. https://malo.test [[otro]]",
      },
    }));
    await page.goto(path);
    await page.getByRole("button", { name: "Preguntale a Fidel" }).click();
    const input = page.getByLabel("Tu pregunta para Fidel");
    await input.fill("hola");
    await input.press("Enter");

    const reply = page.locator('.assistant-msg[data-role="assistant"]').last();
    const whatsapp = reply.getByRole("link", { name: /WhatsApp/ });
    await expect(whatsapp).toHaveAttribute("target", "_blank");
    await expect(whatsapp).toHaveAttribute("rel", "noopener");
    const url = new URL((await whatsapp.getAttribute("href")) ?? "");
    expect(url.pathname).toBe(`/${E2E_WHATSAPP_NUMBER}`);
    await expect(reply.getByRole("link", { name: "la lista de espera" })).toHaveAttribute(
      "href",
      "/#lista",
    );
    // Solo esos dos son links: la URL suelta y el marcador desconocido quedan como texto o se descartan.
    await expect(reply.getByRole("link")).toHaveCount(2);
    await expect(reply).toContainText("https://malo.test");
    await expect(reply).not.toContainText("[[otro]]");
  });

  test("el texto de la respuesta nunca se interpreta como HTML", async ({ page }) => {
    await stubAssistant(page, () => ({
      status: 200,
      body: { ok: true, reply: '<img src=x onerror="window.__xss=1"><b>hola</b>' },
    }));
    await page.goto(path);
    await page.getByRole("button", { name: "Preguntale a Fidel" }).click();
    const input = page.getByLabel("Tu pregunta para Fidel");
    await input.fill("probando");
    await input.press("Enter");
    await expect(page.locator('.assistant-msg[data-role="assistant"]').last()).toContainText(
      "<b>hola</b>",
    );
    expect(await page.evaluate(() => (window as unknown as { __xss?: number }).__xss)).toBe(
      undefined,
    );
    await expect(page.locator(".assistant-msg b")).toHaveCount(0);
  });

  test("el foco es de 2px sólido con 2px de separación", async ({ page }) => {
    await stubAssistant(page, ok);
    await page.goto(path);
    await page.getByRole("button", { name: "Preguntale a Fidel" }).focus();
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");
    const outline = await page.evaluate(() => {
      const s = getComputedStyle(document.activeElement as HTMLElement);
      return { style: s.outlineStyle, width: s.outlineWidth, offset: s.outlineOffset };
    });
    expect(outline).toEqual({ style: "solid", width: "2px", offset: "2px" });
  });

  test("no suma botones primary ni scroll horizontal en móvil", async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await stubAssistant(page, ok);
    await page.goto(path);
    await expect(page.locator(".assistant .ex-btn-primary")).toHaveCount(0);
    await page.getByRole("button", { name: "Preguntale a Fidel" }).click();
    await expect(page.getByRole("dialog", { name: "Fidel" })).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
    await context.close();
  });
});

test("con movimiento reducido el panel no se desplaza", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await stubAssistant(page, ok);
  await page.goto("/");
  await page.getByRole("button", { name: "Preguntale a Fidel" }).click();
  await expect(page.getByRole("dialog", { name: "Fidel" })).toBeVisible();
  const transform = await page
    .locator("[data-assistant-panel]")
    .evaluate((el) => getComputedStyle(el).transform);
  expect(transform).toBe("none");
  await context.close();
});

test.describe("sin key de Gemini (como el servidor de pruebas)", () => {
  test("el widget no aparece y el endpoint está apagado", async ({ page, request }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("button", { name: "Preguntale a Fidel" })).toBeHidden();

    const status = await request.get("/api/assistant");
    expect(await status.json()).toEqual({ enabled: false });

    const res = await request.post("/api/assistant", {
      data: { messages: [{ role: "user", content: "hola" }] },
    });
    expect(res.status()).toBe(503);
  });

  test("sin JavaScript no hay widget y la página se ve igual", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto("/");
    await expect(page.getByRole("button", { name: "Preguntale a Fidel" })).toBeHidden();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await context.close();
  });
});
