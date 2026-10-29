# Plan: Mejora visual y de UX de la landing

Estado: aprobado; Fase 1 implementada

## Objetivo

Que la landing convierta más visitas en consultas sin perder lo que ya funciona: velocidad, accesibilidad y la identidad del sistema de diseño de engineX. Hoy la página es correcta pero plana para un dueño de pyme:

- No dice para quién es.
- No muestra prueba social.
- WhatsApp, el canal que más usa ese cliente, aparece recién al final.
- En móvil mide 6.000 px; los 6 servicios en tarjetas ocupan un cuarto de la página.
- La demo de Freggiaro, el mejor argumento de venta, está escondida en una tarjeta.

El plan combina dos miradas:

- **`ui-ux-pro-max`:** estructura de landing, prueba social antes del CTA, formularios, checklist de entrega.
- **`emil-design-eng`:** qué animar, para qué, con qué curva y cuánto tiempo; y qué no animar.

## Feature a implementar

`feature/mejora-ux-ui`, en dos fases:

1. **Fase 1 (sin contenido nuevo del equipo):**
   - Hero en CSS y con CTA a WhatsApp.
   - Señales de confianza.
   - "Demo" en el menú.
   - Servicios compactos en móvil y con jerarquía.
   - Tarjetas de proyecto más claras.
   - Preguntas frecuentes.
   - Contacto más directo.
   - Barra de WhatsApp en móvil.
   - Ajustes de movimiento.
2. **Fase 2 (con contenido del equipo):** testimonios, resultados medibles en los casos, "Quiénes somos" y datos del footer. Ver Preguntas abiertas.

## Qué se descartó de las recomendaciones automáticas

`ui-ux-pro-max --design-system` propuso glassmorphism, fondo claro con azul de confianza y revelados al hacer scroll con GSAP. **Se descarta todo eso.** El sistema de diseño de engineX (`AGENTS.md`) fija el tema Carbón y prohíbe el vidrio, los degradados y las animaciones de entrada al scrollear, y el repo manda.

De esa salida se toma solo:

- El patrón de secciones con CTA arriba y abajo.
- La prueba social antes del CTA final.
- La tipografía, que coincide: Plus Jakarta Sans.
- La checklist de entrega.

## Features que va a utilizar

- Tokens y clases del sistema: `src/styles/tokens.css` y `src/styles/global.css` (`ex-btn`, `ex-card`, `ex-tag`, `ex-pop`, `ex-fade`).
- Componentes del sistema: `Button`, `Tag`, `ProjectCard`, `TextField`, `Logo`.
- Copy y número de WhatsApp: `src/lib/content.ts` y `src/lib/site.ts` (`whatsapp.url`).
- El modal de la demo: `DemoDialog` y la API `[data-opens-demo]`.
- JSON-LD en `src/lib/structured-data.ts`, para sumar `FAQPage`.

## Features que va a modificar

- `Hero.astro`: copy, CTAs, señales de confianza, arte en móvil y animación en CSS (sale `motion`).
- `Header.astro` y `src/lib/site.ts`: ítem "Demo" que abre el modal.
- `Services.astro`: jerarquía (dos servicios destacados) y versión compacta en móvil.
- `ProjectCard.astro` y `src/content/projects/*.md`:
  - Etiqueta en la captura ("Demo interactiva" o "Sitio en vivo").
  - Hover con la captura que sube.
  - En Fase 2, una línea de resultado.
- `Process.astro`: CTA al final.
- `ContactForm.astro`: WhatsApp como opción principal y se quita la promesa de 24 h repetida.
- `DemoDialog.astro`: salida animada y aparición suave del iframe.
- Componentes nuevos: `Faq.astro` y `MobileWhatsappBar.astro`.
- `src/lib/content.ts`: copy del hero, de las señales de confianza y de las preguntas frecuentes.
- `src/lib/structured-data.ts`: grafo `FAQPage`.
- `package.json`: se quita la dependencia `motion`.
- Tests: `landing.spec.ts` (hero, CTAs y móvil), `demo.spec.ts` (ítem Demo) y unitarios de `structured-data`.

## Fuera de alcance

- Páginas por servicio y por caso de estudio, blog y SEO de contenido: van en un plan aparte.
- Tema claro, otra tipografía, ilustraciones o fotos de stock.
- Carrusel de testimonios con rotación automática: si hay pocos testimonios, van fijos en una grilla.
- Analytics: también van en otro plan, aunque conviene hacerlos antes de medir esta mejora.

## Enfoque

### 1. Hero: decir para quién es y llevar a WhatsApp

| Before | After | Why |
| --- | --- | --- |
| "Software que empuja tu negocio" | Titular con destinatario y resultado, por ejemplo *"Sistemas de gestión y facturación ARCA para tu negocio"*. "Empuja" pasa al subtítulo | En 3 segundos el visitante tiene que saber si esto es para él |
| Primario "Contanos tu proyecto", que baja al formulario | Primario "Escribinos por WhatsApp", que abre `wa.me` con un texto prearmado | Es el canal que más usa una pyme argentina: un clic en vez de 3 campos |
| Secundario "Ver proyectos" | Secundario "Probá la demo", que abre el modal de Freggiaro | Mostrar en vez de prometer: la demo convence más que una lista de proyectos |
| Nada debajo de los CTAs | Tres señales con ícono `circle-check`: "Propuesta sin cargo", "Respuesta en 24 h" y "Facturación ARCA integrada" | Saca objeciones donde se decide el clic |
| En móvil el arte del hero se oculta y la primera pantalla es solo texto | Arte a 180 px de alto en móvil, debajo de las señales (`aria-hidden`) | Da identidad sin empujar los CTAs fuera de la primera pantalla |
| Hero animado con Motion (24 KB de JS) y `.hero-pending` que esconde el `h1` hasta que carga | `@keyframes ex-rise` en CSS: `opacity` 0→1 y `translateY(8px)`→0, 280 ms, `--ease-out`, escalonado de 60 ms con `animation-delay` | Mismo efecto con cero JS. Arranca en el primer cuadro y no retrasa el LCP con red lenta |
| Movimiento reducido manejado en JS | En `prefers-reduced-motion`, solo `opacity` con `ex-fade` | Sigue la regla del sistema: sin desplazamientos |

Sigue habiendo un solo `display-xl` y un solo `primary` por vista. El botón del header pasa a `secondary` "WhatsApp" para no competir con el primario.

### 2. Header: la demo a un clic

- Nuevo ítem "Demo" en el menú, antes de "Contacto". Usa `[data-opens-demo]`, así que abre el modal y sin JS lleva a `/demo/freggiaro`.
- En el menú móvil, el ítem "Demo" cierra el panel antes de abrir el modal.

### 3. Servicios: jerarquía y menos scroll en móvil

| Before | After | Why |
| --- | --- | --- |
| 6 tarjetas iguales en grilla de 3×2 | Dos destacadas, Gestión y Facturación ARCA, ocupan 2 columnas con una línea más de detalle. Las otras 4 van en tarjetas chicas | Son lo que más venden; la jerarquía guía la lectura |
| En móvil, 6 tarjetas apiladas de unos 230 px (≈1.400 px de scroll) | En móvil, filas sin caja: ícono, título y una línea, separadas con borde `line` (≈700 px) | La mitad del scroll con la misma información |
| El `h2` usa `display` y las demás secciones `heading-2` | Todas las secciones con `heading-2` | Hoy la segunda sección pesa más que el resto sin motivo |
| Tarjetas estáticas | Siguen estáticas (sin hover) hasta que existan las páginas por servicio | Un hover en algo no clickeable promete una acción que no existe |

### 4. Proyectos: que se entienda qué hace cada tarjeta

| Before | After | Why |
| --- | --- | --- |
| Las dos tarjetas se ven iguales; una abre un sitio externo y la otra un modal | `Tag` sobre la captura: "Demo interactiva" en Freggiaro y "Sitio en vivo" en Reservo | El visitante sabe qué va a pasar antes de tocar |
| En hover solo cambia el color del borde | Además, la captura sube con `translateY(-4px)` en 220 ms `--ease-out`, dentro de `(hover: hover) and (pointer: fine)`. Con movimiento reducido no hay desplazamiento | Refuerza que la tarjeta se puede tocar. Es una interacción ocasional, así que justifica el movimiento |
| El resumen describe lo que hace el sistema | En Fase 2, una línea de resultado con dato, por ejemplo "Dejaron las planillas en 2 semanas" | El encabezado de la sección promete "lo que cambió para cada cliente" y hoy no lo cumple |

### 5. Cómo trabajamos

- Al final de los 4 pasos, un CTA secundario: "Empezá por el paso 1: escribinos". Lleva a WhatsApp con la flecha, porque sale del sitio.
- En Fase 2, opcional: el plazo típico en cada paso (por ejemplo "1 semana"), si el equipo lo puede sostener.

### 6. Preguntas frecuentes (nuevo, antes de Contacto)

- 5 o 6 preguntas en `<details>`/`<summary>` nativos: accesibles por teclado, sin JS y con buen contenido para GEO.
  - ¿Cuánto cuesta un sistema? (rango o "desde", ver Preguntas abiertas)
  - ¿Cuánto tarda?
  - ¿Qué pasa si después necesito cambios?
  - ¿Los datos son míos?
  - ¿Se conecta con ARCA y Mercado Pago?
  - ¿Trabajan con negocios de todo el país?
- Las preguntas salen de `src/lib/content.ts` y alimentan también el JSON-LD `FAQPage` y `/llms.txt`.
- **Movimiento (según `emil-design-eng`):**
  - Abrir una pregunta es ocasional y lo dispara el usuario.
  - El ícono `chevron-down` rota 180° en 180 ms con `--ease-out`.
  - La respuesta aparece con `opacity` 0→1 en 160 ms.
  - **No se anima la altura**: el sistema solo permite `transform` y `opacity`, y animar el alto re-maqueta la página.

### 7. Contacto: dos caminos claros

| Before | After | Why |
| --- | --- | --- |
| La tarjeta de WhatsApp es chica y el formulario domina | Dos opciones lado a lado: "Escribinos por WhatsApp" (tarjeta grande, la más rápida) y el formulario ("Preferís mail") | Que cada uno elija; WhatsApp es la vía de menor fricción |
| "Te respondemos en 24 h" aparece dos veces | Una sola vez, junto al botón de envío | Repetir le resta peso |
| Se mantiene | Labels visibles, error junto al campo, estado de envío y de éxito | Ya cumple las pautas de formularios de `ui-ux-pro-max` |

### 8. Barra de WhatsApp en móvil (nuevo)

- Una barra fija abajo, solo en móvil (`max-width: 767px`): "¿Hablamos? Escribinos por WhatsApp". Respeta `env(safe-area-inset-bottom)`.
- Aparece cuando el hero sale de la pantalla (`IntersectionObserver`) y se oculta cuando el formulario de contacto está visible, para no duplicar.
- Entra con `translateY(100%)`→0 y `opacity` en 200 ms `--ease-out`. Sale en 150 ms, más rápido que la entrada. Con movimiento reducido, solo `opacity`.
- **Ojo con la regla del sistema:** no es contenido que se revela al scrollear, es un control que cambia de estado. Igual va como pregunta abierta.

### 9. Movimiento: resumen de decisiones (`emil-design-eng`)

| Before | After | Why |
| --- | --- | --- |
| Hero animado con Motion en JS | Keyframes en CSS (ver punto 1) | Las animaciones en CSS no dependen del hilo principal y no cuestan JS |
| El modal de la demo se cierra de golpe | Salida en 150 ms: `opacity` 1→0 y `scale(1)`→`scale(0.98)`, con `transition` y `allow-discrete` sobre `display` y `overlay`, más `@starting-style` para la entrada | La salida es más rápida que la entrada (220 ms) pero no instantánea. El modal se queda centrado |
| El iframe aparece de golpe al cargar | `opacity` 0→1 en 160 ms al dispararse `load`, mientras el spinner se desvanece | Evita el salto de "Cargando…" a la demo |
| Tarjetas de proyecto: solo cambia el borde | Captura con `translateY(-4px)` en hover (ver punto 4) | Refuerza que se puede tocar |
| FAQ: no existe | Chevron y opacidad, sin animar la altura (ver punto 6) | Confirma la acción sin re-maquetar |
| Sin barra de WhatsApp | Entrada de 200 ms y salida de 150 ms (ver punto 8) | Mantiene la continuidad espacial: entra y sale por abajo |

Lo que **no** se anima, a propósito:

- **Revelados al hacer scroll:** los prohíbe el sistema y demoran el contenido.
- **Las pestañas y el marcador del gráfico de la demo:** se usan muchas veces, con teclado, y el gráfico muestra datos.
- **El menú del header:** se queda con el `ex-pop` actual.
- **Contadores animados de números:** son decorativos y no aportan nada a una pyme.

### Checklist de entrega (`ui-ux-pro-max` + sistema de engineX)

- Contraste de 4,5:1 como mínimo en todo el texto nuevo, incluidos `ink-muted` sobre `surface-raised` y el texto de los `Tag` sobre las capturas.
- Áreas táctiles de 44×44 px como mínimo y 8 px de separación.
- Foco de 2 px con `focus-ring` en todo lo nuevo: el ítem Demo, `summary`, la barra de WhatsApp y las opciones de contacto.
- Hover solo con `(hover: hover) and (pointer: fine)`.
- Movimiento reducido: sin desplazamientos ni escalas.
- Sin scroll horizontal y sin saltos de layout a 375, 768, 1024 y 1440 px. La barra de WhatsApp reserva su espacio con `padding-bottom` en el `body` para no tapar el footer.
- Íconos SVG de Lucide; nada de emojis.
- La flecha solo en acciones que salen del sitio (WhatsApp, Reservo); no en el envío del formulario ni en "Probá la demo", que abre un modal.

## Archivos afectados

- Nuevos:
  - `src/components/Faq.astro`
  - `src/components/MobileWhatsappBar.astro`
  - `plans/mejora-ux-ui.md`
- Modificados:
  - `src/components/Hero.astro`, `Header.astro`, `Services.astro`, `ProjectCard.astro`, `Projects.astro`, `Process.astro`, `ContactForm.astro`, `DemoDialog.astro`
  - `src/pages/index.astro`, `src/lib/content.ts`, `src/lib/site.ts`, `src/lib/structured-data.ts`, `src/lib/seo.ts` (FAQ en `llms.txt`)
  - `src/content/projects/*.md`, `src/styles/global.css` (keyframes `ex-rise`), `package.json`
  - `tests/e2e/landing.spec.ts`, `tests/e2e/demo.spec.ts`, `tests/unit/seo.test.ts`
  - `README.md` y `AGENTS.md`: "el único momento es el hero" sigue valiendo; se documenta la barra de WhatsApp si se aprueba

## Riesgos y supuestos

- **Dominio:** en el sitio publicado en `vercel.app` siguen faltando el canonical, el sitemap (da 404) y `og:image`, y en `main` `DEFAULT_SITE_URL` está vacío. Si el dominio propio está en Vercel, falta confirmar que `SITE_URL` esté cargada en las variables de entorno del proyecto (Production), si no, todo lo de SEO sigue apagado.
- **Copy del hero:** el titular nuevo es una propuesta; el equipo puede preferir otro. El criterio es que diga para quién es.
- **Señales de confianza:** "Respuesta en 24 h" solo se publica si el equipo la puede cumplir.
- **Quitar Motion:** sin JS en el hero no hay respaldo de 2,5 s; si el CSS no carga, el hero se ve igual, sin animación.

## Verificación

- `npm run lint`, `npm test`, `npm run build` y `npm run test:e2e`.
- E2E nuevos y ajustados:
  - El hero tiene un solo `primary` que apunta a `wa.me` y el secundario abre el modal.
  - El `h1` se ve sin JS (`javaScriptEnabled: false`) y termina en `opacity: 1` con `transform: none`.
  - El ítem "Demo" del menú abre el modal, en escritorio y en el menú móvil.
  - Las preguntas frecuentes se abren con teclado (Enter o Espacio sobre `summary`).
  - La barra de WhatsApp en móvil aparece al pasar el hero, se oculta en Contacto y no tapa el footer.
  - El modal se cierra con animación y el foco vuelve a la tarjeta.
  - Con movimiento reducido no hay `transform` en hero, tarjetas ni barra.
  - Sin scroll horizontal a 375 px; altura total en móvil menor a la actual (6.051 px).
- Unitarios: el JSON-LD incluye `FAQPage` con las mismas preguntas que la página.
- Medición antes y después con el script de 4G lento y CPU ×4: tiempo hasta ver el `h1`, LCP y JS transferido (hoy 1,16 s, 0,66 s y 24 KB).
- Capturas a 375, 768, 1024 y 1440 px, con el modal abierto y cerrado.

## Decisiones y ajustes de la Fase 1

- **Titular aprobado:** "Sistemas de gestión y facturación ARCA para tu negocio". Va en `display` (56 px) con `text-wrap: balance`, no en `display-xl`: en la columna del hero el titular largo quedaba en 5 líneas a 72 px.
- **Arte del hero reemplazado:** las torres con flechas se cambiaron por capturas reales: el tablero de Freggiaro y el celular de Reservo (recortado de `reservo.png`, en `src/assets/hero/`). Son decorativas y no linkean: el protagonista es engineX como agencia, no un producto, así que el hero no promociona la demo (el secundario vuelve a ser "Ver proyectos"). La demo sigue a mano desde el menú y la tarjeta del portfolio. Entran con el mismo momento del hero, con 60 ms de diferencia por pieza.
- **Precio "desde":** aprobado publicarlo. Queda en `PRICE_FROM` (`src/lib/content.ts`) a la espera del monto; vacío, la respuesta no da cifra.
- **Barra de WhatsApp en móvil:** aprobada como excepción a "sin animaciones al hacer scroll".
- **Testimonios y Fase 2:** se configuran más adelante. Mientras tanto, la barra "Confían en nosotros" (que llegó desde `main` con Cabañas La Granja) ya da la prueba social básica.
- **Medición** (4G lento, CPU ×4, mediana de 3 corridas contra `main` local): LCP de 1,83 s a 1,12 s, DOMContentLoaded de 1,49 s a 0,97 s y JS de la home de 63 KB a 0.
- **Alto en móvil:** sube a unos 8.000 px por el visual del hero y las preguntas frecuentes, aunque Servicios baja a la mitad. Se acepta porque las dos piezas suman conversión; el criterio de "menor que la actual" queda descartado.

## Preguntas abiertas (originales)

1. **Titular:** ¿te sirve *"Sistemas de gestión y facturación ARCA para tu negocio"* o preferís otro ángulo, como reservas o pymes en general?
2. **Precios:** ¿publicamos un "desde" o un rango en las preguntas frecuentes? Es la pregunta que más frena y la que más citan los buscadores con IA.
3. **Barra de WhatsApp en móvil:** ¿la aprobamos como excepción a "sin animaciones al hacer scroll" (es un control, no contenido), o la dejamos siempre visible y sin animación?
4. **Fase 2:** ¿pueden conseguir 1 o 2 testimonios (frase, nombre y negocio) y un resultado con número por caso, fotos y nombres para "Quiénes somos", y ubicación, mail y redes para el footer?
