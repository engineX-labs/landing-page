# Pivot: Social Engine como página principal + modo oscuro

Estado: **aprobado**. Base: `main` en `10025ab` (incluye PR #9 y #10).

## Objetivo

1. `https://engine.nlabs.com.ar/` pasa a mostrar Social Engine (hoy en `/social-engine`). El contenido
   actual de la home desaparece, junto con el código que quede sin uso.
2. Dos temas en la misma página:
   - **Claro**: el diseño actual de `/social-engine` (tema Papel).
   - **Oscuro**: el diseño actual de la home (tema Carbón), aplicado a las secciones de Social Engine.
3. Cambio chico en el modo claro: la flecha del logo y la palabra "Social" llevan el mismo degradé
   (ignite → magenta → violeta) que los verbos del título.

## Decisiones ya tomadas (respuestas del usuario)

- `/social-engine` se **elimina** (404, sin redirección).
- Se borra **todo** lo de la home vieja, incluido el formulario de contacto y `/api/contact`.
- Fidel pasa a hablar **solo de Social Engine**; ante pedidos a medida u otros temas deriva a
  WhatsApp.

## Supuestos a confirmar (marcados con ⚠)

- ⚠ **Cómo se cambia de tema**: la respuesta a esa pregunta no se entendió ("ya que hay una nueva
  versión"). Se asume lo recomendado: arranca según el modo del dispositivo
  (`prefers-color-scheme`), hay un botón en la barra para cambiarlo y se recuerda la elección
  (`localStorage`). Un script mínimo en el `<head>` fija el tema antes de pintar para que no haya
  parpadeo.
- ⚠ **Logo con degradé**: solo en modo claro, como se pidió. En oscuro el logo queda como el de hoy
  (flecha ignite, "Social Engine" en tinta). Si lo querés igual en los dos modos, es un cambio de CSS.
- **Rama**: `feature/pivot-social-engine` desde `main` actualizada (PR #9 y #10 ya mergeados), PR a `main`.

## Qué se elimina

| Qué | Archivos |
| --- | --- |
| Home vieja | `src/pages/index.astro` (se reemplaza), `Hero`, `Products`, `Clients`, `Services`, `Projects`, `ProjectCard`, `Process`, `ContactForm`, `Header`, `Footer`, `MobileWhatsappBar`, `Faq` de la home (la de SE se mantiene, ver abajo), `DeviceShowcase`, `Tag`, `TextField` si quedan sin uso |
| Demo de Freggiaro | `src/pages/demo/`, `FreggiaroDemo.astro`, `DemoDialog.astro`, `src/lib/freggiaro-demo.ts`, `src/assets/freggiaro/`, `tests/e2e/demo.spec.ts`, `tests/unit/freggiaro-demo.test.ts` |
| Proyectos | `src/content/projects/`, `src/content.config.ts`, `src/assets/projects/`, `public/clientes/` |
| Contacto | `src/pages/api/contact.ts`, `handleContact` y su config en `contact-server.ts`, tests de contacto |
| Ruta vieja | `src/pages/social-engine.astro` (su contenido pasa a `index.astro`) |
| Copy de la home | `src/lib/content.ts`: se borra salvo lo que use Fidel (horario de atención, etc.), que se mueve a `assistant-config.ts` |

Se **conserva** de contacto lo que usan la lista de espera y Fidel: `readJsonBody`, `json`,
`rateLimitResponse`, `contact-store.ts` (Redis/archivos y límite por IP) y la normalización del
número de WhatsApp. Se revisa con `grep` cada archivo antes de borrarlo; lo que quede sin uso se
borra, lo que tenga un segundo usuario se queda.

## Qué se cambia

### 1. Página principal
- `src/pages/index.astro` = la página de Social Engine actual (mismo orden de secciones, mismo
  `Assistant`). El `<title>`/descripción son los de `social-engine-content.ts`.
- `SeNav`: se saca el link "engineX" (apuntaba a la home vieja). `SeFooter`: "Un producto de
  engineX" deja de ser un link a `/`.
- Los componentes de `src/components/social-engine/` y los estilos `social-engine*.css` se
  mantienen, pero se renombran sin el prefijo `se-`/carpeta solo si el costo es bajo; **no** se
  hace un renombrado masivo (riesgo sin beneficio). Se evalúa en la construcción.
- Links internos `#lista`, `#producto`, etc. siguen igual (ahora están en `/`).

### 2. SEO / GEO
- `sitePaths = ["/"]`; `llms.txt`, JSON-LD (`buildSocialEngineData`) y `robots.txt` pasan a describir
  solo Social Engine, con URLs absolutas a la raíz. Se elimina `buildStructuredData` de la home.
- `Base.astro`: sin la lógica de "carbon/papel" por página; el tema lo define el script de tema.
- `WAITLIST_HREF` de Fidel pasa de `/social-engine#lista` a `/#lista`.

### 3. Modo oscuro
- Tokens: el `:root` actual (Carbón) queda como **oscuro**. El bloque `html.se` (Papel) se
  reemplaza por `html[data-theme="light"]`; `social-engine.css` deja de depender de la clase `se`.
- Script inline en el `<head>` (antes del CSS pintado): lee `localStorage["theme"]` o
  `prefers-color-scheme` y pone `data-theme` en `<html>`. Actualiza `<meta name="theme-color">` y
  `color-scheme`. Sin JS queda el tema del dispositivo vía `@media (prefers-color-scheme)`.
- Botón de tema en `SeNav` (ícono sol/luna, `aria-pressed`, etiqueta clara, objetivo de 44px, anillo
  de foco de 2px). Es secundario: no suma un `primary`.
- Ajustes del diseño oscuro en las secciones de Social Engine:
  - Degradé de texto: en claro, las paradas oscuras (`--se-gradient-text`, ≥ 4,5:1 sobre Papel); en
    oscuro, las paradas claras originales (≥ 4,5:1 sobre Carbón). Se verifica contraste en ambos.
  - Tarjetas: en claro, sombra difusa (`.se-card`); en oscuro, borde `line` sin sombra (regla del
    tema Carbón).
  - Fondo del hero (aurora), barra de anuncio, mockups (`MockWindow` y vistas), carrusel de redes,
    caja de cierre y formulario de la lista de espera: se revisan uno por uno en oscuro; lo que
    tenga colores fijos pasa a tokens.
  - Fidel: ya usa tokens; se revisa en ambos temas.
- Movimiento sin cambios (solo `transform` y `opacity`, quieto con `prefers-reduced-motion`). El
  cambio de tema es instantáneo (sin transición de colores).

### 4. Logo con degradé (modo claro)
- `Logo.astro` acepta `gradient`: un `<linearGradient>` SVG (`#ff5b2e → #e0307a 55% → #7c5cff`, las
  mismas paradas que `--se-gradient`) aplicado como `stroke` de `.ex-logo-accent-s` (la flecha).
  IDs únicos por instancia para no chocar si el logo aparece más de una vez.
- `SocialEngineLogo`: la palabra "Social" con `.se-grad` (paradas oscuras de texto), "Engine" en
  tinta. Solo en claro; en oscuro, los colores de hoy.

### 5. Fidel
- `ASSISTANT_PAGES` y la prop `page` se simplifican a una sola página; la clave de `localStorage`
  queda `fidel` (se pierde el historial viejo, es solo conversación local).
- `assistant-prompt.ts`/`assistant-config.ts`: se sacan servicios a medida, proyectos y precios
  "desde" de engineX. Regla: habla solo de Social Engine; para cualquier otra cosa (desarrollos a
  medida, otros temas) deriva a WhatsApp con `[[whatsapp]]`.
- `api/assistant.ts`: ya no lee la colección de proyectos. Las variables de ajuste de Fidel (`assistant-settings.ts`, `env-values.ts`, PR #10) no tocan servicios ni precios: se conservan tal cual.

### 6. Docs y configuración
- `README.md` y `AGENTS.md`: nueva descripción (una sola página, dos temas, sin contacto ni demo,
  variables de entorno que dejan de usarse: `CONTACTS_DIR`).
- `.env.example`: se quita `CONTACTS_DIR` y se ajustan los textos que hablan del formulario de contacto. Hay un test (`env-docs.test.ts`) que cruza las variables documentadas con el código: se mantiene verde.
- La excepción "Social Engine (`html.se`)" de `AGENTS.md` se reescribe: ahora son dos temas
  (Carbón y Papel) con las reglas de cada uno.

## Fuera de alcance

- Dominio, DNS y variables de Vercel (`SITE_URL`): son del panel; te guío cuando toque. Para que el
  sitemap y los canonicals salgan bien con `engine.nlabs.com.ar`, `SITE_URL` tiene que ser
  `https://engine.nlabs.com.ar`.
- Logo definitivo de Social Engine, cambios de copy, nuevas secciones.
- Vercel: no se despliega nada sin tu confirmación explícita.

## Pruebas

- **Unit** (Vitest): se borran las de demo y contacto; se actualizan `seo.test.ts`
  (solo `/`, llms.txt de Social Engine) y `assistant.test.ts` (sin `page`, derivación a WhatsApp,
  sin menciones a servicios a medida). Nuevo: lógica pura de tema (resolver tema guardado vs
  sistema).
- **E2E** (Playwright, sobre el build): `landing.spec.ts` se borra y lo que sigue valiendo (un solo
  `h1`, un solo `primary`, foco de 2px, sin scroll horizontal en móvil, SEO) se mueve a
  `social-engine.spec.ts`, que ahora prueba `/`. Nuevos:
  - `/social-engine` responde 404 y `/demo/freggiaro`, `/api/contact` ya no existen.
  - Tema: respeta `prefers-color-scheme` (claro/oscuro), el botón alterna y se recuerda al recargar,
    `data-theme` está puesto antes del primer pintado (sin parpadeo).
  - Logo: en claro la flecha usa el degradé y "Social" lleva `.se-grad`.
  - Contraste del texto con degradé ≥ 4,5:1 en ambos temas.
  - Sin JavaScript: la página se ve completa.
- **Visual**: capturas de escritorio y móvil, claro y oscuro, de cada sección, más el logo ampliado.
- Antes de dar por terminado: `npm run lint`, `npm test`, `npm run build` (0 errores de tipos) y
  `npm run test:e2e`.

## Riesgos

- Borrar mucho código: se hace por pasos con `grep` de referencias y build entre pasos.
- El oscuro de Social Engine es un diseño nuevo (la home vieja tenía otras secciones): puede pedir
  ajustes de ojo después de verlo.
- Los links a `/social-engine` ya compartidos darán 404 (decisión tuya).

## Orden de trabajo

1. Rama `feature/pivot-social-engine` desde `main`.
2. Mover Social Engine a `/` y borrar la home vieja, la demo, los proyectos y el contacto; build verde.
3. SEO/GEO, Fidel y docs adaptados a una sola página.
4. Sistema de temas (tokens, script, botón) y revisión visual del oscuro.
5. Logo con degradé.
6. Tests, lint, build, e2e y capturas.
7. `/entregar`: PR con resumen y evidencia; vos aprobás el merge.
