# Plan: Demo de Freggiaro en un modal

Estado: aprobado e implementado

## Objetivo

Que la landing quede más corta, liviana y profesional sin perder la demo interactiva de Freggiaro. Hoy la demo es una sección más de la página: suma una pantalla y media de scroll en escritorio (más en móvil) y lleva el HTML de la home de 60 KB (`main`) a 139 KB, aunque la mayoría de los visitantes nunca la abra.

La propuesta: "Mirá lo que hicimos" muestra solo Reservo y Freggiaro; la tarjeta de Freggiaro abre la demo en un modal, que se carga recién cuando alguien la pide. La demo suma la sección Clientes (cartera de clientes con cuenta corriente).

## Feature a implementar

`feature/demo-freggiaro` (la rama actual, todavía sin mergear): la demo pasa de sección de la home a una página propia `/demo/freggiaro`, prerenderizada, que la home muestra dentro de un `<dialog>` con un `<iframe>` al tocar "Probar la demo". Se agrega la sección Clientes y se borran los proyectos de ejemplo.

## Las tres opciones evaluadas

| | Sección en la home (hoy) | **Modal con la demo liviana (recomendado)** | Portar el frontend real (React) con datos falsos |
| --- | --- | --- | --- |
| Largo de la landing | +1,5 pantallas | Igual que `main` | Igual que `main` |
| Peso de la home | 139 KB de HTML | ~60 KB; la demo carga solo al abrirla | ~60 KB; la demo carga solo al abrirla |
| Peso de la demo | Va siempre | ~80 KB de HTML + 6 KB de JS | React 19, Recharts, Zustand, router: 300 KB o más de JS |
| Fidelidad visual | Réplica (colores, tipografía, estructura) | La misma réplica | Idéntica, con degradados y sombras |
| Mantenimiento | En este repo | En este repo | Atado al repo de Freggiaro: cada cambio allá rompe o desactualiza la demo |
| Riesgo | Ninguno | Bajo | Alto: hay que aislar API, auth, SSE y facturación real del código |

**Recomendación: el modal con la demo liviana.** La réplica actual ya se ve como el sistema real. Portar el frontend de React no cambia lo que ve un visitante en 30 segundos, pero cuesta mucho más y deja a la landing dependiendo de otro proyecto. Si más adelante se quiere la app real, lo correcto es deployarla aparte (por ejemplo, `demo.freggiaro…` con un backend falso) y que el modal la abra igual. Este plan deja ese camino abierto, porque el modal solo conoce una URL.

## Features que va a utilizar

- `src/lib/freggiaro-demo.ts`: datos y reglas de la demo, sin cambios en lo existente.
- `src/components/FreggiaroDemo.astro`: la ventana de la demo. Se reusa entera, solo cambia dónde se monta.
- `src/components/ProjectCard.astro`: la tarjeta del portfolio.
- `src/layouts/Base.astro`: layout de la página nueva (fuentes, tokens, `<head>`).
- `src/lib/seo.ts` y `src/pages/llms.txt.ts`: el link de Freggiaro en `llms.txt`.

## Features que va a modificar

- **`src/pages/index.astro`**: deja de montar `<FreggiaroDemo />` y monta el modal (`<DemoDialog />`).
- **`src/components/ProjectCard.astro`**: prop nueva `demo` (URL de la demo). Con `demo`, la tarjeta sigue siendo un `<a href="/demo/freggiaro">`, así que sin JS lleva a la página. Con JS, el clic abre el modal.
- **`src/content.config.ts`**:
  - `href` vuelve a ser solo URL externa (se saca el ancla).
  - Se agrega `demo`, una ruta interna que empieza con `/`.
- **`src/content/projects/freggiaro.md`**: `demo: /demo/freggiaro` en lugar de `href: "#demo-freggiaro"`.
- **`src/components/FreggiaroDemo.astro`**:
  - Ocupa todo el alto disponible (`height: 100%`), no 760 px fijos.
  - Sale el encabezado de sección ("Probá Freggiaro", texto y CTA); lo pone quien la monta.
  - Se agrega la pestaña Clientes.
- **`src/lib/freggiaro-demo.ts`**: datos y reglas de Clientes.
- **Proyectos de ejemplo**: se borran `ejemplo-gestion-arca.md` y `ejemplo-stock-multisucursal.md`. En producción ya no salían. En dev ahora tampoco, así que "Mirá lo que hicimos" muestra solo Reservo y Freggiaro en todos lados.
- **`src/pages/llms.txt.ts`**: el link de Freggiaro apunta a la URL absoluta de `/demo/freggiaro`. Se saca el caso del ancla.
- **Tests**: `tests/e2e/demo.spec.ts` se reescribe y `landing.spec.ts` se ajusta (ver Verificación).
- `README.md` y `AGENTS.md`: la ruta nueva y la estructura.

## Fuera de alcance

- Portar el frontend de React de Freggiaro o conectarlo a un backend (ver la tabla).
- Presupuestos, Configuración y el resto de las secciones del sistema (ver Preguntas abiertas).
- Un modal para Reservo: su tarjeta sigue llevando a su sitio real, que ya es la mejor demo (ver Preguntas abiertas).
- Medir cuántos abren la demo (analytics).
- Guardar lo que el visitante hace en la demo: todo se pierde al cerrar, como ahora.

## Enfoque

### Página propia: `/demo/freggiaro`

- **`src/pages/demo/freggiaro.astro`**, prerenderizada. Contiene la ventana de la demo a pantalla completa, sin el header ni el footer de la landing.
- **Sola, sirve como página compartible.** Arriba lleva una barra mínima: el logo de engineX con link a la home, la aclaración "Datos ficticios" y el link "Quiero algo así" a `/#contacto`.
- **Dentro del modal la barra se oculta.** La página se carga con `?embed`; ese parámetro lo lee un script inline del `<head>`, sin parpadeo. El modal ya tiene su propio encabezado.
- **`<meta name="robots" content="noindex">`, fuera del sitemap.** Es una demo con datos inventados y no tiene que competir con la home en buscadores. El JSON-LD de la home sigue describiendo a Freggiaro como proyecto.

### Por qué un `<iframe>` y no la demo inline en el modal

- **Peso:** la home no carga nada de la demo hasta que se abre. El `src` del iframe se asigna en el primer clic. Desde ahí queda cacheado y reabrir es instantáneo.
- **Aislamiento:** los tokens de Freggiaro, sus tablas y su script no se mezclan con la página de engineX. Si mañana la demo pasa a ser la app real en otro dominio, solo cambia la URL.
- **Una sola implementación:** el modal y la página compartible son la misma página.
- **Alternativa descartada:** traer el HTML con `fetch` e inyectarlo en el modal. Ahorra el iframe, pero mezcla estilos y obliga a reinicializar el script a mano.

### El modal (`src/components/DemoDialog.astro`)

- **`<dialog>` nativo con `showModal()`:** el navegador hace inerte el resto de la página, cierra con Esc y devuelve el foco a la tarjeta al cerrar.
- **Encabezado** (lado engineX, tokens Carbón):
  - Título "Demo de Freggiaro".
  - Tag "Datos ficticios".
  - Botón secundario "Quiero algo así", que cierra el modal y lleva a `#contacto`.
  - Botón cerrar (X, `aria-label="Cerrar demo"`).
- **Cuerpo:** el iframe con `title="Demo interactiva de Freggiaro"`.
  - Mientras carga, un spinner del sistema; se oculta con el evento `load`.
  - Si falla la carga, un link para abrir la demo en una pestaña aparte.
- **Tamaño:**
  - Escritorio: `min(1200px, 100vw - 64px)` × `min(820px, 100dvh - 64px)`.
  - Móvil (menos de 768 px): pantalla completa.
- **Movimiento:** entra con `ex-pop` (220 ms, `ease-out`) y el fondo con `ex-fade`. Con `prefers-reduced-motion`, solo opacidad. El fondo es un color sólido con opacidad, sin blur.
- **Scroll:** mientras está abierto, la página de atrás no scrollea (`overflow: hidden` en `<html>`).
- **Abrir desde un link:** `/#demo-freggiaro` abre el modal al cargar la home. Así se puede mandar el link por WhatsApp. Al cerrar, se limpia el hash.

### Sección Clientes (cartera de clientes)

Pestaña nueva entre Productos y Ventas, como en el menú real (`nav-items.js`): Dashboard, Productos, Clientes, Ventas, Facturación.

- **Datos** (`clients` en `freggiaro-demo.ts`): 8 clientes ficticios, los mismos nombres de Ventas y el Dashboard. Cada uno tiene:
  - Razón social.
  - CUIT inventado con formato `30-12345678-9`.
  - Condición frente al IVA (Responsable inscripto, Monotributo o Consumidor final).
  - Teléfono.
  - Saldo de cuenta corriente.
  - Fecha de la última compra.
- **Arriba:** tres métricas, que son clientes activos, total a cobrar en cuenta corriente y cantidad de clientes con deuda.
- **Filtros:** búsqueda por nombre o CUIT (reusa `matchesQuery`) y los chips "Todos" y "Con saldo pendiente".
- **Tabla:** cliente, CUIT, condición, saldo (en naranja si debe, "Al día" en verde si no) y última compra.
- **"Registrar pago" en las filas con deuda:** pone el saldo en cero, recalcula las métricas y avisa por `role="status"`. "Reiniciar" deja todo como estaba, igual que en Ventas.
- **Reglas puras con tests:** `filterClients`, `totalDebt`, `formatCuit`.

### Peso esperado

- **Home:** vuelve a unos 60 KB de HTML, igual que `main`, más el script del modal (menos de 1 KB).
- **`/demo/freggiaro`:** unos 85 KB de HTML con Clientes, más 6 KB de JS y 1 KB del emblema. Se carga solo si alguien abre la demo.

## Archivos afectados

- Nuevos:
  - `src/pages/demo/freggiaro.astro`
  - `src/components/DemoDialog.astro`
  - `plans/demo-freggiaro-modal.md`
- Modificados:
  - `src/pages/index.astro`, `src/components/ProjectCard.astro`, `src/components/FreggiaroDemo.astro`
  - `src/lib/freggiaro-demo.ts`, `src/content.config.ts`, `src/content/projects/freggiaro.md`, `src/pages/llms.txt.ts`
  - `tests/unit/freggiaro-demo.test.ts`, `tests/e2e/demo.spec.ts`, `tests/e2e/landing.spec.ts`
  - `README.md`, `AGENTS.md`
- Borrados: `src/content/projects/ejemplo-gestion-arca.md`, `src/content/projects/ejemplo-stock-multisucursal.md`

## Riesgos y supuestos

- **Iframes en Safari de iOS:** el alto con `100dvh` y el scroll dentro del iframe tienen sus mañas. Se prueba en el viewport móvil de Playwright. Antes de mergear conviene probarlo a mano en un iPhone.
- **Foco dentro del iframe:** `showModal()` atrapa el foco en el `<dialog>`, y el iframe es parte de él, así que Tab entra en la demo. Esc dentro del iframe no le llega al `<dialog>` de la página padre. La página de la demo escucha Esc y avisa con `postMessage` (solo mismo origen) para cerrar.
- **Sin JS:** la tarjeta es un link normal a `/demo/freggiaro` y la demo funciona igual, con su barra propia.
- **Reglas del sistema de diseño:** el modal y su encabezado siguen las de engineX. Hay un solo botón `primary` por vista y el modal usa `secondary`. Adentro, la demo sigue con los colores de Freggiaro, como ahora.
- Se supone que el deploy sigue siendo estático más `/api/contact`. La página nueva es estática y no cambia nada en Vercel.

## Verificación

- `npm run lint`, `npm test`, `npm run build` y `npm run test:e2e`.
- Unitarios: `filterClients`, `totalDebt` y `formatCuit`. También que los clientes de Ventas existan en la cartera.
- E2E (con `frameLocator` para lo que pasa dentro del iframe):
  - "Mirá lo que hicimos" tiene exactamente 2 tarjetas, Reservo (link externo) y Freggiaro (abre la demo).
  - La home ya no contiene la demo: no hay `[data-demo]` en el HTML y el iframe no carga nada hasta el primer clic.
  - Clic en Freggiaro: abre el `<dialog>`, carga la demo y funcionan menú, período, búsqueda, facturar y Clientes.
  - Esc y la X cierran el modal y el foco vuelve a la tarjeta. "Quiero algo así" cierra y lleva a `#contacto`.
  - `/#demo-freggiaro` abre el modal al cargar.
  - `/demo/freggiaro` sola funciona, tiene `noindex` y no está en `sitemap.xml`.
  - Móvil: el modal ocupa la pantalla y no hay scroll horizontal ni en la página ni en la demo.
  - Movimiento reducido: el modal entra sin escala.
- Capturas de escritorio y móvil, con el modal abierto y cerrado.

## Preguntas abiertas

Resueltas con las opciones recomendadas: Reservo sigue linkeando a su sitio, se suma solo Clientes (Presupuestos queda afuera) y `/demo/freggiaro` queda como página compartible con su barra propia.

### Ajustes surgidos al construir

- El `<dialog>` necesita `margin: auto` explícito: el reset de Tailwind lo saca y el modal quedaba pegado arriba a la izquierda.
- Los bloques del panel con scroll no se encogen (`flex-shrink: 0`): si no, la tarjeta de la tabla se aplastaba y cortaba filas.
- Las filas de Clientes usan `data-client-row`: `data-client` ya lo usaban los botones "Facturar" de Ventas y el filtro los tomaba como filas.

### Preguntas originales

1. **Reservo:** ¿su tarjeta sigue llevando a mireservo.online (recomendado, es el producto real funcionando) o también querés un modal con una demo?
2. **Más secciones de Freggiaro:** ¿alcanza con sumar Clientes, o agregamos Presupuestos (armar un presupuesto y convertirlo en venta)? Suma unos 10 KB a la demo y no a la home.
3. **Página compartible:** ¿te sirve tener `/demo/freggiaro` como link para mandar a clientes por WhatsApp? Si no, la dejamos solo para el modal (sigue existiendo, pero sin barra propia).
