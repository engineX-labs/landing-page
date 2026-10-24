// Copy compartido entre las secciones de la página y /llms.txt.

export const tagline = "Software que empuja tu negocio";

export const description =
  "Diseñamos y desarrollamos el software exacto que tu negocio necesita: gestión, facturación ARCA, reservas, pagos y webs.";

export const services = [
  {
    key: "gestion",
    title: "Sistemas de gestión",
    text: "Stock, ventas, clientes y reportes en un solo lugar, armado según cómo trabajás.",
  },
  {
    key: "facturacion",
    title: "Facturación electrónica ARCA",
    text: "Facturás desde tu sistema, sin entrar a la web de ARCA ni cargar los datos dos veces.",
  },
  {
    key: "reservas",
    title: "Reservas online",
    text: "Tus clientes reservan solos y vos ves la ocupación al día desde el celular.",
  },
  {
    key: "pagos",
    title: "Pagos online",
    text: "Cobrás con Mercado Pago y cada pago queda registrado en tu sistema.",
  },
  {
    key: "webs",
    title: "Webs",
    text: "Sitios rápidos que cuentan lo que hacés y llevan a la consulta.",
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
