# engineX · landing page

Landing de **engineX**, agencia de software: diseñamos y desarrollamos sistemas a medida (gestión, facturación electrónica ARCA, reservas, pagos, webs) para negocios que quieren crecer.

Es una sola página con hero, servicios, proyectos, cómo trabajamos y un formulario de contacto que guarda el mensaje y deriva la conversación a WhatsApp. Está hecha con **Astro 7** (todo prerenderizado salvo el endpoint del formulario; se deploya en **Vercel** y localmente corre con Node), **Tailwind CSS 4** sobre los tokens del sistema de diseño y **Motion** para la única animación de entrada, la del hero.

## Requisitos

- **Node 22.12 o superior** (`node -v`).
- **Google Chrome** instalado, solo para los tests e2e: Playwright usa el Chrome del sistema en lugar de descargar navegadores.

## Correrla

```bash
npm install
cp .env.example .env
npm run dev
```

Queda en <http://localhost:4321>. En desarrollo también se ven los proyectos marcados como borrador (`draft: true`).

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
   - El HTML de la home tiene `canonical`, `og:url` y `og:image` con el dominio.

**Qué cambia con el dominio:** se genera `/sitemap.xml`, `robots.txt` publica la línea `Sitemap:`, y el canonical, `og:url`, `og:image`, el JSON-LD y los links de `/llms.txt` pasan a URLs absolutas.

**Sin dominio** el sitio compila igual, para desarrollo, pero el build avisa `Falta SITE_URL` y no genera `sitemap.xml`. No hay un dominio de ejemplo por defecto a propósito: si se publicara, los buscadores indexarían URLs falsas.

## Variables de entorno

Todas están en [`.env.example`](.env.example).

| Variable | Cuándo se usa | Para qué | Por defecto |
| --- | --- | --- | --- |
| `SITE_URL` | Build | Dominio público (ver arriba). | vacío, o `DEFAULT_SITE_URL` |
| `WHATSAPP_NUMBER` | Build **y** runtime | Número de engineX sin `+` ni espacios. En el build arma los links de la página; en runtime, la URL que devuelve `/api/contact`. Tiene que ser el mismo en los dos. | `5493548545460` |
| `CONTACTS_DIR` | Runtime | Carpeta donde se guarda un `.json` por mensaje cuando no hay Redis. | `data/contacts` |
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` | Runtime (y aviso en build) | Upstash Redis: guarda los mensajes y, en Vercel, limita los envíos a 5 por IP cada 10 minutos. En Vercel los carga la integración. También se aceptan `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN`. | vacío |
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
  - `contact.test.ts`: validación del formulario (mensajes de error en voseo), honeypot, límite de tamaño (también sin `Content-Length`), guardado del `.json`, errores al guardar y codificación de la URL de WhatsApp.
  - `contact-store.test.ts`: guardado en archivos y en Redis (con un Redis simulado), elección del almacenamiento según el entorno y el límite de envíos por IP (solo en Vercel).
  - `seo.test.ts`: validación de `SITE_URL`, `robots.txt` con y sin dominio, `sitemap.xml`, JSON-LD sin datos inventados y `llms.txt`.
- **`npm run build`**: chequeo de tipos (`astro check`) y build.
- **`npm run test:e2e`**: Playwright en `tests/e2e/`. Compila y levanta el **build de producción** con un dominio y un número de prueba (ver `playwright.config.ts`) y comprueba:
  - El envío completo del formulario (guarda el mensaje y arma el link de WhatsApp).
  - Los errores conectados por `aria-describedby`.
  - El foco visible con teclado.
  - Un solo `display-xl` y un solo botón primario en el hero.
  - Que no salgan los borradores.
  - El movimiento reducido.
  - Móvil sin scroll horizontal y con el menú funcionando.
  - `robots.txt`, `sitemap.xml`, `llms.txt`, las URLs absolutas y el JSON-LD.

## Cómo está pensada

- **El sistema de diseño manda.** Todo sale de "engineX — Sistema de diseño, versión 2": el PDF está en [`docs/`](docs/engineX-sistema-de-diseno.pdf) y su fuente viva es el artifact del sistema. Los tokens, los logos oficiales, las fuentes y los componentes (`Logo`, `Button`, `Tag`, `ProjectCard`, `TextField`) están portados de ahí con los mismos valores y props.
- **Oscuro, preciso, con una chispa.** Solo tema Carbón (el claro es para documentos). El naranja `ignite` aparece únicamente donde está la acción: botón primario, flecha, foco y hover de las tarjetas.
- **Mostrar, no prometer.** El portfolio muestra proyectos reales con su resultado. Reservo linkea a su sitio. Freggiaro abre una demo interactiva en un modal.
- **Demos que no pesan.** La demo de Freggiaro es una página propia (`/demo/freggiaro`, `noindex`, fuera del sitemap). La home la muestra en un `<dialog>` con un `<iframe>` que se carga recién al abrirlo, así que la landing no paga su peso. Replica la interfaz real del sistema (sus colores y su tipografía, acotados a la demo) con datos ficticios y facturación simulada: no hay backend ni conexión con ARCA. `/#demo-freggiaro` abre el modal y `/demo/freggiaro` sirve como link para compartir.
- **Movimiento que confirma.** Solo `transform` y `opacity`, nada de UI por encima de 300 ms y nunca `ease-in`. Hay un único momento de entrada (el hero); `prefers-reduced-motion` quita escalas y desplazamientos.
- **Voz.** Voseo, primera persona del plural, sentence case, sin emojis ni signos de exclamación en titulares. La marca se escribe siempre "engineX".
- **Estática con una sola ruta server.** La página es HTML liviano generado en el build. Solo `POST /api/contact` corre en el servidor (en Vercel, como función): valida, limita los envíos por IP, guarda el mensaje (Upstash Redis en Vercel, archivos en local) y devuelve la URL de WhatsApp con el texto ya escrito. El usuario la abre desde un link en el estado de éxito, porque abrirla sola después del envío la bloquean Safari y otros navegadores.
- **SEO y GEO.** `robots.txt` permite todo menos `/api/`, también a los crawlers de IA (búsqueda y entrenamiento). El sitemap, el canonical, Open Graph, el JSON-LD (`Organization` + `WebSite`) y `llms.txt` salen del dominio configurado.

## Estructura

```
.
├── site.config.mjs          # ← dominio del sitio (único lugar)
├── astro.config.mjs         # Astro: adapter (Vercel o Node), Tailwind, carga del .env, sitemap
├── docs/                    # PDF del sistema de diseño
├── plans/                   # planes aprobados de cada feature
├── public/
│   ├── brand/               # los 11 logos oficiales (favicon, app icon, mono…)
│   ├── clientes/            # logos PNG transparentes de la barra "Confían en nosotros"
│   └── fonts/               # Plus Jakarta Sans y JetBrains Mono (woff2)
├── src/
│   ├── assets/projects/     # capturas de proyectos (se optimizan a WebP en el build)
│   ├── assets/freggiaro/    # emblema de Freggiaro para la demo
│   ├── components/
│   │   ├── Logo, Button, Tag, ProjectCard, TextField, Arrow   # componentes del sistema
│   │   ├── Header, Hero, Services, Projects, Process, ContactForm, Footer  # secciones
│   │   ├── DemoDialog.astro # modal que abre una demo en un iframe
│   │   ├── FreggiaroDemo.astro # la demo de Freggiaro (réplica de su interfaz)
│   │   └── logo-paths.ts    # paths oficiales del logo (no redibujar)
│   ├── content/projects/    # un .md por proyecto del portfolio
│   ├── content.config.ts    # esquema de la colección de proyectos
│   ├── layouts/Base.astro   # <head>: meta, Open Graph, JSON-LD, fuentes
│   ├── lib/
│   │   ├── content.ts       # copy de servicios y del proceso (página y llms.txt)
│   │   ├── contact.ts       # validación y URL de WhatsApp (cliente y servidor)
│   │   ├── contact-server.ts# lectura del request, límite y respuesta
│   │   ├── contact-store.ts # dónde se guardan los mensajes (archivos o Redis) y límite por IP
│   │   ├── freggiaro-demo.ts# datos ficticios y reglas de la demo de Freggiaro
│   │   ├── seo.ts           # robots.txt, sitemap.xml, llms.txt
│   │   ├── structured-data.ts # JSON-LD
│   │   └── site.ts          # número de WhatsApp y navegación
│   ├── pages/
│   │   ├── index.astro      # la landing
│   │   ├── demo/freggiaro.astro # la demo sola; con ?embed, sin barra (para el modal)
│   │   ├── api/contact.ts   # POST /api/contact (única ruta server)
│   │   ├── robots.txt.ts
│   │   └── llms.txt.ts
│   ├── routes/sitemap.xml.ts# se registra solo si hay dominio
│   └── styles/
│       ├── tokens.css       # tokens del sistema (única fuente de valores)
│       └── global.css       # escala tipográfica y clases ex-* del sistema
└── tests/
    ├── unit/                # Vitest
    └── e2e/                 # Playwright
```

## Editar contenido

- **Agregar un proyecto:** creá `src/content/projects/<slug>.md` con este frontmatter:

  ```yaml
  ---
  title: Reservo, gestión de reservas para alojamientos   # obligatorio
  client: "Alojamientos turísticos: cabañas, departamentos y suites"
  summary: Manejan todas sus reservas desde cualquier dispositivo.  # resultado para el cliente, no la tecnología
  tags: [React, FastAPI, Python]       # hasta 5, con la grafía oficial
  image: ../../assets/projects/<captura>.png   # opcional, 16:10; sin imagen se muestra el isotipo
  imageAlt: Descripción de la captura
  href: https://...                    # opcional: la tarjeta entera linkea ahí
  demo: /demo/<slug>                   # opcional, en lugar de href: la tarjeta abre esa página en el modal
  cta: Ver el proyecto
  order: 2                             # orden en la grilla
  draft: false                         # true: solo se ve en desarrollo
  ---
  ```

- **Agregar un cliente a la barra:** copiá su logo (PNG transparente) a `public/clientes/` y sumá una entrada a `clients` en `src/lib/content.ts` con `name`, `logo`, `width` y `height`. Se pinta en un solo tono del tema.
- **Copy de servicios y del proceso:** `src/lib/content.ts`, que también alimenta `/llms.txt`.
- **Resto del copy:** en cada sección de `src/components/`. Header y footer toman la navegación de `src/lib/site.ts`.
- **Colores, espaciado, radios y movimiento:** solo en `src/styles/tokens.css`, con los valores del sistema de diseño.

## Deploy en Vercel

El build elige solo el adapter: en Vercel (que define `VERCEL=1`) usa `@astrojs/vercel`; en cualquier otro lado, Node. La página, `robots.txt`, `sitemap.xml` y `llms.txt` se sirven como estáticos y `/api/contact` corre como función.

1. **Importar el repo** en Vercel (Add New → Project → `engineX-labs/landing-page`):
   - **Root Directory**: `./` (la raíz, **no** `src`).
   - **Application Preset**: **Astro**. Build Command y Output Directory se detectan solos.
2. **Conectar Upstash Redis**: en el proyecto, Storage → Marketplace → **Upstash for Redis** → crear la base (el plan gratuito alcanza) y conectarla al proyecto. Eso carga `KV_REST_API_URL` y `KV_REST_API_TOKEN`.
3. **Variables de entorno** (Settings → Environment Variables), para Production y Preview:
   - `SITE_URL`: el dominio con `https://` y sin barra final. Mientras no haya dominio propio, la URL `https://<proyecto>.vercel.app`.
   - `WHATSAPP_NUMBER`: `5493548545460`.
4. **Deploy**. Si en el log del build aparece `Build en Vercel sin Upstash Redis`, falta el paso 2: el sitio funciona, pero el formulario responde que no pudo guardar y ofrece WhatsApp directo.
5. **Probar**: mandar un mensaje desde el formulario y verlo en la consola de Upstash (Data Browser → clave `contacts`, o `LRANGE contacts 0 -1`). El más nuevo queda primero.
6. **Dominio propio**: agregarlo en Settings → Domains, actualizar `SITE_URL` y volver a deployar.

Los mensajes viven en la lista `contacts` de Redis, uno por elemento, como JSON con `name`, `email`, `message` y `receivedAt`.

### Servidor propio (alternativa)

También corre en cualquier servidor con **Node 22.12+**: `npm run build` y `node dist/server/entry.mjs` (o `npm run preview`), con `HOST`, `PORT`, `SITE_URL` y `WHATSAPP_NUMBER`. Sin Redis guarda los mensajes en `CONTACTS_DIR`, que necesita **disco persistente**. Con las variables de Redis guarda en Redis, pero sin límite de envíos: fuera de Vercel la IP del cliente se puede falsificar.
