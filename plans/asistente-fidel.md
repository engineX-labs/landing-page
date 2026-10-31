# Plan: asistente de IA "Fidel" (engineX y Social Engine)

## Contexto

Queremos un asistente conversacional, **Fidel**, en las dos páginas (`/` y `/social-engine`). Usa la API de **Gemini**. Decisiones ya tomadas por el usuario:

- Va en **las dos páginas**.
- Se llama **Fidel**.
- El **límite de gasto en Google** lo configura el usuario por fuera; en código nos encargamos de los límites propios.

Restricción central: **la API key nunca llega al navegador** y **nadie puede gastarnos los tokens**. No hace falta un backend aparte: la landing ya tiene rutas server (`POST /api/contact`, `POST /api/waitlist`), que en Vercel son funciones serverless. Fidel suma una más.

```
Navegador (widget) → POST /api/assistant (Vercel) → Gemini
                      └ acá viven la key y todos los límites
```

## Alcance

**Incluye**
- Ruta `POST /api/assistant` que llama a Gemini y aplica los límites.
- Widget de chat flotante en las dos páginas.
- Un system prompt por página, armado con el copy que ya existe.
- Tests unitarios y e2e, y documentación (`README.md`, `AGENTS.md`, `.env.example`).

**No incluye**
- Guardar conversaciones (no se persiste nada en el servidor).
- Herramientas, acceso a datos o acciones del asistente: solo responde texto.
- Panel de métricas.
- Cambiar el proveedor por otro que no sea Gemini.

## Decisiones técnicas

### Gemini sin SDK
Se llama por REST con `fetch` a `generateContent` (`https://generativelanguage.googleapis.com/v1beta/models/<modelo>:generateContent`), con la key en el header `x-goog-api-key`. Así no sumamos dependencias y el cliente es fácil de reemplazar en los tests.

- **Modelo:** variable `GEMINI_MODEL`, con un modelo flash de bajo costo por defecto. Confirmo el nombre vigente contra la documentación de Google antes de fijarlo.
- **Respuesta completa, no streaming.** Es más simple, deja contar los tokens exactos (`usageMetadata`) y no complica los tests. Si después se siente lento, pasamos a streaming en otro plan.

### Defensas en código (todas en el servidor, en este orden)

| # | Defensa | Detalle |
| --- | --- | --- |
| 1 | Forma del pedido | JSON con `{ page, messages, company }`. Tamaño máximo del body, igual que en contacto. `page` solo acepta `"enginex"` o `"social-engine"`. |
| 2 | Honeypot | Si `company` viene lleno, responde 200 con un texto genérico y no llama a Gemini. |
| 3 | Límites por mensaje | Máximo **500 caracteres** por mensaje del usuario y **6 turnos** de historial. Lo que sobre se descarta desde lo más viejo. |
| 4 | Roles | El cliente solo puede mandar mensajes `user` y `assistant`, alternados. Nunca un rol `system`: las instrucciones salen del servidor. |
| 5 | Límite por IP | Ventana deslizante con Upstash (`@upstash/ratelimit`, ya instalado): **12 mensajes cada 10 minutos** por IP, con su propio prefijo (`enginex:assistant`). Se reusa `clientIp`. |
| 6 | **Tope global diario** | Contador atómico en Redis (`INCR` con expiración al fin del día UTC). Por defecto **300 mensajes por día**, configurable con `ASSISTANT_DAILY_LIMIT`. Al llegar, Fidel deja de llamar a Gemini hasta el día siguiente. Es la defensa que pone el techo duro al gasto. |
| 7 | Salida acotada | `maxOutputTokens` en **400** y temperatura baja. Con las defensas 3 y 6, el costo máximo por día queda acotado y predecible. |
| 8 | Timeout | La llamada a Gemini se corta a los 15 s. |

Sin Redis **en Vercel**, el asistente no se habilita (responde `503`), igual que el contacto: preferimos no tener asistente a tenerlo sin tope. Fuera de Vercel sin Redis (desarrollo y servidor propio) se usa un contador diario en memoria, que vale por proceso. Fuera de Vercel la IP se puede falsificar, así que el límite por IP solo se activa en Vercel con Redis, como hoy; el tope global sí funciona siempre que haya Redis.

### Cuando no se puede responder
Si se agotó el límite por IP, el tope diario, el servicio no está disponible o Gemini falla, el endpoint responde con un código claro y el widget muestra un mensaje amable con el botón de **WhatsApp**. Nadie se queda sin salida. Los mensajes no mencionan cifras del límite.

### Seguridad del contenido
- El system prompt va en el campo `systemInstruction` de Gemini; los mensajes del usuario van siempre como `user`.
- El asistente no tiene herramientas ni acceso a datos, así que lo peor que puede pasar con un intento de inyección es una respuesta fuera de tema.
- Las respuestas se muestran con `textContent`, nunca como HTML, para evitar XSS.
- No se registra el contenido de las conversaciones en logs. La key nunca se imprime ni se devuelve en errores.
- Los errores de Gemini se traducen a un código genérico: no se reenvía el detalle de Google al cliente.

### Personalidad y contenido de Fidel
- Voseo, primera persona del plural, mensajes cortos, sin emojis. Se presenta como **asistente de IA de engineX** (no se hace pasar por una persona).
- **engineX:** servicios, proceso, preguntas frecuentes y proyectos, tomados de `src/lib/content.ts` (la misma fuente que `/llms.txt`). Si preguntan el precio, usa `PRICE_FROM` solo si está cargado; si no, no da cifras y deriva a la propuesta sin cargo.
- **Social Engine:** copy de `src/lib/social-engine-content.ts`. **Sin precios ni cifras de uso**, como pide la regla de esa página.
- Si no sabe algo o la consulta es comercial concreta, deriva al formulario o a WhatsApp (los dos números de `whatsappLines`).
- Si le piden algo que no tiene que ver con engineX, lo dice y vuelve al tema.

El prompt se arma en una función pura por página (`src/lib/assistant-prompt.ts`), testeada.

## Interfaz

Un botón flotante abajo a la derecha que abre un panel de chat.

- **Botón:** variante `secondary` (el único `primary` de la vista sigue siendo el del hero o el de "Sumarme"). Etiqueta visible "Preguntale a Fidel", no solo un ícono.
- **Panel:** `role="dialog"` no modal, con título "Fidel · asistente de IA de engineX", lista de mensajes con `aria-live="polite"`, campo de texto y botón enviar. Contador de caracteres cerca del límite.
- **Estados:** vacío (saludo y 3 preguntas sugeridas), enviando ("Fidel está escribiendo", se anuncia a lectores de pantalla), error y límite alcanzado (con botón de WhatsApp).
- **Teclado:** `Enter` envía, `Shift+Enter` salto de línea, `Esc` cierra y devuelve el foco al botón. Foco de 2px sólido `focus-ring`, como en el resto.
- **Conversación:** se guarda en `sessionStorage` (solo en el navegador de la persona) para que no se pierda al recargar; botón "Empezar de nuevo".
- **Sin JavaScript:** el widget no se muestra (no tiene sentido sin JS); WhatsApp y el formulario siguen ahí.
- **Móvil:** el panel ocupa casi toda la pantalla. El botón flotante queda **por encima de la barra de WhatsApp** (`MobileWhatsappBar`) para no taparla ni taparse.
- **Movimiento:** solo `transform` y `opacity`, máximo 200 ms, `ease-out`, quieto con `prefers-reduced-motion`. Sin animaciones de entrada al scrollear.
- **Estilo por página:**
  - En la home (Carbón): superficies con borde `line`, sin sombras ni degradés.
  - En `/social-engine` (Papel): el widget hereda los tokens de `html.se` y usa píldora para el botón, como el resto de esa página. Para el panel usamos `.se-card`, que es donde esa página permite sombra difusa.
- **Copy:** el aviso "Fidel es un asistente de IA y puede equivocarse. Para presupuestos, escribinos por WhatsApp." va fijo bajo el campo.

## Implementación

### Archivos nuevos
- `src/pages/api/assistant.ts`: ruta `POST` (`prerender = false`), delgada como las otras.
- `src/lib/assistant.ts`: validación pura del pedido (forma, largos, roles, `page`) y constantes de límites. Compartido con el cliente para el contador de caracteres.
- `src/lib/assistant-prompt.ts`: arma el system prompt por página.
- `src/lib/assistant-server.ts`: handler que orquesta las defensas, llama a Gemini y arma la respuesta. Recibe `fetch`, limitadores y reloj inyectables.
- `src/lib/assistant-limits.ts`: límite diario global (`DailyLimiter`, Redis y memoria) y fábrica según el entorno. Reutiliza `redisCredentials`, `clientIp` y `upstashRateLimiter` de `contact-store.ts` (se parametriza el límite en lugar de duplicar).
- `src/components/Assistant.astro` y `src/scripts/assistant.ts`: widget y su lógica.
- `src/styles/assistant.css`: estilos del widget.
- `tests/unit/assistant.test.ts`, `tests/e2e/assistant.spec.ts`.

### Archivos que se tocan
- `src/pages/index.astro` y `src/pages/social-engine.astro`: incluyen `<Assistant page="..." />`.
- `src/lib/contact-store.ts`: el límite por IP acepta la cantidad y la ventana como parámetros (hoy es fijo en `RATE_LIMIT`), sin cambiar el comportamiento de contacto y lista de espera.
- `.env.example`, `README.md` y `AGENTS.md`: variables nuevas (`GEMINI_API_KEY`, `GEMINI_MODEL`, `ASSISTANT_DAILY_LIMIT`), la ruta y la estructura.
- `plans/vercel.md`: sumar `GEMINI_API_KEY` a las variables del deploy.

### Variables de entorno
| Variable | Dónde | Qué hace |
| --- | --- | --- |
| `GEMINI_API_KEY` | Solo servidor (runtime) | Key de Gemini. Sin ella el asistente responde `503` y el widget no se muestra. |
| `GEMINI_MODEL` | Servidor, opcional | Modelo a usar. Tiene un valor por defecto. |
| `ASSISTANT_DAILY_LIMIT` | Servidor, opcional | Mensajes por día en total. Por defecto 300. |

Se leen con `process.env` en runtime, como el resto (en Astro 7 `import.meta.env` queda fijo en el build). La key **no** lleva prefijo `PUBLIC_` ni se referencia desde código que llegue al cliente.

Para saber si mostrar el widget sin exponer nada, la página se prerenderiza con el widget oculto y el script consulta a `/api/assistant` con un `GET` de estado que solo devuelve `{ enabled: boolean }`. Si está deshabilitado, no aparece.

## Verificación

**Unit (Vitest)**, con `fetch` de Gemini simulado:
- Validación: `page` inválido, mensajes vacíos o demasiado largos, roles no permitidos, historial recortado, body enorme (413), JSON malformado.
- Honeypot: 200 sin llamar a Gemini.
- Límite por IP y tope diario: al superarlos devuelve 429 y **no llama a Gemini**; el contador diario se reinicia al cambiar de día.
- Sin `GEMINI_API_KEY` o sin Redis en producción: 503 sin llamar a Gemini.
- Gemini responde error, timeout o vacío: respuesta genérica sin filtrar detalles ni la key.
- La key no aparece en ninguna respuesta ni en el HTML/JS del build (se verifica buscándola en `dist/`).
- Prompt: el de engineX incluye los servicios y no inventa precios si `PRICE_FROM` está vacío; el de Social Engine no incluye precios ni cifras.

**E2E (Playwright)**, con `/api/assistant` interceptado (no se llama a Gemini de verdad):
- El botón abre y cierra el panel, `Esc` devuelve el foco, el foco es de 2px.
- Enviar un mensaje muestra la respuesta; el contador de caracteres y el límite se respetan.
- Con 429 se ve el mensaje amable con el botón de WhatsApp.
- Sin JavaScript no hay widget y el resto de la página se ve igual.
- En móvil no hay scroll horizontal y el botón no tapa la barra de WhatsApp.
- Con movimiento reducido no hay transiciones de desplazamiento.
- Un solo botón `primary` por vista se mantiene en las dos páginas.

**Manual (con una key real)**: prueba de punta a punta en `npm run preview` y revisión del HTML y JS servidos para confirmar que la key no está.

Antes de entregar: `npm run lint`, `npm test`, `npm run build` y `npm run test:e2e`.

## Riesgos

- **Gasto:** un ataque distribuido puede llegar al tope diario. Está acotado por la defensa 6 y, por encima, por el límite que configurás en Google. Conviene arrancar con un tope bajo y subirlo con uso real.
- **Respuestas incorrectas:** un LLM puede equivocarse. El aviso fijo y el prompt acotado lo reducen, pero no lo eliminan.
- **Nombre del modelo:** los modelos de Gemini cambian de nombre; por eso es variable de entorno.
- **Costo de mantenimiento:** si cambia el copy de la web, el prompt lo toma de las mismas fuentes, así que no hay que actualizar dos lugares.

## Pendiente de ustedes (no bloquea el código)

- Crear la key en Google AI Studio, **restringirla** y definir el **límite de gasto mensual** en el proyecto de Google.
- Cargar `GEMINI_API_KEY` (y opcionalmente `GEMINI_MODEL` y `ASSISTANT_DAILY_LIMIT`) en Vercel. Mientras no esté, el asistente queda apagado.
- Redis ya tiene que estar configurado en Vercel (`KV_REST_API_*`); es lo que habilita los límites.

## Decisiones confirmadas

1. Tope inicial: **300 mensajes por día** en total y **12 mensajes cada 10 minutos** por IP.
2. Al agotarse el cupo, Fidel **solo deriva a WhatsApp** (sin pedir email).
3. En la home Fidel **habla de los proyectos del portfolio** (Reservo, Freggiaro) cuando le preguntan, con lo que dicen sus `.md`.
