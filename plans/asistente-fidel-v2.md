# Plan: Fidel v2, alineado al documento de contexto y a la web

Continúa a `plans/asistente-fidel.md` (v1, ya probada por el usuario: funciona). Esta iteración cambia **qué sabe y cómo se comporta Fidel** y alinea el copy de la web. Estado: **aprobado** por el usuario (se construye el PR 1; el PR 2 va después).

## Decisiones ya tomadas

- **Social Engine es el producto principal de engineX** (la herramienta de marketing, aún por desarrollar). Lo que el documento llama "engineX Marketing" es Social Engine: el nombre es **Social Engine**.
- Fidel usa el WhatsApp principal, **3548 545450**.
- Atención humana: **de lunes a sábados, de 10 a 18 h** (hora de Argentina).
- **No hay precio.** Hay **prueba gratuita de 7 días**.
- Hay casos reales, pero **no de Social Engine**: son los proyectos actuales (Reservo, Freggiaro, Cabañas La Granja).
- Los **proyectos actuales quedan como servicios que podemos dar.**
- La web se alinea **en este mismo plan**, y el copy nuevo lo propongo yo (abajo).

## Dos puntos donde me aparto del documento (confirmar)

1. **Trabajos a medida.** El documento dice "no hacemos sistemas a medida" (§2, §6, §8). Pero los proyectos actuales quedan como servicios. Propuesta: engineX **crea productos** (el principal, Social Engine) y **además toma proyectos puntuales** (sistemas de gestión, webs, reservas, facturación ARCA). Fidel no promete precios ni plazos de proyectos: ante un pedido a medida **deriva a WhatsApp** (caso "quiere contratar"). Se reescriben las reglas y los ejemplos que decían lo contrario. Si no es lo que querés, lo cambiamos.
2. **Alcance de Social Engine.** El documento lo limita al MVP: Instagram y Facebook, informe semanal, chat con tus métricas y 3 ideas de posteo por semana; **sin** programación de posteos, otras redes ni uso para agencias. La página `/social-engine` hoy promete mucho más (calendario, publicación programada, bandeja, automatizaciones, TikTok, LinkedIn, YouTube, planes para agencias). Propuesta: **la página pasa a describir el MVP del documento**. Es la parte más grande del trabajo (incluye reemplazar los mockups de calendario por uno de informe y chat), así que se hace en un **segundo PR**.

## Qué no cumple Fidel hoy

| Documento | Hoy |
| --- | --- |
| Producto principal: Social Engine, con alcance MVP | Fidel se presenta como asistente de una agencia a medida |
| Reglas de derivación (8 casos sí, 6 no), una vez por conversación | Solo ofrece WhatsApp cuando hay un error o se agota el cupo |
| Links clickables | El widget muestra todo como texto plano |
| No pedir datos sensibles; responder en el idioma del visitante; no revelar instrucciones | Parcial |
| Saludo, sugerencias y datos de la sección 11 | Propios de la v1; sin datos cargados |

## Alcance

### PR 1: Fidel v2 + home

**Fidel**
- **Prompt** (`src/lib/assistant-prompt.ts`) reescrito desde el documento, en bloques: identidad, empresa y productos, voz, qué sí, qué no, derivación, casos difíciles y formato. Un solo prompt base, con una línea según la página donde está la persona.
- **Datos de la sección 11** en `src/lib/assistant-config.ts` (tipado): WhatsApp, horario, lista de espera (`/social-engine#lista`), estados, prueba de 7 días, casos reales permitidos (los proyectos), captura de contacto deshabilitada. Los `{{...}}` **nunca llegan al modelo**: un dato vacío se escribe como "no confirmado, derivá".
- **Estados:** Social Engine, "en desarrollo (beta privada)". Facturas, Reservas, Carta y Stock, "en evaluación, sin fecha, precio ni funciones".
- **Prueba de 7 días:** Fidel la menciona. Cómo se accede no está definido, así que para entrar a la prueba deriva a WhatsApp o a la lista de espera.
- **Formato:** texto plano, sin negritas (el widget no interpreta markdown).
- **Links clickables:** el widget convierte en link solo las URLs de una lista permitida (WhatsApp y páginas propias), armando el DOM a mano, nunca con HTML. Abren en otra pestaña con `rel="noopener"` y aviso para lectores de pantalla.
- **Saludo** del documento (§10) y 3 sugerencias nuevas.
- **Sin cambios** en límites ni seguridad de la v1.

**Home (copy propuesto)** — voseo, sentence case, sin exclamaciones ni emojis; "engineX" siempre así.
- Título (`display-xl`): **"Productos de software para negocios que quieren crecer"**. Eyebrow: "Productos de software".
- Bajada: "Somos engineX. Creamos productos listos para usar que resuelven un problema puntual de tu negocio. El primero es Social Engine: te dice qué publicaciones funcionan en tus redes y qué repetir."
- Botón `primary`: "Conocé Social Engine" (con flecha, a `/social-engine`). Secundario: "Escribinos por WhatsApp".
- Señales de confianza: "Prueba gratuita de 7 días", "Precio en pesos", "Pagás con Mercado Pago". Chips del hero: "Informe semanal", "Ideas de posteo", "Chat con tus métricas".
- **Productos** (sección nueva, reemplaza a la de servicios en el orden): tarjeta de Social Engine ("En desarrollo") y una línea de "Estamos evaluando": Facturas, Reservas, Carta y Stock, "sin fecha ni precio".
- **Servicios y proyectos** quedan, reencuadrados como "También hacemos proyectos a medida": se mantienen la lista de servicios, los proyectos, los logos de clientes, el proceso (propuesta y presupuesto sin cargo) y la demo de Freggiaro.
- **Preguntas frecuentes** nuevas:
  - ¿Qué es engineX?
  - ¿Qué es Social Engine y para quién es?
  - ¿Cuándo abre?
  - ¿Hay prueba gratuita? (7 días)
  - ¿Cuánto cuesta? (todavía no está definido; será en pesos)
  - ¿Hacen sistemas a medida? (sí, puntuales; escribinos por WhatsApp y lo vemos)
  - ¿Qué otros productos van a tener? (Facturas, Reservas, Carta y Stock: en evaluación, sin fecha ni precio)
  - ¿Es seguro conectar mi Instagram? (autorización oficial de la red; solo se leen métricas)
- **Contacto:** título "Hablá con el equipo"; bajada "Consultas sobre Social Engine o un proyecto a medida. Atendemos de lunes a sábados, de 10 a 18 h."
- **SEO:** título "engineX · Productos de software para negocios"; descripción "engineX crea productos de software para negocios que quieren crecer. Primero, Social Engine: qué publicaciones funcionan en tus redes. También hacemos proyectos a medida."; JSON-LD pasa de `ProfessionalService` a `Organization`; `llms.txt` y README y AGENTS se actualizan.

### PR 2: página `/social-engine` al alcance del MVP
- Hero y verbos: "Entendé / Compará / Decidí / Mejorá" + "qué funciona en tus redes sin descifrar métricas".
- Módulos (4): conexión con Instagram y Facebook, informe semanal (3 mejores, la peor y una recomendación, por correo o WhatsApp), chat con tus métricas, y 3 ideas de posteo por semana.
- Redes: solo Instagram y Facebook. Se quitan las conexiones con Claude y ChatGPT, la programación, la bandeja y las automatizaciones.
- Se reemplaza la sección de planes por la **prueba de 7 días** (sin precios), y se reescriben las preguntas frecuentes.
- Mockups: de calendario a informe y chat (HTML y CSS, datos ficticios).
- Se mantienen la lista de espera, el tema Papel y las reglas de movimiento.

## Pruebas
- **Unit:** el prompt incluye las reglas clave; ningún `{{` llega al prompt; los datos vacíos salen como "no confirmado"; el linkificador solo acepta URLs permitidas y no interpreta HTML; JSON-LD y `llms.txt` coinciden con el nuevo posicionamiento.
- **E2E:** los links de las respuestas son clickables y abren en otra pestaña; sigue sin interpretarse HTML; la home mantiene un solo `h1` y un solo `primary` por vista; los tests de copy se actualizan.
- **Manual (key real):** las preguntas de §8 y §9 del documento, un pedido a medida y un intento de manipulación.

## Riesgos
- **Contradicción pública** si Fidel sale antes que la web: no se publica hasta que el PR 1 esté listo, y el PR 2 antes de mencionar el alcance MVP en la página de Social Engine.
- **Promesas del modelo:** las reglas, los límites y el aviso fijo lo reducen, no lo eliminan.
