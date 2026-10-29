# Plan: Reestructura de la landing como agencia

Estado: aprobado e implementado (sobre `feature/mejora-ux-ui`, PR #6)

## Objetivo

Que la landing presente a engineX como **agencia de desarrollo de software** y no como un proveedor de sistemas de facturación. Que cada proyecto se vea en compu y en celular, como el mockup del hero. Y sumar profundidad visual (vidrio y un fondo con movimiento) sin perder velocidad ni accesibilidad.

## Decisiones

- **Hero de agencia.**
  - Etiqueta de vidrio "Agencia de desarrollo de software".
  - Titular "Software a medida para negocios que quieren crecer".
  - Bajada que presenta a engineX y los cuatro tipos de trabajo.
  - El tercer punto de confianza pasa a "Te acompañamos después de la entrega", porque "Facturación ARCA integrada" volvía a centrar todo en un servicio.
- **Mockup en el hero:** el tablero de Freggiaro en la compu, Reservo en el celular y cuatro chips de vidrio con los tipos de trabajo. Es decorativo (`aria-hidden`) y no promociona la demo.
- **Mockup por proyecto (`DeviceShowcase`):**
  - Navegador con su barra y celular superpuesto abajo a la derecha.
  - Las capturas se sacaron de los sitios en vivo (Reservo y Cabañas La Granja) y de `/demo/freggiaro?embed`, en 1440×900 y 390×844 a 2x.
  - La captura de escritorio de Reservo se recortó a la izquierda, porque su página ya trae un celular dibujado que se duplicaba con el del mockup.
  - En hover, el celular sube más que la compu (10 px contra 4 px) y se nota la profundidad.
- **Servicios:** los destacados pasan a ser Sistemas de gestión y Webs y landings, lo que define a una agencia. Facturación ARCA sigue en la lista.
- **Vidrio (`ui-ux-pro-max`, glassmorphism en tema oscuro):**
  - Translúcido oscuro (`--glass-bg`, `--glass-surface`), no blanco, para mantener el contraste del tema Carbón.
  - `blur(16px) saturate(140%)`, con borde `--glass-border`.
  - Solo donde hay algo con color detrás: el header, los chips del hero y la barra de WhatsApp.
  - Sin soporte de `backdrop-filter`, queda un fondo opaco.
- **Fondo con movimiento (`emil-design-eng`):**
  - Dos brillos radiales (ignite y stone) que derivan muy lento (22 y 28 s, `ease-in-out`, solo `transform`) y una grilla tenue enmascarada.
  - Se pausan fuera de pantalla (`IntersectionObserver`) y no se mueven con movimiento reducido.
  - Nada de animaciones infinitas en primer plano: `ui-ux-pro-max` las marca como distractoras y los chips solo entran una vez.
- **Cambio de reglas del sistema:** `AGENTS.md` ahora permite vidrio y brillos de fondo, acotados a esos lugares. Siguen prohibidas las sombras y los degradados en texto, botones y tarjetas.

## Verificación

- `npm run lint`: sin errores.
- `npm test`: 73 tests pasan.
- `npm run build`: 0 errores de tipos.
- `npm run test:e2e`: 47 tests pasan.
- Tests nuevos:
  - El hero presenta a la agencia (etiqueta, titular y 4 chips).
  - Cada tarjeta tiene su vista de compu (con descripción) y de celular (decorativa).
  - Los brillos se pausan fuera de pantalla y quedan quietos con movimiento reducido.
  - El header usa `backdrop-filter`.
- Velocidad (4G lento, CPU ×4, mediana de 3): LCP de 1,23 s (`main`: 1,83 s) y 0 KB de JS en la home.
