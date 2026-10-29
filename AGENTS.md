# engineX · landing page

Landing de engineX (agencia de software). Astro 7 prerenderizado; la única ruta server es
`POST /api/contact`. Se deploya en Vercel (`@astrojs/vercel` cuando `VERCEL=1`) y en local corre con
`@astrojs/node` (dev, preview, e2e). El diseño sale del sistema de diseño de engineX
(`docs/engineX-sistema-de-diseno.pdf` y el artifact del sistema), tema Carbón.

El detalle de cómo correrla, configurar el dominio, la estructura y el contenido está en
`README.md`. Esta es la guía corta.

## Comandos

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo en `http://localhost:4321` (muestra también los proyectos `draft`). |
| `npm run build` | `astro check` (tipos) + `astro build` en `dist/`. |
| `npm run preview` | Sirve el build con Node (`dist/server/entry.mjs`) y el `.env`. Usa `HOST`, `PORT`, `WHATSAPP_NUMBER`, `CONTACTS_DIR`. |
| `npm run lint` | Biome: lint y formato, sin escribir. |
| `npm run format` | Biome con `--write`. |
| `npm test` | Vitest: validación y endpoint de contacto (`tests/unit`). |
| `npm run test:e2e` | Playwright contra el build de producción (`tests/e2e`). Usa el Google Chrome instalado (`channel: "chrome"`). |

Antes de dar algo por terminado: `npm run lint`, `npm test`, `npm run build` y `npm run test:e2e`.

Requiere Node 22.12 o superior.

## Variables de entorno

Ver `.env.example`. Se leen con `process.env` (en Astro 7 `import.meta.env` queda fijo en el build);
`astro.config.mjs` carga el `.env` en `dev` y `build`.

- `SITE_URL`: dominio público. **Se configura en `site.config.mjs`** (o con esta variable, que tiene
  prioridad). Sin dominio no se genera `/sitemap.xml` ni hay URLs absolutas; mal formado, el build
  falla.

- `WHATSAPP_NUMBER`: número de engineX sin `+` ni espacios. Por defecto `5493548545460`. Se usa
  en dos momentos: al hacer el build (links de la página, que es estática) y en runtime (URL que
  devuelve `/api/contact`). Tiene que estar definido igual en los dos.
- `KV_REST_API_URL` / `KV_REST_API_TOKEN` (o `UPSTASH_REDIS_REST_*`): Upstash Redis. Con ellas los
  mensajes van a la lista `contacts`; en Vercel, además, hay límite de 5 envíos por IP cada 10 minutos.
- `CONTACTS_DIR`: sin Redis, carpeta donde se guarda un `.json` por mensaje. Por defecto
  `data/contacts` (ignorada por git); necesita disco persistente. En Vercel no se usa: sin Redis el
  endpoint responde 500 en vez de perder el mensaje.

## Estructura

- `src/styles/tokens.css`: tokens del sistema (colores semánticos, espaciado, radios, curvas,
  duraciones, fuentes). Única fuente de valores; Tailwind los expone como utilidades
  (`bg-surface`, `text-ink-muted`, `rounded-xl`, `ease-out`…). La paleta por defecto de Tailwind
  está deshabilitada.
- `src/styles/global.css`: escala tipográfica (`.display-xl` … `.code`, con la escala móvil) y las
  clases `ex-*` portadas de `components/bundle.css` del sistema.
- `src/components/`: `Logo`, `Button`, `Tag`, `ProjectCard`, `TextField` (componentes del sistema,
  mismas props que su `index.d.ts`) y las secciones de la página.
- `src/components/logo-paths.ts`: paths oficiales del logo. No redibujar.
- `src/lib/contact.ts`: validación y URL de WhatsApp (puro, compartido con el cliente).
  `src/lib/contact-server.ts`: lectura del request, límite y respuesta.
  `src/lib/contact-store.ts`: almacenamiento (`FileContactStore`, `RedisContactStore`) y límite por IP.
- `src/lib/seo.ts` y `src/lib/structured-data.ts`: `robots.txt`, `sitemap.xml`, `llms.txt` y JSON-LD
  (funciones puras, testeadas). `src/routes/sitemap.xml.ts` se registra solo con dominio.
- `src/lib/content.ts`: copy del hero, servicios, proceso y preguntas frecuentes, compartido con
  `/llms.txt` y el JSON-LD (`FAQPage`). `PRICE_FROM` es el precio "desde" de la pregunta del precio:
  vacío, la respuesta no da cifra.
- `src/content/projects/*.md`: proyectos del portfolio (Reservo y Freggiaro). `draft: true` se ve
  en dev y no sale en producción. `demo: /demo/<slug>` hace que la tarjeta abra esa página en el
  modal (`DemoDialog`) en lugar de linkear afuera.
- `src/pages/demo/freggiaro.astro` + `src/components/FreggiaroDemo.astro` + `src/lib/freggiaro-demo.ts`:
  demo interactiva de Freggiaro con datos ficticios. Es una página propia (`noindex`, fuera del
  sitemap); la home la muestra en un `<dialog>` con un `<iframe>` que carga recién al abrirlo
  (`?embed` oculta su barra). Usa los colores de Freggiaro acotados a `.demo`: es la única
  excepción a "solo tema Carbón".
- `public/clientes/`: logos PNG transparentes de la barra "Confían en nosotros". Para sumar un
  cliente: copiar el logo acá y agregar una entrada a `clients` en `src/lib/content.ts` (`tone: "mono"` o `"color"`).
- `src/components/DeviceShowcase.astro`: mockup de compu y celular. Lo usan el hero y las tarjetas
  de proyecto (`image` + `mobileImage` en el `.md`). Las capturas van en `src/assets/projects/`:
  `<slug>-desktop.jpg` (1440×900) y `<slug>-mobile.jpg` (390×844 a 2x).
- `public/brand/`: los 11 logos oficiales. `public/fonts/`: Plus Jakarta Sans y JetBrains Mono.

## Convenciones del sistema de diseño

- Tema Carbón únicamente. Usar tokens semánticos, nunca hex.
- Un solo `display-xl` por página y un solo botón `primary` por vista.
- Separar con bordes `line`, sin sombras. **Vidrio y brillos, acotados:** el vidrio (`.glass`,
  `--glass-*`) va solo en superficies que flotan sobre algo con color (header, chips del hero,
  barra de WhatsApp); los brillos radiales (`--glow-*`) solo de fondo, en el hero y en el medio de
  las tarjetas de proyecto. Nada de degradados en texto, botones ni tarjetas.
- Movimiento: solo `transform` y `opacity`, nada de UI por encima de 300ms, nunca `ease-in`, hover
  solo con `(hover: hover) and (pointer: fine)`, sin animaciones de entrada al hacer scroll. El
  único momento es el hero (CSS, `@keyframes ex-rise`; no hay librería de animación). El fondo del
  hero tiene dos brillos que derivan muy lento (22 y 28 s, solo `transform`), pausados fuera de
  pantalla y quietos con movimiento reducido.
  `prefers-reduced-motion` quita escalas y desplazamientos. Excepción aprobada: la barra de WhatsApp
  en móvil (`MobileWhatsappBar`) aparece al pasar el hero, porque es un control y no contenido.
- Foco: 2px sólido `focus-ring` con 2px de separación en todo lo clickeable.
- Copy: voseo, primera persona del plural, sentence case, sin emojis ni exclamaciones en
  titulares. La marca se escribe siempre "engineX".
- La flecha (`arrow`) solo en acciones que llevan a otro lugar, no en el submit.

## Git

Ramas `feature/<slug>`; nada directo en `main`. Commits en español, estilo convencional
(`feat:`, `fix:`, `docs:`, `test:`, `chore:`). Los planes viven en `plans/`.
