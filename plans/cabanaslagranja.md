# Plan: Clientes y proyecto Cabañas La Granja

Estado: aprobado

## Objetivo

Mostrar en la landing de engineX que ya tenemos clientes reales: una barra de clientes con el logo de
Cabañas La Granja y la landing que les hicimos como proyecto del portfolio.

## Feature a implementar

`feature/cabanaslagranja`:

1. Barra de clientes con el logo de Cabañas La Granja.
2. Proyecto "Cabañas La Granja" en la sección Proyectos, con captura y link a su sitio.

## Features que va a utilizar

- Colección `projects` (`src/content.config.ts`) y `ProjectCard`: el proyecto nuevo es un `.md` más,
  sin cambiar el esquema ni el componente.
- `Projects.astro`: con dos proyectos la grilla ya pasa sola a `sm:grid-cols-2`.
- `/llms.txt` (`src/pages/llms.txt.ts`, `buildLlmsTxt`): toma los proyectos de la colección, así que
  La Granja aparece ahí sin tocar código.
- Tokens del tema Carbón (`ink-muted`, `line`, espaciados) para la barra.

## Features que va a modificar / crear

- **Nuevo `src/components/Clients.astro`**: barra de clientes.
  - Lista de clientes en `src/lib/content.ts` (`clients: { name, logo, href? }[]`) para que agregar el
    próximo sea una línea.
  - Título chico (`overline`): "Confían en nosotros", logos en fila con `flex-wrap`,
    separada con borde `line`, sin sombras ni animaciones.
  - Con un solo cliente se muestra igual; la fila está pensada para crecer.
  - El logo **no es link** (el link al sitio está en la tarjeta del proyecto).
  - Logo en **monocromo** con el color `ink-muted` usando `mask-image` sobre el PNG transparente: el
    logo original es marrón oscuro y sobre Carbón casi no se ve. Sin hover: no es clickeable.
  - Accesible: `<ul>` con `aria-label`, cada logo con su nombre como texto accesible
    (`role="img"` + `aria-label`, ya que la máscara no es un `<img>`).
- **`src/pages/index.astro`**: insertar `<Clients />` entre `Hero` y `Services`.
- **Logo**: `public/clientes/cabanas-la-granja.png`, copiado de
  `gestion_lagranja/landing/src/assets/clientes/cabanas-la-granja.png` (655×213, fondo transparente).
  El `logo.jpeg` con fondo crema del checkout principal no se usa.
- **Nuevo `src/content/projects/cabanas-la-granja.md`**:
  ```yaml
  title: Cabañas La Granja, landing para un complejo en las sierras
  client: "Complejo de cabañas en La Falda, Córdoba"
  summary: Un sitio propio que les da una imagen más profesional y lleva las consultas directo a WhatsApp.
  tags: [React, Vite, Tailwind CSS, TypeScript]
  image: ../../assets/projects/cabanas-la-granja.png
  imageAlt: Página de inicio de Cabañas La Granja con ...
  href: https://www.xn--cabaaslagranja-tnb.com
  cta: Ver sitio
  order: 2
  ```
  - `href` en punycode: es lo que valida `z.url()` y lo que funciona en cualquier navegador (los
    navegadores igual muestran `cabañaslagranja.com` en la barra). En el texto visible, si aparece el
    dominio, va con ñ.
  - Tags tomados del `package.json` real de su landing (React 19, Vite, Tailwind 3, TypeScript).
- **Nueva `src/assets/projects/cabanas-la-granja.png`**: captura 1440×900 del sitio en producción,
  igual que la de Reservo (sacada con Playwright, sin banners ni cosas a medio cargar).
- **Tests e2e (`tests/e2e/landing.spec.ts`)**:
  - "producción: solo proyectos reales" pasa de 1 a 2 tarjetas y verifica el link y el `alt` de La
    Granja (cambia porque cambia el contenido, no por acomodar el test).
  - Nuevo: la barra de clientes muestra "Cabañas La Granja" con nombre accesible.
  - Los tests de foco, móvil sin scroll horizontal y `llms.txt` siguen corriendo como están; si el
    logo no es link, así que no suma un elemento enfocable.
- `README.md` / `AGENTS.md`: una línea sobre `public/clientes/` y cómo sumar un cliente.

## Fuera de alcance

- Testimonios o citas del cliente.
- Página de caso de estudio propia (`/proyectos/cabanas-la-granja`).
- Carrusel o marquesina animada de logos (el sistema prohíbe movimiento fuera del hero).
- Cambios en el sitio de La Granja.

## Pasos

1. Rama `feature/cabanaslagranja` (ya creada desde `origin/main`).
2. Logo transparente en `public/clientes/`.
3. `clients` en `content.ts` + `Clients.astro` + inserción en `index.astro`.
4. Captura del sitio y `cabanas-la-granja.md`.
5. Ajustar/agregar e2e.
6. `npm run lint`, `npm test`, `npm run build`, `npm run test:e2e` y revisión visual en desktop y
   móvil (dev server).

## Verificación

- Los cuatro comandos en verde.
- Capturas desktop y 375px de la barra y de la grilla con dos proyectos.
- `/llms.txt` del build lista La Granja con su link.

## Decisiones

1. Logo: el PNG transparente de `gestion_lagranja`.
2. Monocromo en `ink-muted`.
3. Barra debajo del hero.
4. Se muestra con un solo cliente; se van a sumar más.
5. Título: "Confían en nosotros".
6. El logo no linkea.
7. Summary de la tarjeta: "Un sitio propio que les da una imagen más profesional y lleva las consultas
   directo a WhatsApp." (a confirmar).
