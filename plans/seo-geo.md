# Plan: SEO y GEO de la landing de engineX

Estado: aprobado

## Objetivo

Preparar la landing para buscadores (SEO) y para motores de respuesta con IA (GEO): `robots.txt`, `sitemap.xml` y la metadata que depende del dominio. El dominio se configura en **un solo lugar**, fácil de encontrar, para que un compañero lo complete después del push. Además, el `README.md` explica cómo correr la landing y sus tests, y cómo está pensada y estructurada.

## Feature a implementar

`feature/seo-geo`: dominio configurable en un único archivo, `robots.txt` y `sitemap.xml` generados en el build con ese dominio, datos estructurados (JSON-LD) de engineX, `llms.txt`, las URLs absolutas de la metadata (canonical, `og:url`, `og:image`) y un `README.md` completo.

## Features que va a utilizar

- `src/layouts/Base.astro` (`Base`): ya arma `canonical` y `og:image` solo si `Astro.site` está definido. Pasan a funcionar apenas haya dominio.
- `src/lib/site.ts` (`whatsapp`, `nav`): el número de WhatsApp se usa en el `contactPoint` del JSON-LD.
- `src/lib/contact.ts` (`formatWhatsappNumber`): da el teléfono en formato legible para el JSON-LD.
- `public/brand/enginex-app-icon-512.png`: el logo cuadrado del JSON-LD (`logo`).
- `src/pages/api/contact.ts`: la única ruta server. Se excluye del sitemap y se bloquea en `robots.txt`.

## Features que va a modificar

- `astro.config.mjs`: `site` pasa a leerse de `site.config.mjs`. Afecta todo lo que usa `Astro.site`, que hoy es solo `Base.astro`.
- `src/layouts/Base.astro`: suma `og:url`, el JSON-LD y `<link rel="sitemap">`. Si no hay dominio, sigue igual que hoy (sin URLs absolutas).
- `.env.example` y `AGENTS.md`: documentan `SITE_URL` y dónde se cambia el dominio.
- `tests/e2e/landing.spec.ts` y `playwright.config.ts`: el build de los e2e corre con un dominio de prueba.
- `README.md`: hoy solo tiene el título `# landing-page`; se reescribe completo.

## Fuera de alcance

- Comprar o apuntar el dominio, DNS, deploy, Google Search Console y Bing Webmaster (son del compañero o del deploy).
- Imagen OG dedicada de 1200×630: decidido dejarla para más adelante. Por ahora `og:image` es el ícono de 512 px.
- Blog, páginas por servicio, i18n/hreflang y cualquier página nueva.
- Analytics.

## Enfoque

### Dominio en un solo lugar

- Archivo nuevo **`site.config.mjs`** en la raíz, con un comentario bien visible arriba:
  ```js
  // Dominio público del sitio, con https y sin barra final. Ej.: "https://enginex.com.ar"
  export const SITE_URL = process.env.SITE_URL || "";
  ```
  Se completa el valor por defecto en ese archivo, o se pasa `SITE_URL` como variable de entorno en el build. La variable tiene prioridad.
- `astro.config.mjs` importa `SITE_URL`, lo valida (`https://`, sin path ni barra final) y lo pasa a `site`. Con un valor mal formado, el build falla con un mensaje claro.
- **Sin dominio** el sitio sigue compilando para desarrollo y preview. Ese build muestra un aviso visible ("Falta SITE_URL…"), `robots.txt` no publica la línea `Sitemap:` y `sitemap.xml` no se genera, porque un sitemap con URLs relativas o de un dominio inventado es peor que no tenerlo. No uso un dominio de ejemplo como default: si se publicara así, Google indexaría URLs falsas.

### `robots.txt` (`src/pages/robots.txt.ts`, prerenderizado)

```
User-agent: *
Allow: /
Disallow: /api/

Sitemap: https://<dominio>/sitemap.xml
```

Se genera desde `Astro.site`, así que el `Sitemap:` usa siempre el dominio configurado. Para GEO, los crawlers de búsqueda con IA (`OAI-SearchBot`, `ChatGPT-User`, `PerplexityBot`, `Claude-SearchBot`, `Claude-User`) quedan permitidos explícitamente. Los crawlers de **entrenamiento** (`GPTBot`, `ClaudeBot`, `Google-Extended`, `CCBot`) también quedan permitidos (decidido por el usuario), siempre con `/api/` bloqueado.

### `sitemap.xml` (`src/routes/sitemap.xml.ts`, prerenderizado)

Vive en `src/routes/` (no en `src/pages/`) porque `astro.config.mjs` lo registra con `injectRoute` solo cuando hay dominio. Endpoint propio en lugar de `@astrojs/sitemap`, porque esa integración genera `sitemap-index.xml` + `sitemap-0.xml` y pediste `sitemap.xml`. Con una sola página no hace falta índice. Incluye `/` con `<lastmod>` de la fecha del build. Si mañana hay más páginas, se migra a la integración.

### Metadata y datos estructurados (SEO + GEO)

- `Base.astro`: `canonical`, `og:url` y `og:image` absolutos con el dominio, más `<link rel="sitemap" href="/sitemap.xml">`.
- **JSON-LD** con `@graph`:
  - `Organization` / `ProfessionalService`: `name: "engineX"`, `url`, `logo` (app icon 512), `description`, `areaServed: "AR"`, `knowsAbout` (gestión, facturación electrónica ARCA, reservas online, pagos, webs, integraciones), y `contactPoint` con el WhatsApp (`telephone` en formato internacional, `contactType: "sales"`, `availableLanguage: "es"`).
  - `WebSite`: `name`, `url`, `inLanguage: "es-AR"`.
  - Sin `sameAs` (no hay redes cargadas), sin dirección física y sin reseñas ni valoraciones: no se inventan datos.
  - Sale de un solo módulo, `src/lib/structured-data.ts`, testeable.
- **`llms.txt`** (`src/pages/llms.txt.ts`, prerenderizado): resumen en Markdown de qué es engineX, sus servicios, el proyecto Reservo y cómo contactarla, con URLs absolutas. Es una convención emergente, no un estándar: no la leen todos los motores y cuesta poco tenerla.
### README.md

Pensado para alguien que llega al repo por primera vez (el compañero que configura el dominio):

1. **Qué es**: la landing de engineX, qué secciones tiene y el stack (Astro 7 + adapter Node, Tailwind 4, Motion), en dos párrafos.
2. **Requisitos**: Node 22.12 o superior y Google Chrome para los e2e.
3. **Correrla**: `npm install`, `cp .env.example .env`, `npm run dev`; build y servidor de producción (`npm run build`, `npm run preview`) con `HOST` y `PORT`.
4. **Configurar el dominio**: paso a paso con `site.config.mjs` o `SITE_URL`, qué cambia cuando se configura (sitemap, canonical, `og:*`, JSON-LD) y cómo comprobarlo (`/robots.txt` y `/sitemap.xml`).
5. **Variables de entorno**: tabla con `SITE_URL`, `WHATSAPP_NUMBER`, `CONTACTS_DIR`, `HOST` y `PORT`, y cuáles se usan en build y cuáles en runtime.
6. **Tests**: `npm run lint`, `npm test` (qué cubren los unitarios), `npm run test:e2e` (qué cubren, que corren contra el build de producción y que usan el Chrome instalado) y el orden para validar antes de un PR.
7. **Cómo está pensada**: el sistema de diseño como fuente (`docs/` y el artifact), tema Carbón, un solo momento animado (el hero), "mostrar, no prometer", el formulario que guarda el mensaje y deriva a WhatsApp, y por qué el sitio es estático con una sola ruta server.
8. **Estructura**: árbol comentado de `src/` (`components`, `content`, `layouts`, `lib`, `pages`, `styles`), `public/`, `tests/`, `docs/` y `plans/`.
9. **Contenido**: cómo agregar un proyecto (`src/content/projects/*.md`, campos y `draft`) y dónde se edita el copy de cada sección.
10. **Deploy**: requisitos (servidor Node con disco persistente para `data/contacts/`; en serverless se pierden los mensajes) sin elegir proveedor.

`AGENTS.md` sigue siendo la guía corta para agentes y apunta al README para el detalle.

- El contenido ya ayuda a GEO: un solo `h1`, secciones con `h2`, servicios descritos en una frase concreta cada uno y el proceso como lista ordenada. No se toca el copy.

### Ajustes surgidos al construir

- **Carga del `.env`**: Astro no lo pone en `process.env` al leer la config, así que el `cp .env.example .env` del README no tenía efecto. `astro.config.mjs` lo carga en `dev` y `build`, y `npm run preview` usa `node --env-file-if-exists=.env`. Lo que ya está en el entorno tiene prioridad.
- **Copy compartido**: para que `llms.txt` no duplique textos, el copy de servicios, proceso y hero pasó a `src/lib/content.ts`. El texto no cambió; `Services.astro`, `Process.astro` y `Hero.astro` lo importan.

## Archivos afectados

- Nuevos: `site.config.mjs`, `src/pages/robots.txt.ts`, `src/routes/sitemap.xml.ts`, `src/pages/llms.txt.ts`, `src/lib/seo.ts`, `src/lib/structured-data.ts`, `src/lib/content.ts`, `tests/unit/seo.test.ts`
- Modificados: `astro.config.mjs`, `package.json` (script `preview`), `src/layouts/Base.astro`, `src/components/Services.astro`, `src/components/Process.astro`, `src/components/Hero.astro`, `.env.example`, `AGENTS.md`, `README.md`, `playwright.config.ts`, `tests/e2e/landing.spec.ts`

## Riesgos y supuestos

- **Dominio**: no lo invento. Hasta que se configure no hay sitemap ni URLs absolutas, y el build lo avisa.
- **Área de servicio**: asumo Argentina (`AR`) porque el número es argentino. Sin dirección física en el JSON-LD.
- **`og:image`**: por ahora es el ícono cuadrado de 512 px; en WhatsApp y LinkedIn se ve como miniatura chica, no como tarjeta grande.
- **`llms.txt`**: su efecto en GEO es incierto; se incluye porque no tiene costo de mantenimiento.

## Verificación

- `npm run lint`, `npm test`, `npm run build` y `npm run test:e2e` en verde.
- **Vitest** (`tests/unit/seo.test.ts`): validación de `SITE_URL` (acepta `https://enginex.com.ar`, rechaza sin `https`, con path o con barra final); `robots.txt` con y sin dominio (con dominio incluye `Sitemap:` absoluto y bloquea `/api/`, sin dominio no tiene `Sitemap:`); `sitemap.xml` es XML válido con `<loc>` absoluto y sin `/api`; el JSON-LD tiene `name: "engineX"`, la URL del dominio y el teléfono de WhatsApp, sin campos inventados.
- **Playwright**, con el build hecho con `SITE_URL=https://enginex.test`: `/robots.txt` y `/sitemap.xml` responden 200 con el tipo de contenido correcto; la home tiene `canonical`, `og:url` y `og:image` absolutos con ese dominio; el `<script type="application/ld+json">` se puede parsear; `/llms.txt` responde 200.
- **Build sin `SITE_URL`**: compila, muestra el aviso y no genera `sitemap.xml`.
- **README**: seguir sus pasos desde un clon limpio (`npm ci`, dev, build, preview, tests) y comprobar que cada comando funciona tal cual está escrito.

## Preguntas abiertas

Ninguna. Resueltas: el push ya funciona; la imagen OG de 1200×630 queda para más adelante; los crawlers de IA, de búsqueda y de entrenamiento, quedan permitidos.
