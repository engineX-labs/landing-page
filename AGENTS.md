# engineX · landing page

Landing de Social Engine, el producto de engineX, en `/` (única página). Astro 7 prerenderizado; las
únicas rutas server son `POST /api/waitlist` y `/api/assistant` (Fidel). Se deploya en Vercel
(`@astrojs/vercel` cuando `VERCEL=1`) y en local corre con `@astrojs/node` (dev, preview, e2e). El
diseño sale del sistema de diseño de engineX (`docs/engineX-sistema-de-diseno.pdf` y el artifact del
sistema), con dos temas: Carbón (oscuro) y Papel (claro).

El detalle de cómo correrla, configurar el dominio, la estructura y el contenido está en
`README.md`. Esta es la guía corta.

## Comandos

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo en `http://localhost:4321`. |
| `npm run build` | `astro check` (tipos) + `astro build` en `dist/`. |
| `npm run preview` | Sirve el build con Node (`dist/server/entry.mjs`) y el `.env`. Usa `HOST`, `PORT`, `WHATSAPP_NUMBER`, `WAITLIST_DIR`. |
| `npm run lint` | Biome: lint y formato, sin escribir. |
| `npm run format` | Biome con `--write`. |
| `npm test` | Vitest: lógica pura, lista de espera, Fidel, SEO y tema (`tests/unit`). |
| `npm run test:e2e` | Playwright contra el build de producción (`tests/e2e`). Usa el Google Chrome instalado (`channel: "chrome"`). |

Antes de dar algo por terminado: `npm run lint`, `npm test`, `npm run build` y `npm run test:e2e`.

Requiere Node 22.12 o superior.

## Variables de entorno

Ver `.env.example`. Se leen con `process.env` (en Astro 7 `import.meta.env` queda fijo en el build);
`astro.config.mjs` carga el `.env` en `dev` y `build`.

- `SITE_URL`: dominio público. **Se configura en `site.config.mjs`** (o con esta variable, que tiene
  prioridad). Sin dominio no se genera `/sitemap.xml` ni hay URLs absolutas; mal formado, el build
  falla.

- `WHATSAPP_NUMBER`: número de engineX sin `+` ni espacios. Por defecto `5493548545450`. Se usa al
  hacer el build (links de WhatsApp de la página y de Fidel, que es estática).
- `GEMINI_API_KEY`: key de Gemini para Fidel (solo servidor, nunca `PUBLIC_`). Sin ella el widget no
  aparece; en Vercel además hace falta Redis. `GEMINI_MODEL` (por defecto `gemini-2.5-flash-lite`) y
  `ASSISTANT_DAILY_LIMIT` (por defecto 300 mensajes por día en total) son opcionales, igual que los
  ajustes finos: `GEMINI_API_BASE`, `GEMINI_TIMEOUT_MS`, `GEMINI_TEMPERATURE`,
  `ASSISTANT_MAX_OUTPUT_TOKENS`, `ASSISTANT_RATE_LIMIT_MESSAGES` y `ASSISTANT_RATE_LIMIT_WINDOW`
  (defaults y validación en `src/lib/assistant-settings.ts` y `env-values.ts`; un valor inválido
  vuelve al default). Toda variable nueva que lea el código tiene que figurar en `.env.example` y en
  la tabla del README: `tests/unit/env-docs.test.ts` lo verifica.
- `KV_REST_API_URL` / `KV_REST_API_TOKEN` (o `UPSTASH_REDIS_REST_*`): Upstash Redis. Con ellas los
  emails de la lista de espera van a la lista `waitlist`; en Vercel, además, hay límite de 5 envíos
  por IP cada 10 minutos.
- `WAITLIST_DIR`: sin Redis, carpeta donde se guarda un `.json` por email. Por defecto
  `data/waitlist` (ignorada por git); necesita disco persistente. En Vercel no se usa: sin Redis el
  endpoint responde 500 en vez de perder el email.

## Estructura

- `src/styles/tokens.css`: tokens del sistema (colores semánticos, espaciado, radios, curvas,
  duraciones, fuentes). Única fuente de valores; Tailwind los expone como utilidades
  (`bg-surface`, `text-ink-muted`, `rounded-xl`, `ease-out`…). La paleta por defecto de Tailwind
  está deshabilitada.
- `src/styles/global.css`: escala tipográfica (`.display-xl` … `.code`, con la escala móvil) y las
  clases `ex-*` portadas de `components/bundle.css` del sistema.
- `src/components/`: `Logo` (con `gradientId` opcional: degradé en la flecha solo en claro),
  `Button`, `Arrow` (componentes del sistema, mismas props que su `index.d.ts`), `Faq` y
  `social-engine/` (secciones de la página, `ThemeToggle` y mockups).
- `src/components/logo-paths.ts`: paths oficiales del logo. No redibujar.
- `src/lib/contact.ts`: normalización y links del número de WhatsApp (puro).
  `src/lib/contact-server.ts`: lectura del request con límite, respuesta JSON y límite por IP.
  `src/lib/contact-store.ts`: almacenamiento (`FileContactStore`, `RedisContactStore`) y límite por IP.
- `src/lib/seo.ts` y `src/lib/structured-data.ts`: `robots.txt`, `sitemap.xml`, `llms.txt` y JSON-LD
  (funciones puras, testeadas). `src/routes/sitemap.xml.ts` se registra solo con dominio.
- `src/pages/index.astro` + `src/components/social-engine/` + `src/styles/social-engine*.css`:
  la landing de Social Engine. Copy en `src/lib/social-engine-content.ts` (compartido con `/llms.txt` y
  el JSON-LD). Cálculos de UI puros en `src/lib/social-engine-ui.ts`; interacciones en
  `src/scripts/social-engine.ts`. Lista de espera: `src/lib/waitlist.ts` (validación) y
  `src/lib/waitlist-server.ts` (handler); el almacenamiento y el límite son los de `contact-store.ts`.
- `src/lib/theme.ts`: tema claro/oscuro (lógica pura y el script inline del `<head>` que lo fija antes
  de pintar). El botón vive en `ThemeToggle.astro`; `setupTheme` en `social-engine.ts`.
- `src/components/Assistant.astro` + `src/pages/api/assistant.ts` + `src/lib/assistant*.ts`: Fidel, el
  asistente de IA (Gemini por REST, sin SDK). `assistant.ts` valida (puro, compartido con el widget),
  `assistant-prompt.ts` arma las instrucciones desde el documento de contexto de Fidel (productos,
  voz, reglas de derivación) y `assistant-config.ts` guarda sus datos (horario, prueba, precio vacío =
  "no confirmado"); Fidel escribe `[[whatsapp]]` o `[[lista]]` y el widget arma el link (nunca URLs),
  `assistant-limits.ts` tiene el límite por IP y el tope diario global, `assistant-server.ts` orquesta
  y llama a Gemini. Es un chat flotante, `secondary` (no suma un `primary`), que renderiza con
  `textContent`. Habla solo de Social Engine (ante otros temas deriva a WhatsApp). No da precios ni cifras de uso.
- `public/brand/`: los 11 logos oficiales. `public/fonts/`: Plus Jakarta Sans y JetBrains Mono.

## Convenciones del sistema de diseño

Dos temas: **Carbón** (oscuro, los tokens de `tokens.css`) y **Papel** (claro,
`html[data-theme="light"]` en `social-engine.css`). Un script inline en `Base` pone `data-theme`
antes de pintar: el guardado en `localStorage` o, sin elección, el del dispositivo. Sin JavaScript
queda oscuro y el botón de tema se oculta. Los componentes usan siempre tokens semánticos
(`var(--surface)`, `var(--ink)`…), nunca hex, para seguir al tema.

- Un solo botón `primary` por vista; un solo `h1`. Botones en píldora.
- Foco: 2px sólido `focus-ring` con 2px de separación en todo lo clickeable.
- Movimiento: solo `transform` y `opacity`, nada de UI por encima de 300ms, nunca `ease-in`, hover
  solo con `(hover: hover) and (pointer: fine)`. Apariciones al scrollear (`.se-reveal`,
  `.se-stagger`, 0,8 s) y bucles lentos (aurora, carrusel de redes, tarjetas que levitan), pausados
  fuera de pantalla y quietos con `prefers-reduced-motion`. Las apariciones solo ocultan contenido
  con `html.js`: sin JavaScript todo se ve.
- Degradé ignite → magenta → violeta: solo en el verbo que rota, el logo (en claro), bordes del
  mockup y de la caja de cierre, línea conectora. En texto se usan las paradas del tema
  (`--se-gradient-text`: oscuras en claro, claras en oscuro; ≥ 4,5:1 en los dos). El degradé de texto
  va en cada verbo, nunca en el contenedor: `background-clip: text` recorta según todos los hijos
  aunque tengan `opacity: 0`.
- Separación: en claro, sombras difusas solo en `.se-card`; en oscuro, bordes `line` sin sombras.
  Vidrio solo en superficies que flotan sobre algo con color (la barra de navegación).
- Logo: la flecha y la palabra "Social" llevan degradé solo en claro; en oscuro, flecha ignite y
  texto en tinta.
- Copy: voseo, primera persona del plural, sentence case, sin emojis ni exclamaciones en
  titulares. La marca se escribe siempre "engineX". Sin precios ni cifras de uso hasta tener datos
  reales.
- Alcance del copy: el MVP (Instagram y Facebook; informe semanal, chat con métricas, 3 ideas por
  semana; prueba de 7 días). No prometer programación, bandeja, automatizaciones, otras redes ni
  planes hasta que existan.

## Git

Ramas `feature/<slug>`; nada directo en `main`. Commits en español, estilo convencional
(`feat:`, `fix:`, `docs:`, `test:`, `chore:`). Los planes viven en `plans/`.
