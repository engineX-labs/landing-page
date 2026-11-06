// Copy compartido entre las secciones de la página, /llms.txt, el JSON-LD y Fidel.

export const tagline = "Productos de software para negocios que quieren crecer";

/** Lo que somos, arriba del titular. */
export const heroEyebrow = "Productos de software";

/** Bajada del hero: el "empuja" de la marca vive acá. */
export const heroLead =
  "Somos engineX. Creamos productos listos para usar que resuelven un problema puntual de tu negocio. El primero es Social Engine: te dice qué publicaciones funcionan en tus redes y qué repetir.";

/** Lo que hace Social Engine, flotando sobre el mockup del hero. */
export const heroChips = ["Informe semanal", "Ideas de posteo", "Chat con tus métricas"] as const;

/** Lo que saca objeciones justo debajo de los botones del hero. */
export const trustSignals = [
  "Prueba gratuita de 7 días",
  "Precio en pesos",
  "Pagás con Mercado Pago",
] as const;

/** Texto prearmado de los botones de WhatsApp (el formulario arma el suyo con los datos). */
export const whatsappGreeting = "Hola engineX, vengo de la web y quiero hacer una consulta.";

/** Atención humana por WhatsApp. */
export const supportHours = "de lunes a sábados, de 10 a 18 h";

export const description =
  "engineX crea productos de software para negocios que quieren crecer. Primero, Social Engine: qué publicaciones funcionan en tus redes. También hacemos proyectos a medida.";

/** Producto principal. El detalle completo vive en /social-engine. */
export const mainProduct = {
  name: "Social Engine",
  status: "En desarrollo",
  href: "/social-engine",
  text: "Conectás Instagram y Facebook y te decimos qué publicación rindió, cuál no y por qué. Cada semana, un informe y tres ideas para la próxima.",
  features: [
    "Conexión con Instagram y Facebook",
    "Informe semanal por correo o WhatsApp",
    "Chat para preguntar por tus métricas",
    "Tres ideas de posteo por semana",
  ],
} as const;

/** Líneas de producto que estamos evaluando: sin fecha, precio ni funciones confirmadas. */
export const evaluatingProducts = [
  "engineX Facturas",
  "engineX Reservas",
  "engineX Carta",
  "engineX Stock",
] as const;

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
 * Precio "desde" de Social Engine, ya formateado (por ejemplo "$ 15.000 por mes").
 * Lo define el equipo. Vacío, la pregunta del precio y Fidel responden sin cifra.
 */
export const PRICE_FROM = "";

/** Preguntas frecuentes: la sección de la página, el JSON-LD `FAQPage` y `/llms.txt`. */
export const faqs: { question: string; answer: string }[] = [
  {
    question: "¿Qué es engineX?",
    answer:
      "engineX crea productos de software para negocios que quieren crecer. Cada producto resuelve un problema puntual, se contrata por suscripción y funciona desde el primer día. El primero es Social Engine. Somos un equipo de dos fundadores.",
  },
  {
    question: "¿Qué es Social Engine y para quién es?",
    answer:
      "Es un agente que conecta las redes de tu negocio, lee las métricas y te explica en palabras simples qué publicación rindió, cuál no y qué repetir. Está pensado para dueños de comercios, community managers y emprendedores de Argentina.",
  },
  {
    question: "¿Cuándo abre Social Engine?",
    answer:
      "Lo estamos desarrollando y está en beta privada. Si te sumás a la lista de espera, te avisamos apenas haya lugar.",
  },
  {
    question: "¿Hay prueba gratuita?",
    answer: "Sí. Social Engine va a tener una prueba gratuita de 7 días.",
  },
  {
    question: "¿Cuánto cuesta?",
    answer: PRICE_FROM
      ? `Social Engine arranca desde ${PRICE_FROM}. Será en pesos y con pago por Mercado Pago.`
      : "Todavía no tenemos el precio definido. Va a ser en pesos y con pago por Mercado Pago. Sumate a la lista de espera y te avisamos antes de cobrar.",
  },
  {
    question: "¿Hacen sistemas a medida?",
    answer:
      "Sí, además de nuestros productos tomamos proyectos puntuales: sistemas de gestión, webs, reservas online y facturación ARCA. Escribinos por WhatsApp y lo vemos. Para ver cómo trabajamos, probá la demo de Freggiaro, con datos de prueba.",
  },
  {
    question: "¿Qué otros productos van a tener?",
    answer:
      "Estamos evaluando engineX Facturas, Reservas, Carta y Stock. Todavía no tienen fecha, precio ni funciones confirmadas.",
  },
  {
    question: "¿Es seguro conectar mi Instagram?",
    answer:
      "Conectás con la autorización oficial de la red y leemos solo las métricas de las cuentas que elijas. Si necesitás detalles legales o de tratamiento de datos, escribinos por WhatsApp.",
  },
];
