// Copy de la landing de Social Engine. Compartido con /llms.txt y el JSON-LD (`FAQPage`).

export const productName = "Social Engine";

export const pageTitle = "Social Engine · Organizá el marketing de tus redes en un solo lugar";

export const pageDescription =
  "Social Engine es la herramienta de engineX para planificar, publicar, responder y medir tus redes sociales con tu equipo y un asistente con IA. Sumate a la lista de espera.";

export const announcement = "Social Engine está en beta privada";
export const announcementLink = "Sumate a la lista";

export const heroEyebrow = "Marketing en redes, en un solo lugar";

/** Los verbos que rotan en el título; el primero es el que se ve con movimiento reducido. */
export const heroVerbs = ["Planificá", "Publicá", "Respondé", "Medí"] as const;

export const heroRest = "tus redes sin saltar de app en app";

/** Texto fijo del título para lectores de pantalla y buscadores. */
export const heroTitleText = `${heroVerbs[0]}, ${heroVerbs
  .slice(1, -1)
  .map((verb) => verb.toLowerCase())
  .join(", ")} y ${heroVerbs.at(-1)?.toLowerCase()} ${heroRest}`;

export const heroLead =
  "Calendario compartido, publicación programada, bandeja de comentarios y mensajes, y analítica. Todo con un asistente que escribe con la voz de tu marca.";

export const whatsappGreeting = "Hola engineX, quiero saber más sobre Social Engine.";

/** Las redes con las que conecta, para el carrusel. */
export const networks = ["Instagram", "Facebook", "TikTok", "LinkedIn", "YouTube"] as const;
export const assistants = ["Claude", "ChatGPT"] as const;

export type ModuleKey =
  | "sync"
  | "planning"
  | "publish"
  | "inbox"
  | "automations"
  | "analytics"
  | "assistant";

export const modules: { key: ModuleKey; title: string; text: string }[] = [
  {
    key: "sync",
    title: "Sincronización",
    text: "Conectás tus cuentas y traemos todo lo que ya publicaste a un calendario. Lo que subas directo a cada red también aparece solo.",
  },
  {
    key: "planning",
    title: "Planificación en equipo",
    text: "Ideas, guiones, textos, responsables y etiquetas viven junto a cada posteo. Tu equipo comenta, sube versiones y aprueba desde un link.",
  },
  {
    key: "publish",
    title: "Publicación programada",
    text: "Programás cada posteo para su red, con los límites de la plataforma a la vista antes de publicar. Duplicás el mismo contenido en varias redes.",
  },
  {
    key: "inbox",
    title: "Bandeja de entrada",
    text: "Comentarios y mensajes de todas las redes en una sola lista. Respondés vos, o dejás que el asistente conteste y te pase lo que necesita a una persona.",
  },
  {
    key: "automations",
    title: "Automatizaciones",
    text: "Respuestas automáticas a comentarios, reglas por palabra clave (por ejemplo, mandar el menú por mensaje directo) y mensajes con IA.",
  },
  {
    key: "analytics",
    title: "Analítica y reportes",
    text: "Seguidores, vistas e interacciones de todas tus redes juntas, con comparación entre períodos y un reporte mensual listo para compartir.",
  },
  {
    key: "assistant",
    title: "Asistente con IA",
    text: "Redacta textos y respuestas con la voz de tu marca, contesta con la información de tu negocio y deja borradores para que apruebes. Funciona también con Claude y ChatGPT.",
  },
];

export const howItWorks = [
  {
    title: "Conectá tus cuentas",
    text: "Traemos tus publicaciones anteriores y las ordenamos en un calendario.",
  },
  {
    title: "Planificá con tu equipo",
    text: "Cada posteo reúne la idea, el texto, las versiones y las aprobaciones.",
  },
  {
    title: "Publicá y respondé",
    text: "Programás las publicaciones y atendés comentarios y mensajes desde la misma bandeja.",
  },
  {
    title: "Medí y ajustá",
    text: "Mirás cómo te fue en todas las redes y seguís con lo que funciona.",
  },
] as const;

export const benefitsTitle = "Menos pestañas, más tiempo para tu marca";

export const benefits = [
  {
    key: "time",
    title: "Ahorro de tiempo",
    text: "Planificás y publicás una vez. No saltás entre apps ni copiás el mismo texto en cada red.",
  },
  {
    key: "all",
    title: "Todo en un solo lugar",
    text: "Calendario, bandeja, automatizaciones y analítica comparten la misma información.",
  },
  {
    key: "focus",
    title: "Foco en lo importante",
    text: "El asistente se encarga de lo repetitivo y vos decidís qué se publica y qué se responde.",
  },
] as const;

export const plans = [
  {
    key: "creator",
    name: "Creador",
    audience: "Para una marca y una persona",
    features: [
      "Calendario y publicación",
      "Bandeja de comentarios",
      "Asistente con IA",
      "Analítica",
    ],
    featured: false,
  },
  {
    key: "team",
    name: "Equipo",
    audience: "Para empresas con varias marcas",
    features: [
      "Todo lo de Creador",
      "Varias marcas y personas",
      "Acceso por área: contenido, bandeja y analítica",
      "Links de aprobación",
    ],
    featured: true,
  },
  {
    key: "agency",
    name: "Agencia",
    audience: "Para equipos grandes y agencias",
    features: [
      "Todo lo de Equipo",
      "Marcas y equipo sin tope",
      "Roles avanzados",
      "Atención directa",
    ],
    featured: false,
  },
] as const;

export const planGuarantees = ["Sin tarjeta para sumarte", "Te avisamos antes de cobrar"] as const;

export const faqs: { question: string; answer: string }[] = [
  {
    question: "¿Qué es Social Engine?",
    answer:
      "Es una herramienta para organizar el marketing en redes: calendario compartido, publicación programada, bandeja de comentarios y mensajes, automatizaciones, analítica y un asistente con IA. Es un producto de engineX.",
  },
  {
    question: "¿Con qué redes funciona?",
    answer:
      "Con Instagram, Facebook, TikTok, LinkedIn y YouTube. Además, tu asistente favorito (Claude o ChatGPT) puede trabajar con tu marca mediante una conexión MCP.",
  },
  {
    question: "¿Cuándo abre?",
    answer:
      "Estamos en beta privada. Si te sumás a la lista de espera, te escribimos apenas haya lugar.",
  },
  {
    question: "¿Cuánto cuesta?",
    answer:
      "Estamos definiendo los planes: uno para una marca, otro para equipos con varias marcas y uno a medida para agencias. Cuando estén listos, te avisamos por email.",
  },
  {
    question: "¿El asistente publica solo?",
    answer:
      "No. Escribe borradores con la voz de tu marca y vos los aprobás antes de publicar. Las respuestas automáticas son opcionales y las configurás vos.",
  },
  {
    question: "¿Puedo usarlo con mi equipo?",
    answer:
      "Sí. Cada persona tiene su acceso y sus permisos, y podés compartir un link para que alguien apruebe un posteo sin crear una cuenta.",
  },
];

export const closing = {
  title: "Sé de los primeros en usar Social Engine",
  text: "Sumate a la lista de espera y te avisamos cuando abramos lugares.",
} as const;
