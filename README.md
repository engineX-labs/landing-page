# engineX · landing page

Landing de **Social Engine**, el producto de **engineX**: lee las métricas de tu Instagram y tu Facebook y te dice qué publicaciones funcionan y qué repetir. Es la única página del sitio (`/`).

Es una sola página con hero, redes, módulos, cómo funciona, beneficios, prueba gratuita de 7 días, preguntas frecuentes y lista de espera, más Fidel, el asistente de IA. Tiene **modo claro y oscuro**. Está hecha con **Astro 7** (todo prerenderizado salvo los endpoints de la lista de espera y de Fidel; se deploya en **Vercel** y localmente corre con Node), **Tailwind CSS 4** sobre los tokens del sistema de diseño y un script chico sin librerías.

## Requisitos

- **Node 22.12 o superior** (`node -v`).
- **Google Chrome** instalado, solo para los tests e2e: Playwright usa el Chrome del sistema en lugar de descargar navegadores.

## Correrla

```bash
npm install
cp .env.example .env
npm run dev
```

Queda en <http://localhost:4321>.

Para probar el build de producción:

```bash
npm run build
npm run preview
```

`npm run preview` levanta el servidor Node del build (`dist/server/entry.mjs`) con las variables de `.env`. Por defecto escucha en `localhost:4321`; se cambia con `HOST` y `PORT`, por ejemplo `HOST=0.0.0.0 PORT=8080 npm run preview`.

## Configurar el dominio

El dominio se configura en **un solo lugar**: [`site.config.mjs`](site.config.mjs).

1. Abrí `site.config.mjs` y completá `DEFAULT_SITE_URL` con el dominio público, con `https://` y **sin barra final**:

   ```js
   export const DEFAULT_SITE_URL = "https://enginex.com.ar";
   ```

   Alternativa: dejarlo vacío y pasar `SITE_URL` en el build (en `.env` o en el entorno del deploy). La variable tiene prioridad sobre el archivo.

2. Volvé a compilar con `npm run build`. Si el valor está mal formado (sin `https`, con barra final, con ruta o con puerto), el build falla y dice qué corregir.

3. Comprobá el resultado con `npm run preview`:
   - <http://localhost:4321/sitemap.xml> lista `https://<tu-dominio>/`.
   - <http://localhost:4321/robots.txt> termina con `Sitemap: https://<tu-dominio>/sitemap.xml`.
   - El HTML de la página tiene `canonical`, `og:url` y `og:image` con el dominio.

**Qué cambia con el dominio:** se genera `/sitemap.xml`, `robots.txt` publica la línea `Sitemap:`, y el canonical, `og:url`, `og:image`, el JSON-LD y los links de `/llms.txt` pasan a URLs absolutas.

**Sin dominio** el sitio compila igual, para desarrollo, pero el build avisa `Falta SITE_URL` y no genera `sitemap.xml`. No hay un dominio de ejemplo por defecto a propósito: si se publicara, los buscadores indexarían URLs falsas.

## Variables de entorno

Todas están en [`.env.example`](.env.example).

| Variable | Cuándo se usa | Para qué | Por defecto |
| --- | --- | --- | --- |
| `SITE_URL` | Build | Dominio público (ver arriba). | vacío, o `DEFAULT_SITE_URL` |
| `WHATSAPP_NUMBER` | Build | Número de engineX sin `+` ni espacios. Arma los links de WhatsApp de la página y de Fidel. | `5493548545450` |
| `GEMINI_API_KEY` | Runtime (solo servidor) | Key de Gemini para Fidel, el asistente de IA. Sin ella el widget no aparece. En Vercel además hace falta Redis: sin Redis el asistente se apaga. | — |
| `GEMINI_MODEL` | Runtime | Modelo de Gemini que usa Fidel. | `gemini-2.5-flash-lite` |
| `ASSISTANT_DAILY_LIMIT` | Runtime | Tope de mensajes por día en total (contador en Redis; en memoria si no hay Redis fuera de Vercel). Es el techo del gasto. | `300` |
| `GEMINI_API_BASE` | Runtime | URL base de la API de Gemini. Solo `https` (o `http` hacia localhost, para tests); si no, se ignora. | `https://generativelanguage.googleapis.com/v1beta` |
| `GEMINI_TIMEOUT_MS` | Runtime | Espera máxima de la respuesta de Gemini, en ms (1000 a 60000). | `15000` |
| `GEMINI_TEMPERATURE` | Runtime | Temperatura de las respuestas (0 a 2). | `0.4` |
| `ASSISTANT_MAX_OUTPUT_TOKENS` | Runtime | Tope de tokens de cada respuesta de Fidel (50 a 2000). Afecta el gasto. | `400` |
| `ASSISTANT_RATE_LIMIT_MESSAGES` | Runtime | Mensajes por IP en la ventana (1 a 1000). Solo se aplica en Vercel con Redis. | `12` |
| `ASSISTANT_RATE_LIMIT_WINDOW` | Runtime | Ventana del límite por IP: número y unidad (`ms`, `s`, `m`, `h`, `d`). | `10 m` |
| `WAITLIST_DIR` | Runtime | Carpeta donde se guarda un `.json` por email de la lista de espera cuando no hay Redis (con Redis van a la lista `waitlist`). Necesita disco persistente. | `data/waitlist` |
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` | Runtime (y aviso en build) | Upstash Redis: guarda los emails de la lista de espera y, en Vercel, limita los envíos a 5 por IP cada 10 minutos. En Vercel los carga la integración. También se aceptan `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN`. | vacío |
| `VERCEL` | Build y runtime | La define Vercel. Elige el adapter de Vercel y evita guardar en disco. No se configura a mano. | vacío |
| `HOST`, `PORT` | Runtime | Dónde escucha el servidor Node. | `localhost`, `4321` |

En `dev` y `build` el `.env` se carga desde `astro.config.mjs`; `npm run preview` lo pasa con `--env-file-if-exists`. Lo que ya está definido en el entorno tiene prioridad sobre el `.env`.

## Tests y verificación

```bash
npm run lint
npm test
npm run build
npm run test:e2e
```

Ese es el orden para validar antes de abrir un PR; los cuatro tienen que pasar.

- **`npm run lint`**: Biome, lint y formato sin escribir. `npm run format` aplica los arreglos.
- **`npm test`**: Vitest, en `tests/unit/`.
  - `contact.test.ts`: número de WhatsApp (normalización, formato y links).
  - `contact-store.test.ts`: guardado en archivos y en Redis (con un Redis simulado) e IP del cliente.
  - `waitlist.test.ts`: validación, endpoint, elección del almacenamiento y límite de envíos por IP (solo en Vercel).
  - `seo.test.ts`: validación de `SITE_URL`, `robots.txt` con y sin dominio, `sitemap.xml`, JSON-LD sin datos inventados y `llms.txt`.
  - `theme.test.ts`: elección del tema y el script del `<head>`, corrido de verdad con un documento falso.
- **`npm run build`**: chequeo de tipos (`astro check`) y build.
- **`npm run test:e2e`**: Playwright en `tests/e2e/`. Compila y levanta el **build de producción** con un dominio y un número de prueba (ver `playwright.config.ts`) y comprueba:
  - La lista de espera (guarda el email con su origen, errores junto al campo, honeypot).
  - Los dos temas: arranca con el del dispositivo, el botón alterna y recuerda la elección, sin parpadeo, y el texto con degradé pasa 4,5:1 en claro y en oscuro.
  - El logo: en claro, flecha y "Social" con degradé.
  - Un solo `h1` y un solo botón primario; el foco visible con teclado.
  - El movimiento reducido y la página sin JavaScript.
  - Móvil sin scroll horizontal.
  - `robots.txt`, `sitemap.xml`, `llms.txt`, las URLs absolutas y el JSON-LD.
  - Que `/social-engine`, la demo y `/api/contact` ya no existan.
  - Fidel (con el endpoint simulado).

## Cómo está pensada

- **El sistema de diseño manda.** Todo sale de "engineX — Sistema de diseño, versión 2": el PDF está en [`docs/`](docs/engineX-sistema-de-diseno.pdf) y su fuente viva es el artifact del sistema. Los tokens, los logos oficiales, las fuentes y los componentes (`Logo`, `Button`, `Arrow`) están portados de ahí con los mismos valores y props.
- **Dos temas.** Oscuro es Carbón (los tokens de `tokens.css`) y claro es Papel (`html[data-theme="light"]` en `social-engine.css`). Un script inline en el `<head>` (`src/lib/theme.ts`) fija el tema antes de pintar, según lo guardado en `localStorage` o, si no hay elección, el del dispositivo; el botón de la barra lo alterna. Sin JavaScript queda oscuro y el botón se oculta. En claro hay sombras difusas solo en `.se-card` y el degradé de texto usa paradas oscuras; en oscuro las tarjetas se separan con borde y el degradé usa paradas claras (ambos ≥ 4,5:1). El logo lleva degradé en la flecha y en "Social" solo en claro.
- **Movimiento que confirma.** Solo `transform` y `opacity`; todo se pausa fuera de pantalla y queda quieto con `prefers-reduced-motion`. Apariciones al scrollear, línea que se dibuja con el scroll, carrusel de redes y pestañas de módulos, con la estructura de la landing de Xubio. Todo es CSS más un script chico sin librerías (`src/scripts/social-engine.ts`); sin JavaScript el contenido se ve igual.
- **Alcance del MVP.** Describe solo conexión con Instagram y Facebook, informe semanal, chat con las métricas y 3 ideas de posteo por semana (no programa ni publica). En lugar de planes tiene la prueba gratuita de 7 días. Los mockups son HTML y CSS con datos ficticios. No muestra precios: los emails de la lista de espera van a `POST /api/waitlist`.
- **Fidel, el asistente de IA.** Un chat flotante (`src/components/Assistant.astro`) que llama a `POST /api/assistant`, que a su vez llama a Gemini. La key vive solo en el servidor y se verifica que no aparezca en `dist/`. El widget solo se muestra si `GET /api/assistant` dice que está habilitado (hay key y límites). Defensas, en este orden: forma y tamaño del pedido, honeypot, 12 mensajes cada 10 minutos por IP (solo en Vercel con Redis), tope global de 300 mensajes por día (Redis), 500 caracteres por mensaje, 6 turnos de historial y 400 tokens de salida. Si se agota algún límite o Gemini falla, el widget deriva a WhatsApp. El límite de gasto en Google se configura aparte, en la cuenta. Habla solo de Social Engine: ante pedidos a medida u otros temas deriva a WhatsApp. El prompt sale de `social-engine-content.ts` y `assistant-config.ts`.
- **Estática con dos rutas server.** La página es HTML liviano generado en el build. Solo `POST /api/waitlist` y `/api/assistant` corren en el servidor (en Vercel, como función): validan, limitan por IP y guardan (Upstash Redis en Vercel, archivos en local).
- **SEO y GEO.** `robots.txt` permite todo menos `/api/`, también a los crawlers de IA (búsqueda y entrenamiento). El sitemap (solo `/`), el canonical, Open Graph, el JSON-LD (`Organization`, `WebSite`, `SoftwareApplication` y `FAQPage`) y `llms.txt` salen del dominio configurado.
- **Voz.** Voseo, primera persona del plural, sentence case, sin emojis ni signos de exclamación en titulares. La marca se escribe siempre "engineX".

## Estructura

```
.
├── site.config.mjs          # ← dominio del sitio (único lugar)
├── astro.config.mjs         # Astro: adapter (Vercel o Node), Tailwind, carga del .env, sitemap
├── docs/                    # PDF del sistema de diseño
├── plans/                   # planes aprobados de cada feature
├── public/
│   ├── brand/               # los 11 logos oficiales (favicon, app icon, mono…)
│   └── fonts/               # Plus Jakarta Sans y JetBrains Mono (woff2)
├── src/
│   ├── components/
│   │   ├── Logo, Button, Arrow          # componentes del sistema (Logo con degradé opcional)
│   │   ├── Faq.astro, Assistant.astro   # preguntas frecuentes y Fidel
│   │   ├── logo-paths.ts                # paths oficiales del logo (no redibujar)
│   │   └── social-engine/               # secciones de la landing, ThemeToggle y mockups
│   ├── layouts/Base.astro   # <head>: meta, Open Graph, JSON-LD, fuentes, script de tema
│   ├── lib/
│   │   ├── social-engine-content.ts # copy de la página (también alimenta llms.txt y JSON-LD)
│   │   ├── social-engine-ui.ts      # cálculos de UI puros
│   │   ├── theme.ts                 # tema claro/oscuro y script del <head>
│   │   ├── assistant*.ts            # Fidel: validación, prompt, límites, ajustes y servidor
│   │   ├── waitlist*.ts             # lista de espera: validación y endpoint
│   │   ├── contact.ts               # número de WhatsApp: normalización y links
│   │   ├── contact-server.ts        # lectura del request con límite, JSON y límite por IP
│   │   ├── contact-store.ts         # dónde se guardan los emails (archivos o Redis) y límite por IP
│   │   ├── seo.ts                   # robots.txt, sitemap.xml, llms.txt
│   │   ├── structured-data.ts       # JSON-LD
│   │   └── site.ts                  # número de WhatsApp
│   ├── pages/
│   │   ├── index.astro      # la landing de Social Engine
│   │   ├── api/waitlist.ts  # POST /api/waitlist
│   │   ├── api/assistant.ts # GET (¿habilitado?) y POST (chat) de Fidel
│   │   ├── robots.txt.ts
│   │   └── llms.txt.ts
│   ├── routes/sitemap.xml.ts# se registra solo si hay dominio
│   ├── scripts/social-engine.ts # interacciones: tema, apariciones, módulos, lista de espera
│   └── styles/
│       ├── tokens.css       # tokens del sistema, tema oscuro (única fuente de valores)
│       ├── global.css       # escala tipográfica y clases ex-* del sistema
│       └── social-engine*.css # tema claro, layout, movimiento y mockups de la landing
└── tests/
    ├── unit/                # Vitest
    └── e2e/                 # Playwright
```

## Editar contenido

- **Copy de la página** (título, módulos, pasos, beneficios, prueba, preguntas): `src/lib/social-engine-content.ts`, que también alimenta `/llms.txt` y el JSON-LD. Mantenerlo dentro del alcance del MVP.
- **Datos de Fidel** (horario, prueba, precio): `src/lib/assistant-config.ts`. Con el precio vacío, Fidel responde "no confirmado".
- **Colores, espaciado, radios y movimiento:** `src/styles/tokens.css` (oscuro) y `html[data-theme="light"]` en `src/styles/social-engine.css` (claro).

## Deploy en Vercel

El build elige solo el adapter: en Vercel (que define `VERCEL=1`) usa `@astrojs/vercel`; en cualquier otro lado, Node. La página, `robots.txt`, `sitemap.xml` y `llms.txt` se sirven como estáticos y `/api/waitlist` y `/api/assistant` corren como funciones.

1. **Importar el repo** en Vercel (Add New → Project → `engineX-labs/landing-page`):
   - **Root Directory**: `./` (la raíz, **no** `src`).
   - **Application Preset**: **Astro**. Build Command y Output Directory se detectan solos.
2. **Conectar Upstash Redis**: en el proyecto, Storage → Marketplace → **Upstash for Redis** → crear la base (el plan gratuito alcanza) y conectarla al proyecto. Eso carga `KV_REST_API_URL` y `KV_REST_API_TOKEN`.
3. **Variables de entorno** (Settings → Environment Variables), para Production y Preview:
   - `SITE_URL`: el dominio con `https://` y sin barra final. Mientras no haya dominio propio, la URL `https://<proyecto>.vercel.app`.
   - `WHATSAPP_NUMBER`: `5493548545450`.
4. **Deploy**. Si en el log del build aparece `Build en Vercel sin Upstash Redis`, falta el paso 2: el sitio funciona, pero la lista de espera responde que no pudo guardar el email y Fidel queda apagado.
5. **Probar**: anotar un email en la lista de espera y verlo en la consola de Upstash (Data Browser → clave `waitlist`, o `LRANGE waitlist 0 -1`). El más nuevo queda primero.
6. **Dominio propio**: agregarlo en Settings → Domains, actualizar `SITE_URL` y volver a deployar.

Los emails viven en la lista `waitlist` de Redis, uno por elemento, como JSON con `email`, `source` y `receivedAt`.

### Servidor propio (alternativa)

También corre en cualquier servidor con **Node 22.12+**: `npm run build` y `node dist/server/entry.mjs` (o `npm run preview`), con `HOST`, `PORT`, `SITE_URL` y `WHATSAPP_NUMBER`. Sin Redis guarda los emails en `WAITLIST_DIR`, que necesita **disco persistente**. Con las variables de Redis guarda en Redis, pero sin límite de envíos: fuera de Vercel la IP del cliente se puede falsificar.
