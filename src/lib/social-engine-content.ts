// Copy de la landing de Social Engine. Compartido con /llms.txt y el JSON-LD (`FAQPage`).

export const productName = "Social Engine";

export const pageTitle = "Social Engine · Entendé qué funciona en tus redes";

export const pageDescription =
  "Social Engine es la herramienta de engineX que lee las métricas de tu Instagram y tu Facebook y te dice qué publicaciones funcionan y qué repetir. Prueba gratuita de 7 días. Sumate a la lista de espera.";

/** Qué es engineX, para el JSON-LD y /llms.txt. */
export const companyDescription =
  "engineX crea productos de software para negocios que quieren crecer. Hoy se dedica a Social Engine.";

export const announcement = "Social Engine está en beta privada";
export const announcementLink = "Sumate a la lista";

export const heroEyebrow = "Métricas de Instagram y Facebook, sin vueltas";

/** Los verbos que rotan en el título; el primero es el que se ve con movimiento reducido. */
export const heroVerbs = ["Entendé", "Compará", "Decidí", "Mejorá"] as const;

export const heroRest = "lo que funciona en tus redes sin descifrar métricas";

/** Texto fijo del título para lectores de pantalla y buscadores. */
export const heroTitleText = `${heroVerbs[0]}, ${heroVerbs
  .slice(1, -1)
  .map((verb) => verb.toLowerCase())
  .join(", ")} y ${heroVerbs.at(-1)?.toLowerCase()} ${heroRest}`;

export const heroLead =
  "Conectás tu Instagram y tu Facebook y cada semana recibís un informe claro: qué publicaciones funcionaron, cuál no y qué hacer la próxima. Además, le preguntás a tus métricas y te damos 3 ideas de posteo.";

export const whatsappGreeting = "Hola engineX, quiero saber más sobre Social Engine.";

/** Las redes con las que conecta, para el carrusel. */
export const networks = ["Instagram", "Facebook"] as const;

export type ModuleKey = "connect" | "report" | "chat" | "ideas";

export const modules: { key: ModuleKey; title: string; text: string }[] = [
  {
    key: "connect",
    title: "Conexión con Instagram y Facebook",
    text: "Conectás tus cuentas con la autorización oficial de cada red. Solo leemos las métricas: no publicamos ni respondemos por vos.",
  },
  {
    key: "report",
    title: "Informe semanal",
    text: "Una vez por semana te llegan tus 3 mejores publicaciones, la que peor funcionó y una recomendación concreta. Por correo o por WhatsApp.",
  },
  {
    key: "chat",
    title: "Chat con tus métricas",
    text: "Preguntás con tus palabras, por ejemplo qué día te conviene publicar, y te contestamos con los datos de tus cuentas.",
  },
  {
    key: "ideas",
    title: "3 ideas de posteo por semana",
    text: "Cada semana te proponemos tres ideas basadas en lo que ya funcionó en tus redes. Vos decidís cuáles usar.",
  },
];

export const howItWorks = [
  {
    title: "Conectá tus cuentas",
    text: "Autorizás tu Instagram y tu Facebook. Solo leemos las métricas.",
  },
  {
    title: "Recibí el informe",
    text: "Cada semana: tus 3 mejores publicaciones, la peor y qué hacer.",
  },
  {
    title: "Preguntale a tus métricas",
    text: "Consultás en el chat lo que quieras saber de tus resultados.",
  },
  {
    title: "Mejorá la semana que viene",
    text: "Usás las 3 ideas de posteo y repetís lo que funciona.",
  },
] as const;

export const benefitsTitle = "Decisiones con datos, sin planillas";

export const benefits = [
  {
    key: "time",
    title: "Ahorro de tiempo",
    text: "No entrás a cada red a comparar números: el informe llega solo, cada semana.",
  },
  {
    key: "all",
    title: "Todo en un solo informe",
    text: "Instagram y Facebook juntos, con lo mejor, lo peor y qué hacer.",
  },
  {
    key: "focus",
    title: "Foco en lo que funciona",
    text: "Sabés qué repetir y qué cambiar, sin ser experto en métricas.",
  },
] as const;

export const trial = {
  title: "Probalo 7 días sin costo",
  text: "Cuando abramos lugares vas a poder probar Social Engine una semana completa. Todavía no definimos el precio: cuando esté, lo publicamos acá y te avisamos.",
  points: ["Prueba gratuita de 7 días", "Precio en pesos, a definir", "Te avisamos cuando abramos"],
} as const;

export const faqs: { question: string; answer: string }[] = [
  {
    question: "¿Qué es Social Engine?",
    answer:
      "Es la herramienta de engineX que lee las métricas de tu Instagram y tu Facebook y te dice qué publicaciones funcionan y qué repetir. Incluye un informe semanal, un chat para preguntarle a tus métricas y 3 ideas de posteo por semana.",
  },
  {
    question: "¿Con qué redes funciona?",
    answer: "Por ahora con Instagram y Facebook. No hay fecha confirmada para otras redes.",
  },
  {
    question: "¿Cuándo abre?",
    answer:
      "Estamos en desarrollo, en beta privada. Si te sumás a la lista de espera, te escribimos apenas haya lugar.",
  },
  {
    question: "¿Hay prueba gratuita?",
    answer:
      "Sí, de 7 días. Cuando abramos lugares te avisamos por la lista de espera cómo acceder.",
  },
  {
    question: "¿Cuánto cuesta?",
    answer:
      "Todavía no está definido. Va a ser en pesos y lo vamos a publicar antes del lanzamiento.",
  },
  {
    question: "¿Publica por mí?",
    answer:
      "No. Social Engine no programa ni publica posteos: te dice qué funciona y te propone ideas. Vos decidís qué subir.",
  },
  {
    question: "¿Es seguro conectar mi Instagram?",
    answer:
      "La conexión usa la autorización oficial de la red y solo se leen métricas. No publicamos ni respondemos mensajes en tu nombre.",
  },
  {
    question: "¿Sirve para agencias?",
    answer:
      "Hoy está pensado para negocios que manejan sus propias cuentas. Si manejás varias marcas, escribinos por WhatsApp y lo conversamos.",
  },
];

export const closing = {
  title: "Sé de los primeros en usar Social Engine",
  text: "Sumate a la lista de espera y te avisamos cuando abramos lugares.",
} as const;
