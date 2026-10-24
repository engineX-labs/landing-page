// ─────────────────────────────────────────────────────────────────────────────
//  DOMINIO DEL SITIO: este es el único lugar donde se configura.
//
//  Completá DEFAULT_SITE_URL con el dominio público, con https y sin barra
//  final, por ejemplo "https://enginex.com.ar". También se puede pasar en el
//  build con la variable de entorno SITE_URL, que tiene prioridad.
//
//  Con el dominio se generan /sitemap.xml, la línea "Sitemap:" de /robots.txt,
//  el canonical, og:url, og:image y las URLs del JSON-LD y de /llms.txt.
//  Sin dominio el sitio compila igual, pero sin nada de eso.
// ─────────────────────────────────────────────────────────────────────────────

export const DEFAULT_SITE_URL = "";

/**
 * Valida y normaliza el dominio. Devuelve undefined si está vacío y tira un
 * error claro si está mal formado (así el build falla en vez de publicar URLs rotas).
 * @param {string | undefined} value
 * @returns {string | undefined}
 */
export function parseSiteUrl(value) {
  const raw = (value ?? "").trim();
  if (!raw) return undefined;

  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new Error(`SITE_URL "${raw}" no es una URL. Usá algo como "https://enginex.com.ar".`);
  }
  if (url.protocol !== "https:") {
    throw new Error(`SITE_URL "${raw}" tiene que empezar con https://.`);
  }
  if (url.pathname !== "/" || raw.endsWith("/") || url.search || url.hash) {
    throw new Error(
      `SITE_URL "${raw}" tiene que ser solo el dominio, sin barra final ni ruta. Ej.: "https://enginex.com.ar".`,
    );
  }
  if (url.username || url.password || url.port) {
    throw new Error(`SITE_URL "${raw}" no puede llevar usuario, contraseña ni puerto.`);
  }
  return url.origin;
}

/**
 * @param {Record<string, string | undefined>} env
 * @returns {string | undefined}
 */
export function resolveSiteUrl(env = process.env) {
  return parseSiteUrl(env.SITE_URL || DEFAULT_SITE_URL);
}
