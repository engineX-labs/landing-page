// Interacciones de /social-engine. Sin librerías: IntersectionObserver, scroll con rAF y fetch.
import { connectorOffset, nextTabIndex } from "../lib/social-engine-ui";
import { validateWaitlistEmail, type WaitlistResponseBody } from "../lib/waitlist";

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Aparición al scrollear: arranca antes de que el bloque entre, para no dejar huecos en blanco. */
function setupReveal() {
  const targets = document.querySelectorAll<HTMLElement>(".se-reveal, .se-stagger");
  if (reducedMotion || !("IntersectionObserver" in window)) {
    for (const el of targets) el.classList.add("in");
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("in");
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: "0px 0px 25% 0px" },
  );
  for (const el of targets) observer.observe(el);
}

/** Pausa las animaciones infinitas (aurora, carrusel, tarjetas) mientras no se ven. */
function setupPause() {
  if (!("IntersectionObserver" in window)) return;
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) entry.target.classList.toggle("is-paused", !entry.isIntersecting);
  });
  for (const el of document.querySelectorAll("[data-pausable]")) observer.observe(el);
}

/** La línea de degradé se dibuja a medida que se baja de la portada a los módulos. */
function setupConnector() {
  const el = document.querySelector<HTMLElement>("[data-connector]");
  if (!el) return;
  let frame = 0;
  const update = () => {
    frame = 0;
    const { top, height } = el.getBoundingClientRect();
    const offset = connectorOffset({ top, height, viewport: window.innerHeight, reducedMotion });
    el.style.setProperty("--offset", offset.toFixed(3));
  };
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);
  update();
}

/** Pestañas de módulos: flechas, Home y End, botones anterior y siguiente, y puntos de avance. */
function setupModules() {
  const root = document.querySelector<HTMLElement>("[data-modules]");
  if (!root) return;
  const tabs = [...root.querySelectorAll<HTMLButtonElement>("[data-tab]")];
  const panels = [...root.querySelectorAll<HTMLElement>("[data-panel]")];
  const dots = [...root.querySelectorAll<HTMLElement>(".se-dot")];

  const select = (index: number, focus = false) => {
    tabs.forEach((tab, i) => {
      const on = i === index;
      tab.setAttribute("aria-selected", String(on));
      tab.tabIndex = on ? 0 : -1;
      panels[i].hidden = !on;
      dots[i]?.toggleAttribute("data-active", on);
    });
    if (focus) tabs[index].focus();
  };
  const current = () => tabs.findIndex((tab) => tab.getAttribute("aria-selected") === "true");

  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => select(i));
    tab.addEventListener("keydown", (event) => {
      const next = nextTabIndex(i, event.key, tabs.length);
      if (next === undefined) return;
      event.preventDefault();
      select(next, true);
    });
  });
  root.querySelector("[data-prev]")?.addEventListener("click", () => {
    select(nextTabIndex(current(), "ArrowLeft", tabs.length) ?? 0);
  });
  root.querySelector("[data-next]")?.addEventListener("click", () => {
    select(nextTabIndex(current(), "ArrowRight", tabs.length) ?? 0);
  });
}

function showMessage(form: HTMLFormElement, state: "ok" | "error", text: string) {
  const shown = form.querySelector<HTMLElement>(state === "ok" ? "[data-ok]" : "[data-error]");
  const other = form.querySelector<HTMLElement>(state === "ok" ? "[data-error]" : "[data-ok]");
  if (!shown || !other) return;
  other.hidden = true;
  other.textContent = "";
  shown.textContent = text;
  shown.hidden = false;
}

async function sendEmail(form: HTMLFormElement): Promise<WaitlistResponseBody> {
  const data = new FormData(form);
  try {
    const response = await fetch(form.action, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: data.get("email"),
        company: data.get("company"),
        source: form.dataset.waitlist,
      }),
    });
    return (await response.json()) as WaitlistResponseBody;
  } catch (error) {
    console.error("[waitlist] no se pudo enviar el email", error);
    return { ok: false, error: "No pudimos enviar tu email. Probá de nuevo en un rato." };
  }
}

async function submitWaitlist(form: HTMLFormElement) {
  const box = form.querySelector<HTMLElement>(".se-form");
  const input = form.querySelector<HTMLInputElement>('input[name="email"]');
  const button = form.querySelector<HTMLButtonElement>("[data-submit]");
  if (!input || !button) return;

  const error = validateWaitlistEmail(input.value);
  box?.toggleAttribute("data-invalid", Boolean(error));
  input.setAttribute("aria-invalid", String(Boolean(error)));
  if (error) {
    showMessage(form, "error", error);
    input.focus();
    return;
  }

  button.disabled = true;
  button.setAttribute("aria-busy", "true");
  const result = await sendEmail(form);
  button.disabled = false;
  button.removeAttribute("aria-busy");

  if (result.ok) {
    form.reset();
    showMessage(form, "ok", "Listo, te anotamos. Te escribimos cuando abramos lugares.");
    return;
  }
  const text = result.errors?.email ?? result.error ?? "No pudimos guardar tu email.";
  box?.setAttribute("data-invalid", "");
  showMessage(form, "error", text);
}

function setupWaitlist() {
  for (const form of document.querySelectorAll<HTMLFormElement>("[data-waitlist]")) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      void submitWaitlist(form);
    });
  }
}

setupReveal();
setupPause();
setupConnector();
setupModules();
setupWaitlist();
