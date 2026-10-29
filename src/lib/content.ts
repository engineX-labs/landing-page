// Copy compartido entre las secciones de la página y /llms.txt.

export const tagline = "Software a medida para negocios que quieren crecer";

/** Lo que somos, arriba del titular: el hero presenta a la agencia, no un producto. */
export const heroEyebrow = "Agencia de desarrollo de software";

/** Bajada del hero: el "empuja" de la marca vive acá. */
export const heroLead =
  "Somos engineX. Diseñamos y desarrollamos sistemas de gestión, webs, reservas online y facturación ARCA, y los dejamos funcionando en tu negocio.";

/** Tipos de trabajo que flotan sobre el mockup del hero. */
export const heroChips = [
  "Sistemas de gestión",
  "Webs y landings",
  "Reservas online",
  "Facturación ARCA",
] as const;

/** Lo que saca objeciones justo debajo de los botones del hero. */
export const trustSignals = [
  "Propuesta y presupuesto sin cargo",
  "Respuesta en menos de 24 h hábiles",
  "Te acompañamos después de la entrega",
] as const;

/** Texto prearmado de los botones de WhatsApp (el formulario arma el suyo con los datos). */
export const whatsappGreeting = "Hola engineX, quiero consultar por un sistema para mi negocio.";

export const description =
  "Diseñamos y desarrollamos el software exacto que tu negocio necesita: gestión, facturación ARCA, reservas, pagos y webs.";

export const services = [
  {
    key: "gestion",
    title: "Sistemas de gestión",
    text: "Stock, ventas, clientes y reportes en un solo lugar, armado según cómo trabajás.",
  },
  {
    key: "webs",
    title: "Webs y landings",
    text: "Sitios rápidos que cuentan lo que hacés y llevan a la consulta.",
  },
  {
    key: "reservas",
    title: "Reservas online",
    text: "Tus clientes reservan solos y vos ves la ocupación al día desde el celular.",
  },
  {
    key: "facturacion",
    title: "Facturación electrónica ARCA",
    text: "Facturás desde tu sistema, sin entrar a la web de ARCA ni cargar los datos dos veces.",
  },
  {
    key: "pagos",
    title: "Pagos online",
    text: "Cobrás con Mercado Pago y cada pago queda registrado en tu sistema.",
  },
  {
    key: "integraciones",
    title: "Integraciones",
    text: "Conectamos lo que ya usás: WhatsApp, planillas y otros sistemas.",
  },
] as const;

export type ServiceKey = (typeof services)[number]["key"];

export const steps = [
  {
    title: "Nos contás qué necesitás",
    text: "Una charla corta por WhatsApp o videollamada para entender tu negocio y qué querés resolver.",
  },
  {
    title: "Propuesta y presupuesto sin cargo",
    text: "Te mandamos qué vamos a construir, en cuánto tiempo y cuánto cuesta.",
  },
  {
    title: "Diseño y desarrollo",
    text: "Construimos por etapas y te mostramos avances reales para que opines sobre la marcha.",
  },
  {
    title: "Lo tenés funcionando",
    text: "Lo instalamos, te enseñamos a usarlo y seguimos cerca para ajustar lo que haga falta.",
  },
] as const;

/**
 * Clientes de la barra "Confían en nosotros". El logo es un PNG transparente en `public/clientes/`.
 * `tone: "mono"` lo pinta con `ink-muted` (logos de línea sobre transparente); `"color"` lo muestra
 * con sus colores, para marcas con placa o relleno que en un solo tono quedarían como una mancha.
 */
export const clients: {
  name: string;
  logo: string;
  width: number;
  height: number;
  tone: "mono" | "color";
}[] = [
  {
    name: "Cabañas La Granja",
    logo: "/clientes/cabanas-la-granja.png",
    width: 655,
    height: 213,
    tone: "mono",
  },
  {
    name: "Freggiaro Frenos y Embragues",
    logo: "/clientes/freggiaro-mono.png",
    width: 640,
    height: 210,
    tone: "mono",
  },
];

/**
 * Precio orientativo "desde" de un proyecto, ya formateado (por ejemplo "$ 450.000").
 * Lo define el equipo. Vacío, la pregunta del precio responde sin cifra.
 */
export const PRICE_FROM = "";

/** Preguntas frecuentes: la sección de la página, el JSON-LD `FAQPage` y `/llms.txt`. */
export const faqs: { question: string; answer: string }[] = [
  {
    question: "¿Cuánto cuesta un sistema a medida?",
    answer: PRICE_FROM
      ? `Los proyectos arrancan desde ${PRICE_FROM}. El precio final depende de qué tiene que hacer el sistema: te pasamos la propuesta y el presupuesto sin cargo, con el precio cerrado antes de empezar.`
      : "Depende de qué tiene que hacer el sistema. Te pasamos la propuesta y el presupuesto sin cargo, con el precio cerrado antes de empezar.",
  },
  {
    question: "¿Cuánto tarda?",
    answer:
      "Depende del alcance. Construimos por etapas y en la propuesta te pasamos el plazo de cada una, así ves avances reales desde el principio.",
  },
  {
    question: "¿Tengo que saber de tecnología?",
    answer:
      "No. Vos nos contás qué querés resolver y la tecnología la elegimos nosotros. Cuando está listo te enseñamos a usarlo.",
  },
  {
    question: "¿Se conecta con ARCA y Mercado Pago?",
    answer:
      "Sí. Facturás desde tu sistema, sin entrar a la web de ARCA ni cargar los datos dos veces, y cada cobro de Mercado Pago queda registrado solo.",
  },
  {
    question: "¿Qué pasa si después necesito cambios?",
    answer:
      "Seguimos cerca después de la entrega: ajustamos lo que haga falta y sumamos funciones cuando tu negocio las necesite.",
  },
  {
    question: "¿Puedo ver un sistema funcionando antes?",
    answer:
      "Sí. Probá la demo de Freggiaro, un sistema de gestión con stock, clientes, ventas y facturación, con datos de prueba.",
  },
];
