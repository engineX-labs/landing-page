# engineX · landing page

Landing de engineX (agencia de software). Astro 7 prerenderizado con adapter Node; la única ruta
server es `POST /api/contact`. El diseño sale del sistema de diseño de engineX
(`docs/engineX-sistema-de-diseno.pdf` y el artifact del sistema), tema Carbón.

## Comandos

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo en `http://localhost:4321` (muestra también los proyectos `draft`). |
| `npm run build` | `astro check` (tipos) + `astro build` en `dist/`. |
| `npm run preview` | Sirve el build con Node (`dist/server/entry.mjs`). Usa `HOST`, `PORT`, `WHATSAPP_NUMBER`, `CONTACTS_DIR`. |
| `npm run lint` | Biome: lint y formato, sin escribir. |
| `npm run format` | Biome con `--write`. |
| `npm test` | Vitest: validación y endpoint de contacto (`tests/unit`). |
| `npm run test:e2e` | Playwright contra el build de producción (`tests/e2e`). Usa el Google Chrome instalado (`channel: "chrome"`). |

Antes de dar algo por terminado: `npm run lint`, `npm test`, `npm run build` y `npm run test:e2e`.

Requiere Node 22.12 o superior.

## Variables de entorno

Ver `.env.example`. Se leen con `process.env` en runtime (en Astro 7 `import.meta.env` queda fijo
en el build).

- `WHATSAPP_NUMBER`: número de engineX sin `+` ni espacios. Por defecto `5493548545460`. Se usa
  en dos momentos: al hacer el build (links de la página, que es estática) y en runtime (URL que
  devuelve `/api/contact`). Tiene que estar definido igual en los dos.
- `CONTACTS_DIR`: carpeta donde se guarda un `.json` por mensaje. Por defecto `data/contacts`
  (ignorada por git). Necesita disco persistente: en serverless los mensajes se pierden.

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
  `src/lib/contact-server.ts`: lectura del request y guardado.
- `src/content/projects/*.md`: proyectos del portfolio. `draft: true` se ve en dev y no sale en
  producción.
- `public/brand/`: los 11 logos oficiales. `public/fonts/`: Plus Jakarta Sans y JetBrains Mono.

## Convenciones del sistema de diseño

- Tema Carbón únicamente. Usar tokens semánticos, nunca hex.
- Un solo `display-xl` por página y un solo botón `primary` por vista.
- Separar con bordes `line`, sin sombras, vidrio ni degradados.
- Movimiento: solo `transform` y `opacity`, nada de UI por encima de 300ms, nunca `ease-in`, hover
  solo con `(hover: hover) and (pointer: fine)`, sin animaciones de entrada al hacer scroll. El
  único momento es el hero. `prefers-reduced-motion` quita escalas y desplazamientos.
- Foco: 2px sólido `focus-ring` con 2px de separación en todo lo clickeable.
- Copy: voseo, primera persona del plural, sentence case, sin emojis ni exclamaciones en
  titulares. La marca se escribe siempre "engineX".
- La flecha (`arrow`) solo en acciones que llevan a otro lugar, no en el submit.

## Git

Ramas `feature/<slug>`; nada directo en `main`. Commits en español, estilo convencional
(`feat:`, `fix:`, `docs:`, `test:`, `chore:`). Los planes viven en `plans/`.
