// Tema claro/oscuro. Arranca con el del dispositivo y recuerda la elección de la persona.
// Funciones puras y el script del <head>: se testean sin navegador.

export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "theme";

/** Color de la barra del navegador (`theme-color`) de cada tema: el fondo de la página. */
export const THEME_COLORS: Record<Theme, string> = { light: "#f4f4f2", dark: "#0e1116" };

export function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark";
}

/** La elección guardada gana; sin ella, el modo del dispositivo; sin dato, oscuro. */
export function resolveTheme(stored: unknown, prefersLight: boolean): Theme {
  if (isTheme(stored)) return stored;
  return prefersLight ? "light" : "dark";
}

export function otherTheme(theme: Theme): Theme {
  return theme === "light" ? "dark" : "light";
}

/**
 * Script inline del <head>: fija el tema antes del primer pintado para que no haya parpadeo.
 * Es la misma lógica que `resolveTheme`, escrita a mano porque corre antes que cualquier módulo.
 */
export const themeInitScript = `(function(){var d=document.documentElement,t;try{t=localStorage.getItem("${THEME_STORAGE_KEY}")}catch(e){}if(t!=="light"&&t!=="dark"){try{t=matchMedia("(prefers-color-scheme: light)").matches?"light":"dark"}catch(e){t="dark"}}d.dataset.theme=t;d.style.colorScheme=t;var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content",t==="light"?"${THEME_COLORS.light}":"${THEME_COLORS.dark}")})();`;
