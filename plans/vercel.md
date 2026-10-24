# Plan: Adaptar la landing de engineX a Vercel

Estado: aprobado

## Objetivo

Que la landing se pueda deployar en Vercel importando el repo, con el formulario de contacto funcionando y sin perder mensajes: hoy el proyecto usa el adapter de Node y guarda los mensajes en disco, y ninguna de las dos cosas funciona en Vercel.

## Feature a implementar

`feature/vercel`: adapter `@astrojs/vercel` para el deploy en Vercel (manteniendo Node para desarrollo, preview local y e2e), mensajes del formulario guardados en Upstash Redis en lugar del disco, y límite de envíos por IP.

## Features que va a utilizar

- `astro.config.mjs` (`sitemapWhenSite`, carga del `.env`, `resolveSiteUrl` de `site.config.mjs`): se mantienen igual. Solo cambia la elección del adapter.
- `src/lib/contact-server.ts`:
  - `handleContact`, `readBodyWithLimit` y `contactConfigFromEnv` se mantienen.
  - `saveContact` pasa a ser una de las implementaciones de almacenamiento.
- `src/lib/contact.ts` (`validateContact`, `buildWhatsappUrl`, `buildWhatsappText`): sin cambios.
- `src/pages/api/contact.ts` (`POST`, `prerender = false`): sigue siendo la única ruta server. En Vercel pasa a ser una función serverless.
- `src/components/ContactForm.astro`: sin cambios. Ya maneja la respuesta 500 con el link directo a WhatsApp.

## Features que va a modificar

- `astro.config.mjs`: el adapter se elige según dónde corre el build.
  - En Vercel, que define `VERCEL=1`, usa `@astrojs/vercel`.
  - En el resto de los casos usa `@astrojs/node` (dev, `npm run preview`, e2e, un servidor propio).
  - Afecta el build de producción; lo local queda igual.
- `src/lib/contact-server.ts`: `handleContact` recibe un **almacenamiento** (`ContactStore`) en lugar de escribir directo en disco. Afecta `src/pages/api/contact.ts` y los tests de `tests/unit/contact.test.ts`.
- `.env.example`, `README.md` (sección Deploy y variables) y `AGENTS.md`.

## Fuera de alcance

- Crear la cuenta o la base en el servicio de almacenamiento, configurar el dominio en Vercel y hacer el deploy: lo hace el equipo desde el panel de Vercel, con los pasos del README.
- Panel para leer los mensajes: se leen desde la consola del servicio.
- Notificación por email de cada mensaje nuevo (ver Preguntas si se elige email).
- Imagen OG de 1200×630.

## Enfoque

### Adapter según el entorno

```js
adapter: process.env.VERCEL ? vercel() : node({ mode: "standalone", bodySizeLimit: 64 * 1024 }),
```

- Vercel define `VERCEL=1` en sus builds, así que importar el repo con el preset **Astro** alcanza: no hace falta configurar nada para elegir el adapter.
- Localmente todo sigue igual: `npm run dev`, `npm run preview` con Node y los e2e contra el build de Node. No hay que mantener dos flujos de trabajo.
- El sitio sigue siendo estático con una sola ruta server: en Vercel, `robots.txt`, `sitemap.xml`, `llms.txt` y la home se sirven como archivos estáticos desde su CDN, y `/api/contact` corre como función.
- El límite de body de 64 KB del adapter Node no existe en Vercel, pero `readBodyWithLimit` ya corta en 10 KB dentro del handler (y Vercel limita los requests a 4,5 MB).
- Alternativa descartada: usar solo `@astrojs/vercel`. Obliga a correr los e2e con `vercel dev` o contra `astro dev` y deja de servir para un servidor propio.

### Dónde se guardan los mensajes (`ContactStore`)

Interfaz chica con una sola operación, `save(message)`, y dos implementaciones:

- **`FileContactStore`**: el comportamiento actual, un `.json` por mensaje en `CONTACTS_DIR`. Se usa en desarrollo, en los tests y con un servidor Node propio.
- **`RedisContactStore`** para Vercel: **Upstash Redis** (decidido).
  - Cada mensaje se agrega con `LPUSH` a la lista `contacts`, como JSON con `receivedAt`.
  - Se consulta desde la consola de Upstash (o con `LRANGE contacts 0 -1`).
  - Se conecta desde el Marketplace de Vercel (Storage → Upstash for Redis) y el plan gratuito alcanza de sobra.
  - La integración carga sola las variables `KV_REST_API_URL` y `KV_REST_API_TOKEN`; también acepto `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN`, por si se conecta a mano.
  - Cliente: `@upstash/redis`, por HTTP, sin conexiones abiertas (apto para serverless).
- **Elección automática** (`contactStoreFromEnv`): si hay credenciales de Redis usa Redis; si no, archivos.
- **En Vercel sin almacenamiento configurado no se guarda en disco.** El disco se borra y el mensaje se perdería sin que nadie se entere. En ese caso:
  - el endpoint responde 500 y loguea el error;
  - el formulario muestra el aviso que ya existe ("No pudimos guardar tu mensaje. Escribinos directo por WhatsApp", con el link);
  - el build avisa en el log, como hoy con `SITE_URL`.
  - Así el problema se ve y la persona igual puede contactar.

Alternativas descartadas:
- **Vercel Blob**: los archivos quedan accesibles por URL pública, y son datos personales.
- **Email** (Resend u otro): necesita verificar un dominio de envío, que todavía no existe.
- **No guardar**: el link de WhatsApp lleva el mensaje armado, pero si la persona no lo envía, se pierde la consulta.

### Límite de envíos por IP (decidido: se incluye)

Cierra el pendiente de la revisión anterior (sin límite de envíos), con `@upstash/ratelimit` sobre el mismo Redis:
- 5 mensajes por IP cada 10 minutos (IP tomada de `x-forwarded-for`, que Vercel completa).
- Al pasarse, responde 429 con "Mandaste varios mensajes seguidos. Esperá unos minutos o escribinos por WhatsApp.".
- Sin Redis (desarrollo y servidor propio) no hay límite.

### Variables de entorno en Vercel

| Variable | Valor |
| --- | --- |
| `SITE_URL` | Dominio con `https://` y sin barra final; mientras tanto, la URL `*.vercel.app` del proyecto |
| `WHATSAPP_NUMBER` | `5493548545460` |
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` | Las carga sola la integración de Upstash |

### Configuración del proyecto en Vercel (va al README)

- Root Directory `./` (no `src`).
- Application Preset **Astro**. Build Command y Output los detecta solos.
- Node 22.x o superior.
- Conectar Upstash for Redis desde Storage y cargar las variables.
- Hacer el deploy después de mergear a `main`.

## Archivos afectados

- **Nuevos**:
  - `src/lib/contact-store.ts`: `ContactStore`, `FileContactStore`, `RedisContactStore`, `contactStoreFromEnv`.
  - `tests/unit/contact-store.test.ts`.
- **Modificados**: `astro.config.mjs`, `package.json` y `package-lock.json` (`@astrojs/vercel`, `@upstash/redis`, `@upstash/ratelimit`), `src/lib/contact-server.ts`, `src/pages/api/contact.ts`, `tests/unit/contact.test.ts`, `.env.example`, `README.md`, `AGENTS.md`, `.gitignore` (agrega `.vercel/`).

## Riesgos y supuestos

- **`VERCEL=1` en el build**: Vercel lo documenta como variable de sistema disponible en el build. Si no estuviera, el build usaría el adapter de Node y el deploy fallaría de forma visible. Lo verifico con un build local con `VERCEL=1` (genera `.vercel/output/`).
- **`process.env` en la función**: las variables de Vercel llegan a `process.env` en runtime en funciones Node. El endpoint ya las lee así.
- **Sin cuenta de Upstash para probar**: los tests de `RedisContactStore` usan un cliente simulado. La prueba contra Redis real queda para el primer deploy, con un envío de prueba.
- **Base de la rama**: el PR #2 ya está mergeado; la rama sale de `main` y el PR va contra `main`.

## Verificación

- `npm run lint`, `npm test`, `npm run build` y `npm run test:e2e` en verde. Los e2e siguen corriendo contra el build de Node con almacenamiento en archivos, así que el flujo completo del formulario queda cubierto.
- **Vitest**:
  - `contactStoreFromEnv` elige Redis con cualquiera de los dos pares de variables, archivos sin ellas, y falla con `VERCEL=1` y sin credenciales.
  - `RedisContactStore.save` hace `LPUSH` a `contacts` con el JSON esperado (cliente simulado).
  - `handleContact` con un store que falla responde 500 y no pierde la URL de WhatsApp en el mensaje de error.
  - Límite: el sexto envío desde la misma IP responde 429 sin guardar, y sin Redis no hay límite.
- **Build con `VERCEL=1`**: compila, genera `.vercel/output/` con `/api/contact` como función y `robots.txt`, `sitemap.xml`, `llms.txt` e `index.html` como estáticos.
- **Build sin `VERCEL`**: igual que hoy (`dist/server/entry.mjs`).
- **Tras el deploy** (lo hace el equipo, con los pasos del README): un envío de prueba aparece en la lista `contacts` de Upstash.

## Preguntas abiertas

Ninguna. Resueltas: los mensajes van a Upstash Redis; se incluye el límite de 5 envíos por IP cada 10 minutos; se mantienen los dos adapters (Vercel en sus builds, Node para todo lo local y un posible servidor propio).
