# Plan: landing de Social Engine (`/social-engine`)

## Contexto

engineX lanza **Engine**, cuyo producto estrella es **Social Engine**: una herramienta para organizar el marketing en redes con las mismas funciones que heyMark (sincronización, planificación en equipo, publicación programada, bandeja de comentarios y mensajes, automatizaciones, analítica y reportes, asistente con IA y conexión MCP con Claude y ChatGPT). Al equipo le gustó la landing de Xubio y quiere presentar el producto con la misma forma: estructura, transiciones y tipografía.

Decisiones ya tomadas por el usuario:
- La landing es una **ruta dentro de este repo**.
- La marca **se deriva de engineX**.
- Por ahora **solo la landing**; el producto va en otro plan.
- **Sin precios**: lista de espera y "Hablemos".

## Qué tomamos de Xubio (medido en xubio.com/ar el 30/10/2026)

Xubio también está hecho en Astro. Usa CSS propio, sin librerías de animación ni de scroll.

| Patrón | Xubio | Cómo lo portamos |
| --- | --- | --- |
| Tipografía | Satoshi 400/500/700, títulos centrados en 500, hero `clamp(36px, 4.2vw, 56px)` con interletrado de −1px, secciones `clamp(24px, 3vw, 44px)` | Plus Jakarta Sans (la de engineX), con la misma escala fluida y el mismo interletrado. Títulos en 600, más suaves que el 800 de la home. |
| Aparición al scrollear | `.reveal`: opacidad + `translateY(14px)`, `.8s cubic-bezier(.2,.7,.2,1)`. `.stagger` con hijos a 50, 140 y 230 ms. | Igual, pero arranca antes de que la sección entre en pantalla y sin JS todo se ve. Así evitamos los huecos en blanco que tiene Xubio. |
| Palabra que rota en el hero | `wordCycle`: 7,5 s, `cubic-bezier(.6,.05,.3,1)`, blur de 4px + 22px de desplazamiento, con degradé que se desplaza (`chroma-sweep`, 5 s) | 4 verbos: Planificá, Publicá, Respondé y Medí. Solo `transform` y `opacity`, sin blur. El `h1` tiene un texto fijo para lectores de pantalla. |
| Título que sube | `wordRise`: `translateY(110%)` a 0 en .9 s, con retrasos de .15 y .28 s | Igual. |
| Fondo aurora | 4 manchas con `heroDrift` (desplazamiento + escala) | Reusamos el patrón de brillos del hero actual: se pausan fuera de pantalla y quedan quietos con movimiento reducido. |
| Tarjetas que levitan | `dashLift`: −6px, ida y vuelta | Igual, sobre las tarjetas flotantes del mockup. |
| Línea conectora | SVG con `stroke-dashoffset` atado al scroll, trazo de 3,5px, `vector-effect: non-scaling-stroke` | Igual, con el degradé de la marca. |
| Marquee | `marqueeScroll` a −50% | Para las redes con las que conecta. |
| Hover de tarjeta | `transform .25s cubic-bezier(.22,1,.36,1)` | Igual, solo con mouse. |

Las mejoras salen de la sección 2 del análisis: demo con números sanos, CTA secundario "Ver cómo funciona", degradé acotado, más contraste, preguntas frecuentes y nada que tape el hero.

## Sistema visual de Social Engine (excepción acotada a `.se`)

Es la misma clase de excepción que ya tiene la demo de Freggiaro, acotada a una clase.

- **Tema Papel**, el claro del sistema de engineX. Los tokens salen del PDF: `surface #f4f4f2`, `surface-raised #fff`, `surface-inset #ecece8`, `line #dcddd8`, `line-strong #80847c`, `ink #0e1116`, `ink-muted #5b616b`, `accent-ink #b83510`, `accent-hover #e64a1f`, `accent-soft #ffe5dc`, `focus-ring #b83510`, `success #17793c` y `danger #b4123f`. Se redefinen como variables dentro de `.se`, así las utilidades de Tailwind (`bg-surface`, `text-ink`…) funcionan sin cambios.
- **Degradé acotado:** ignite → magenta → violeta, en vez del arcoíris de Xubio. Se usa solo en:
  - la palabra que rota;
  - el borde del mockup y de la caja de cierre;
  - la línea conectora;
  - el brillo del plan destacado.

  En texto, las paradas son oscuras para que el contraste supere 3:1 sobre papel. Lo verificamos.
- **Componentes:**
  - Botones en píldora: se reusa `Button` con una variante de radio.
  - Navbar en píldora flotante de vidrio claro.
  - Input con el botón adentro.
  - Tarjetas de `radius-xl` con sombra difusa, que solo se permite dentro de `.se`.
- Copy con voseo, en sentence case. La marca se escribe "Social Engine" y lleva "un producto de engineX" en el footer.
- **Logo provisorio:** el isotipo de engineX (`MARK_INK` y `MARK_ACCENT` de `logo-paths.ts`) más "Social Engine" escrito en Jakarta 700. El logo de engineX no se modifica. El logo definitivo lo diseñan ustedes.

## Secciones (en orden)

1. **Barra de anuncio:** "Social Engine está en beta privada · Sumate a la lista", con una línea fina de degradé abajo.
2. **Navbar en píldora:** Producto, Cómo funciona y Preguntas. A la derecha, "engineX" (link a `/`) y el único botón primario, "Sumarme".
3. **Hero:**
   - Eyebrow: "Marketing en redes, en un solo lugar".
   - Título: "{verbo que rota} tus redes sin saltar de app en app".
   - Bajada corta, un email con el botón adentro (lista de espera) y "Ver cómo funciona" como acción secundaria.
   - Aurora de fondo.
   - Mockup del calendario hecho en HTML y CSS (no son capturas), con:
     - el borde de degradé;
     - tarjetas flotantes ("Próximo posteo · Instagram · 18:30" y "12 comentarios respondidos hoy");
     - un selector de período.
   - Todos los números son positivos.
4. **Redes:** marquee con Instagram, Facebook, TikTok, LinkedIn y YouTube, más "Claude y ChatGPT vía MCP". Son nombres en etiquetas mono, sin logos de terceros.
5. **Módulos** (equivale a "Soluciones" de Xubio):
   - Lista vertical de tabs accesibles (`role="tablist"`, se navega con las flechas) con 7 módulos: Sincronización, Planificación en equipo, Publicación programada, Bandeja de entrada, Automatizaciones, Analítica y reportes, Asistente con IA y MCP.
   - El módulo activo se marca con una barra de color y muestra su descripción.
   - A la izquierda, el mockup de cada módulo, con flechas y puntos.
   - La línea conectora baja desde el hero hasta acá.
6. **Cómo funciona:** cuatro pasos (Conectá, Planificá, Publicá y respondé, Medí) con aparición escalonada. Reemplaza la sección de números de Xubio, porque antes del lanzamiento no tenemos cifras reales y no vamos a inventarlas.
7. **Beneficios:** el título con una palabra en degradé y tres tarjetas con ícono de lucide, unidas por una línea.
8. **Planes sin precio:**
   - Creador: 1 marca.
   - Equipo: varias marcas y acceso por área. Es el destacado, con el brillo.
   - Agencia: a medida.
   - Garantías: "sin tarjeta" y "te avisamos antes de cobrar". Los CTA son "Sumarme a la lista" o "Hablemos por WhatsApp".
9. **Preguntas frecuentes:** el mismo patrón que `Faq.astro`, con sus propios datos.
10. **Cierre:** caja con borde de degradé: "Sé de los primeros en usar Social Engine", con otro email.
11. **Footer** propio y corto, con "Un producto de engineX" y un link a `/`.

## Implementación

**Rama:** `feature/social-engine`. Antes de empezar, este plan se copia a `plans/social-engine.md`.

### Página y estilos
- `src/pages/social-engine.astro`: arma las secciones.
- `src/layouts/Base.astro`: suma las props `theme?: "carbon" | "papel"` y `siteName`. Con ellas cambian `color-scheme`, `theme-color` y la clase del `<html>`. La home no cambia.
- `src/styles/social-engine.css` (solo lo importa esa página):
  - tokens de Papel dentro de `.se`, el degradé, la sombra y la escala tipográfica fluida;
  - las animaciones (`se-reveal`, `se-stagger`, `se-word-cycle`, `se-rise`, `se-lift`, `se-marquee`);
  - el bloque de `prefers-reduced-motion`.
- `src/components/social-engine/`: un componente por sección, más los mockups (`MockCalendar`, `MockInbox`, `MockAnalytics`, `MockAutomations`…) y `SocialEngineLogo.astro`. Ningún archivo supera 300 líneas.
- `src/lib/social-engine-content.ts`: todo el copy (módulos, pasos, beneficios, planes, preguntas frecuentes), igual que hoy `content.ts`.
- **Un solo script chico, sin librerías** (`src/scripts/social-engine.ts`). Se encarga de:
  - el `IntersectionObserver` de las apariciones, con `rootMargin` positivo para arrancar antes;
  - pausar la aurora y el marquee fuera de pantalla;
  - la línea conectora atada al scroll con `requestAnimationFrame`;
  - los tabs de módulos;
  - el envío de la lista de espera.

  Las clases que ocultan contenido se aplican solo si `html.js` está presente.

### Lista de espera (backend)
- `src/lib/waitlist.ts`: validación pura del email, el origen (`hero` o `cierre`) y el honeypot.
- `src/lib/contact-store.ts`:
  - `FileContactStore` y `RedisContactStore` pasan a ser genéricos (`JsonRecordStore<T>`), con `dir`, `key` y el prefijo del límite como parámetros. Se mantienen los nombres actuales como alias.
  - Se agrega `waitlistBackendFromEnv`. Usa la lista Redis `waitlist` y la carpeta `WAITLIST_DIR` (por defecto `data/waitlist`). En Vercel sin Redis responde 500, igual que el contacto.
- `src/lib/waitlist-server.ts`: reusa `readBodyWithLimit`, `clientIp` y el mismo esquema de respuestas que `handleContact` en `contact-server.ts`.
- `src/pages/api/waitlist.ts` con `prerender = false`.
- Se actualizan `.env.example` (`WAITLIST_DIR`) y `playwright.config.ts` (carpeta de e2e). También se confirma que `data/` esté en `.gitignore`.

### SEO y la home
- El sitemap suma `/social-engine` (`src/routes/sitemap.xml.ts`) y `/llms.txt` le agrega una sección.
- JSON-LD `SoftwareApplication` sin `offers`, porque no hay precios (`structured-data.ts`).
- La home suma un link a Social Engine en el footer. No se toca nada más.

### Documentación
- `AGENTS.md` y `README.md`: la excepción `.se` (tema Papel, degradé acotado, apariciones al scrollear y animaciones de más de 300 ms solo ahí), la estructura nueva y `WAITLIST_DIR`.

## Verificación

- `npm run lint`, `npm test`, `npm run build` (0 errores de tipos) y `npm run test:e2e`.
- **Unitarios:**
  - validación de la lista de espera;
  - el handler: 415, 413, 400, honeypot, 429, 500 y 200;
  - el store genérico con `dir` y `key`;
  - el sitemap y `llms.txt` incluyen `/social-engine`;
  - JSON-LD de `SoftwareApplication`.
- **E2E** (`tests/e2e/social-engine.spec.ts`):
  - Hay un solo `h1` con un texto fijo para lectores de pantalla y los 4 verbos.
  - Hay un solo botón primario visible en el hero.
  - Al anotarse, se crea un `.json` en la carpeta de e2e y aparece el mensaje de éxito. Un email inválido muestra el error junto al campo.
  - En los tabs de módulos, las flechas cambian `aria-selected` y el panel visible.
  - Sin JS (`javaScriptEnabled: false`), todas las secciones se ven.
  - Con `reducedMotion: "reduce"`, la palabra, la aurora y el marquee quedan quietos y el contenido se ve sin desplazamiento.
  - La línea conectora avanza al scrollear.
  - El foco de los controles es de 2px sólido con 2px de separación.
  - El footer de la home linkea a `/social-engine`.
- **Visual:** capturas en escritorio y en móvil (iPhone 12 Pro) para comparar con Xubio.
- **Contraste:** degradé en texto ≥3:1 y texto chico ≥4,5:1 sobre papel.
- **Velocidad:** el LCP se mide como en `reestructura-agencia.md` (4G lento, CPU ×4) y el objetivo es menos de 2 s. Se mide además cuánto JS carga la página.

## Pendiente de ustedes (no bloquea)

- Nombre del asistente con IA. "Mark" es de heyMark: mientras tanto va "el asistente".
- Logo definitivo de Engine y de Social Engine.
- Fecha de lanzamiento y precios, que se sumarían a la sección de planes.
