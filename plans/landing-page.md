# Plan: Landing page de engineX

Estado: aprobado

## Objetivo

Implementar la landing page de **engineX** (agencia de software) siguiendo el sistema de diseño "engineX — Sistema de diseño, versión 2" (PDF del repo y su fuente viva, el artifact de diseño `https://claude.ai/artifact/XyZLHhbvFHAoA5hQ1pJHpS`). Es una landing en Node.js, solo landing (no app), con buenos efectos visuales, respetando los principios del sistema: oscuro y preciso, "mostrar, no prometer", voz rioplatense con voseo, y movimiento que confirma en vez de decorar.

## Feature a implementar

`feature/landing-page`: sitio de una página prerenderizado con **Astro 5**, más un único endpoint server `POST /api/contact` que valida, guarda el mensaje y devuelve la URL de WhatsApp. Estilos con **Tailwind CSS 4** sobre los tokens del sistema y animaciones con **Motion** (motion.dev, vanilla).

## Features que va a utilizar

En el repo no hay código (solo `README.md` y `engineX-sistema-de-diseno.pdf`). Lo que se usa sale del **artifact del sistema de diseño**, que es la fuente de verdad (el PDF es su exportación):

- `project/tokens.json`: colores (tema `dark` = Carbón), tipografía, `spacing`, `radius`, `easing`, `duration`. Se traducen a `src/styles/tokens.css`.
- `project/components/bundle.css`: clases `ex-btn*`, `ex-tag*`, `ex-card*`, `ex-field*`, `ex-logo*` y la escala tipográfica móvil. Se portan a los componentes Astro con los mismos valores.
- `project/components/bundle.js`: los paths SVG del componente `Logo` (constante `WORD` y la X-flecha) y el markup de `Button`, `Tag`, `ProjectCard` y `TextField` (son componentes React; se reescriben en Astro, sin React).
- `project/components/index.d.ts`: las props de `Logo`, `Button`, `Tag`, `ProjectCard` y `TextField`. Los componentes Astro respetan esos nombres.
- Asset group `Logos` (11 archivos oficiales): `enginex-logo-{dark-bg,light-bg,mono-white,mono-black}.svg`, `enginex-mark-*.svg`, `enginex-favicon.svg`, `enginex-app-icon.svg`, `enginex-app-icon-512.png`. Se copian a `public/brand/`.
- `project/fonts/`: `PlusJakartaSans-{400,500,600,700,800}.woff2` y `JetBrainsMono-{400,500}.woff2`. Se copian a `public/fonts/` (ver Riesgos: cobertura de acentos).

Referencias en el PDF: principios y voz (pág. 3), logo, color, tipografía, espaciado (pág. 4–5), movimiento e iconografía (pág. 6), tokens de color (pág. 7–8), escala tipográfica (pág. 9–10), espaciado, radios, curvas y duraciones (pág. 11–12), logos (pág. 13), componentes (pág. 14–19).

## Features que va a modificar

Ninguna (repo vacío).

## Fuera de alcance

- Tema Papel (claro): es para documentos y PDFs. La landing queda solo en Carbón.
- Páginas de casos de estudio, blog, i18n, SEO avanzado.
- Deploy e infraestructura (no se toca sin confirmación explícita).
- Backend de gestión de mensajes: solo recepción, validación y guardado.
- Tocar el artifact del sistema de diseño (solo se lee).

## Enfoque

### Stack

- **Astro 5** con `output: 'static'` (default) y adapter **`@astrojs/node`** (`mode: 'standalone'`). Todo se prerenderiza salvo `src/pages/api/contact.ts`, que declara `export const prerender = false`. En Astro 5 ya no existe `output: 'hybrid'` y `output: 'server'` haría SSR de todo el sitio, que no es lo que queremos.
- **Tailwind CSS 4** vía `@tailwindcss/vite` (la integración `@astrojs/tailwind` es para v3). Los tokens se definen **una sola vez** en `src/styles/tokens.css` como custom properties (`--surface`, `--ink`, `--space-6`, `--radius-xl`, `--ease-out`, `--duration-fast`…) con los mismos nombres del sistema, y `global.css` los expone a Tailwind con `@theme inline`. Se pisan los defaults de Tailwind que chocan: `--radius-*` (el `rounded-md` de Tailwind es 6px, el del sistema 10px), `--ease-out`/`--ease-in-out`, y se deshabilitan las paletas de color por defecto para no usar hex fuera del sistema. La escala de spacing de Tailwind 4 (múltiplos de 4px) coincide con `space-1..24`.
- **Fuentes**: los `.woff2` del sistema, auto-hospedados con `@font-face` y `font-display: swap`, más `<link rel="preload">` para Plus Jakarta Sans 400 y 800. Alternativa: `@fontsource` (ver Preguntas).
- **Íconos**: `@lucide/astro`, 24px, trazo 2px, color `ink-muted`.
- **Motion** (`motion`, solo la función `animate`/`stagger`): se usa solo para el momento del hero. El resto del movimiento es CSS puro, como en `bundle.css`.
- **Biome** para lint y formato (cubre `.ts`/`.js`; en `.astro` solo el frontmatter y los scripts, el soporte es parcial).

### Componentes (`src/components/`, Astro, sin React)

- `Logo.astro`: props `variant` (`full` | `mark`), `tone` (`auto` | `onDark` | `onLight` | `mono`), `height`, `title`. SVG inline con los paths oficiales de `bundle.js`; a 24px o menos el isotipo usa trazo 34 en vez de 28. Flecha siempre `ignite` salvo `mono`.
- `Button.astro`: `variant` (`primary` | `secondary` | `ghost`), `size` (`md` | `lg`), `arrow`, `href`, `loading`, `disabled`. Con `href` + `loading`/`disabled` se quita el `href` y se pone `aria-disabled`. Alto mínimo 44/56px. `:active` → `scale(0.97)` en `duration-press` `ease-out`; hover (solo `hover: hover` y `pointer: fine`) → `accent-hover` en `duration-fast` `ease`; la flecha se corre `translate(2px, -2px)`.
- `Tag.astro`: `tone` (`neutral` | `accent`). Una línea, con elipsis y `title` con el texto completo.
- `ProjectCard.astro`: `title`, `client`, `summary` (recorte a 3 líneas), `tags` (se muestran hasta 5), `image` + `imageAlt` (16:10), `href` + `cta`. Sin `image` muestra el isotipo sobre `stone`. Si hay `href`, la tarjeta entera es el `<a>` (sin botones adentro) y el hover cambia el borde a `accent`. **Sin "levantado" ni sombras**: el sistema separa con bordes, y `bundle.css` solo anima `border-color`. Sin `index` (no se numera el portfolio).
- `TextField.astro`: `label` (siempre visible), `hint`, `error`, `optional`, `multiline`, `rows`; el resto de atributos pasa al control. `aria-describedby` apunta a hint y error, `aria-invalid` cuando hay error, texto de 16px fijo, error con ícono en `danger`.
- Secciones: `Header.astro`, `Hero.astro`, `Services.astro`, `Projects.astro`, `Process.astro`, `ContactForm.astro`, `Footer.astro`.

### Estructura y contenido (voseo, sentence case, sin emojis ni exclamaciones)

1. **Header** sticky sobre `surface` con borde inferior `line`: `Logo` full (alto 28px), nav "Servicios", "Proyectos", "Cómo trabajamos", "Contacto" y CTA **secondary** "Contanos tu proyecto". El primary queda para el hero: el sistema pide un primary por vista. En móvil (≤640px) la nav pasa a un menú desplegable (botón con `aria-expanded`, entra en `duration-base` desde `scale(0.95)` + opacidad 0, `ease-out`; Escape y click afuera lo cierran).
2. **Hero**: el único `display-xl` de la página, "Software que empuja tu negocio"; bajada `body-lg` "Diseñamos y desarrollamos el software exacto que tu negocio necesita." (máx. 65ch); primary lg "Contanos tu proyecto" con `arrow` → `#contacto` y secondary lg "Ver proyectos" → `#proyectos`. A la derecha (escritorio), una composición de bloques con la X-flecha, en la línea de la portada del sistema (`Cover/preview.html`): `ignite`, `ink` y `stone` con `radius-xl`, sin degradados.
3. **Servicios**, título `display` "Lo que construimos": 6 tarjetas `surface-raised`, borde `line`, `radius-xl`, padding `space-6`: sistemas de gestión, facturación electrónica ARCA, reservas online, pagos (Mercado Pago), webs, integraciones. Cada una con ícono Lucide, título `heading-3` y una línea que cuenta qué gana el cliente.
4. **Proyectos**, título `heading-2`: grilla de `ProjectCard` (3 columnas en escritorio, 2 en tablet, 1 en móvil, gap `space-6`) desde una colección de contenido. El primer proyecto real es **Reservo** (ficha abajo); el resto lo pasa el usuario más adelante y, mientras tanto, se completa la grilla con los ejemplos del sistema marcados `draft: true` (se ven en `dev` y no salen en el build de producción). Los proyectos sin captura usan el fallback isotipo sobre `stone`. Sin casos de estudio internos: si un proyecto tiene web pública, la tarjeta entera linkea ahí (`target="_blank"`, `rel="noopener"`).

   **Ficha de Reservo** (`src/content/projects/reservo.md`):
   - `client`: "Alojamientos turísticos: cabañas, departamentos y suites"
   - `title`: "Reservo, gestión de reservas para alojamientos"
   - `summary`: "Manejan todas sus reservas desde cualquier dispositivo." (en tercera persona, como el ejemplo "Facturan en 3 clics" del sistema: es el resultado del cliente)
   - `tags`: `React`, `FastAPI`, `Python`, `Tailwind CSS`, `Docker` (máximo 5, todas en tono `neutral`)
   - `href`: `https://www.mireservo.online`, `cta`: "Ver Reservo" con flecha
   - `image`: captura 1440×900 (16:10) del hero de mireservo.online, sacada el 23/10/2026 y guardada en `plans/assets/reservo-1440x900.png`. Se mueve a `src/assets/projects/reservo.png` y se sirve optimizada con `astro:assets` (`<Image>`, WebP, `loading="lazy"`). `imageAlt`: "Página de inicio de Reservo con el calendario de reservas por unidad en un celular". Va dentro de un marco simple sobre `stone`, como pide el sistema para las capturas.
5. **Cómo trabajamos**, título `heading-2`: 4 pasos con index mono `accent-ink` (acá sí es una secuencia): "Nos contás qué necesitás" → "Propuesta y presupuesto sin cargo" → "Diseño y desarrollo" → "Lo tenés funcionando".
6. **Contacto** (`#contacto`), título `heading-2` "Contanos tu proyecto": formulario (nombre, email, mensaje multiline) y al lado el único dato de contacto, WhatsApp (link `wa.me` al número de `WHATSAPP_NUMBER`), y "Te respondemos en 24 h". Sin email ni redes.
7. **Footer**: `Logo` full, links de la nav, WhatsApp, "© 2026 engineX".

Ritmo: secciones con `space-24` vertical en escritorio y `space-16` en móvil, gutter `space-4` en móvil, separación entre bloques `space-12`. Proporción de color 60/30/10: el naranja solo en el primary, la flecha, los index del proceso, el borde en hover y el foco.

### Movimiento (reglas del sistema)

- Solo `transform` y `opacity`; nunca `ease-in`; nada de UI por encima de 300ms; sin animaciones de entrada al hacer scroll.
- **El único momento es el hero**: titular, bajada, botones y composición entran con opacidad 0→1 y `translateY(8px)`→0, 280ms cada uno, `ease-out` del sistema, stagger de 60ms (todo termina antes de ~500ms). Con `prefers-reduced-motion` se saca el desplazamiento y queda solo la opacidad. Sin JS el hero se ve completo desde el primer render (el estado inicial oculto lo pone el script, no el CSS).
- Botones, tarjetas, campos y menú: tal cual `bundle.css` (ver Componentes).

### Formulario de contacto y WhatsApp

- Cliente (`ContactForm.astro` con un `<script>`): valida al salir del campo y al enviar, no mientras se escribe. Errores en voseo que dicen qué pasó y cómo arreglarlo ("Falta el dominio del email, por ejemplo hola@tunegocio.com"). El submit es primary **sin** `arrow` (el sistema reserva la flecha para ir a otro lugar). Mientras envía: `loading` + `aria-busy`. Al terminar: mensaje `success` con ícono (o `danger` si falla), anunciado con `aria-live="polite"`, entrando en `duration-base` desde `scale(0.95)`.
- **Apertura de WhatsApp** (decidido): no se usa `window.open` después del `fetch`, porque Safari/iOS y otros navegadores lo bloquean (ya no hay gesto del usuario). El estado de éxito muestra el link "Seguir por WhatsApp" (`<a target="_blank" rel="noopener">` con `arrow`) a la URL que devuelve el endpoint.
- Endpoint `POST /api/contact` (`src/pages/api/contact.ts`, `prerender = false`): acepta JSON; valida nombre (1–100), email (formato), mensaje (1–2000) y honeypot `company` (si viene lleno responde 200 sin guardar, para no avisarle al bot); limita el tamaño del body. Guarda un `.json` por mensaje en `data/contacts/` (`<timestamp>-<id>.json`, ignorado por git). Responde `{ ok: true, whatsappUrl }` con `https://wa.me/<WHATSAPP_NUMBER>?text=<encodeURIComponent(mensaje con nombre, email y consulta)>`, o `400 { ok: false, errors: { campo: mensaje } }`.
- La lógica de validación y armado de la URL vive en `src/lib/contact.ts` (funciones puras), para testearla sin levantar el servidor.
- `WHATSAPP_NUMBER` por variable de entorno, con `5493548545460` como default de desarrollo.

### Metadata y accesibilidad

- `<html lang="es-AR">`, title, description, `theme-color` `#0e1116`, favicon `enginex-favicon.svg`, `apple-touch-icon` desde `enginex-app-icon-512.png`, OG title/description/image (`enginex-app-icon-512.png`).
- Link "Saltar al contenido", foco `focus-ring` 2px con 2px de separación en todo lo clickeable, labels reales, `aria-describedby` en errores, `aria-busy`, `alt` en imágenes, `scroll-margin-top` en las anclas para que el header sticky no tape los títulos.

### Workflow

Se crean `AGENTS.md` y `CLAUDE.md` con los comandos (`dev`, `build`, `preview`, `lint`, `format`, `test`, `test:e2e`) y las convenciones del repo, junto con la implementación.

## Archivos afectados

Todos nuevos:

- `package.json`, `astro.config.mjs`, `tsconfig.json`, `biome.json`, `.gitignore`, `.env.example` (`WHATSAPP_NUMBER`), `playwright.config.ts`, `vitest.config.ts`
- `src/layouts/Base.astro`
- `src/pages/index.astro`, `src/pages/api/contact.ts`
- `src/lib/contact.ts`
- `src/components/`: `Logo.astro`, `Button.astro`, `Tag.astro`, `ProjectCard.astro`, `TextField.astro`, `Header.astro`, `Hero.astro`, `Services.astro`, `Projects.astro`, `Process.astro`, `ContactForm.astro`, `Footer.astro`
- `src/styles/tokens.css`, `src/styles/global.css`
- `src/content.config.ts` (Astro 5, loader `glob`, schema con `client`, `title`, `summary`, `tags`, `image`, `imageAlt`, `href`, `cta`, `draft`) y `src/content/projects/*.md` (`reservo.md` + 2 ejemplos `draft`)
- `src/assets/projects/reservo.png` (captura de mireservo.online)
- `public/brand/` (los 11 logos oficiales), `public/fonts/` (7 `.woff2`)
- `data/contacts/` (se genera en runtime, ignorado por git)
- `tests/unit/contact.test.ts` (Vitest), `tests/e2e/landing.spec.ts` (Playwright)
- `AGENTS.md`, `CLAUDE.md`
- `docs/engineX-sistema-de-diseno.pdf` (se mueve desde la raíz y se versiona)

## Riesgos y supuestos

- **Logos y fuentes**: ya están en el artifact del sistema (11 logos y 7 fuentes). Supuesto: se descargan de ahí y se versionan en `public/`. El componente `Logo` usa los paths oficiales de `bundle.js`, no un redibujo.
- **Acentos en las fuentes**: los `.woff2` del sistema pesan ~12 KB por peso, así que están subseteados. Supuesto: incluyen latin-1 (á, é, í, ó, ú, ñ, ¿). Se verifica antes de usarlos; si faltan glifos, se usa `@fontsource` (mismas familias, OFL).
- **Proyectos placeholder**: "mostrar, no prometer" choca con publicar proyectos inventados como si fueran reales. Los ejemplos del sistema van con `draft: true` y el build de producción los excluye, así que con solo Reservo cargado la grilla de producción tiene una tarjeta. El layout tiene que verse bien con 1, 2 o 3 proyectos.
- **Guardado en disco**: `data/contacts/` necesita un servidor Node con disco persistente. En serverless (Vercel, Netlify) el disco es efímero y los mensajes se perderían. El deploy está fuera de alcance, pero condiciona dónde se puede publicar.
- **Momento del hero**: cada elemento dura 280ms (dentro del límite de 300ms) y la secuencia total ~500ms por el stagger. Interpreto que el límite es por animación y que el hero es el único momento que permite el sistema.
- **Copy**: lo escribimos nosotros con la voz del sistema y queda para editar.
- **`bundle.css`**: en esta implementación no hay `bundle.css`. Su contenido se porta a los componentes y a `global.css` (incluida la escala tipográfica móvil: `display-xl` 44/48, `display` 36/40, `heading-1` 30/36, `heading-2` 26/32, `heading-3` 20/28).

## Verificación

- `npm run lint` (Biome) y `npm run build` sin errores ni warnings.
- **Vitest** (`src/lib/contact.ts` y el handler del endpoint): email inválido → 400 con el error del campo; mensaje vacío → 400; honeypot lleno → 200 sin escribir archivo; body demasiado grande → 413; éxito → escribe un `.json` en un directorio temporal y devuelve `whatsappUrl` con el número de `WHATSAPP_NUMBER` y el texto codificado (incluye acentos, `&`, `?` y saltos de línea).
- **Playwright** (sobre `astro build` + `preview` con el adapter Node):
  - Envío completo: muestra el estado `success` y el link de WhatsApp tiene la URL esperada.
  - Email inválido al salir del campo: el error aparece, el input tiene `aria-invalid="true"` y su `aria-describedby` apunta al id del error.
  - Teclado: Tab recorre header, hero y formulario con `outline` visible de 2px.
  - `reducedMotion: 'reduce'`: los elementos del hero terminan sin `transform` (solo cambia la opacidad).
  - Móvil (375px): sin scroll horizontal, el menú abre y cierra y el `display-xl` mide 44px.
- Revisión visual con capturas (escritorio y móvil) contra el sistema: 60/30/10, un solo `display-xl`, un primary por vista, radios y espaciados de los tokens, tamaños tipográficos exactos y voseo en todos los textos.

## Preguntas abiertas

Ninguna. Resueltas: WhatsApp se abre desde un link en el estado de éxito; el único contacto visible es WhatsApp; el PDF se versiona en `docs/`; la ficha de Reservo está definida con su captura; los demás proyectos llegan más adelante.
