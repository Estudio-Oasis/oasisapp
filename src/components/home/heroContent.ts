export const PALETTE = [
  "#1A73E8", // blue
  "#E8453C", // red
  "#F9AB00", // yellow
  "#1E8E3E", // green
  "#9334E6", // purple
  "#00897B", // teal
  "#E8710A", // orange
  "#C5221F", // deep red
];

export type Answer = {
  id: string;
  label: string;
  /** Short category label (no numbering) */
  kicker: string;
  /** Main copy: everyday language, naming real tools */
  body: string;
  /** Optional second line: how we solve it */
  solution?: string;
  color: string;
  /** Relative tile weight for the puzzle layout */
  span: number;
};

export const PILLARS: Answer[] = [
  {
    id: "adquisicion",
    label: "Adquisición",
    kicker: "Que te encuentren",
    body: "Todo lo que te trae clientes y usuarios nuevos: branding que se entiende, Meta Ads, Google Ads, TikTok, LinkedIn, SEO, medios offline, alianzas y relaciones públicas.",
    solution:
      "Lo medimos con Google Analytics, Tag Manager y Looker Studio para saber exactamente de dónde viene cada venta.",
    color: PALETTE[0],
    span: 1,
  },
  {
    id: "activacion",
    label: "Activación",
    kicker: "Que compren la primera vez",
    body: "Que quien llega no se pierda: landing pages, tienda en Shopify, checkout sin fricción, WhatsApp Business, ManyChat y flujos automáticos que responden en segundos.",
    solution:
      "Probamos oferta, precio y mensaje hasta que la primera compra deje de ser suerte.",
    color: PALETTE[1],
    span: 1,
  },
  {
    id: "retencion",
    label: "Retención",
    kicker: "Que regresen",
    body: "Que el cliente vuelva sin que le tengas que pagar otro anuncio: CRM en HubSpot o GoHighLevel, email con Resend, SMS, notificaciones, lealtad y comunidad.",
    solution:
      "Automatizamos el seguimiento con n8n y Make para que nada se caiga por olvido.",
    color: PALETTE[2],
    span: 1,
  },
  {
    id: "ltv",
    label: "Lifetime Value (LTV)",
    kicker: "Que cada cliente valga más",
    body: "Que cada persona deje más dinero con el tiempo: pricing, recompra, upsell, suscripciones y cuentas clave bien atendidas.",
    solution:
      "Lo vemos en dashboards propios: cuánto cuesta traer un cliente y cuánto te deja de verdad.",
    color: PALETTE[3],
    span: 1,
  },
];

export const PAIN_POINTS: Answer[] = [
  {
    id: "mas-ventas",
    label: "Más ventas en mi tienda online",
    kicker: "E-commerce",
    body: "Sabemos la sensación: hay visitas, hay carritos, y aun así el mes no cierra. Casi nunca es el anuncio, es el embudo.",
    solution:
      "Auditamos tu Shopify, arreglamos las fugas de checkout, ordenamos la medición y escalamos con Meta y Google Ads. Hemos operado tiendas de 100m+ USD.",
    color: PALETTE[0],
    span: 3,
  },
  {
    id: "conozcan",
    label: "Quiero que me conozcan de verdad",
    kicker: "Branding",
    body: "Te entendemos: haces bien tu trabajo y aun así te confunden con cualquiera. Eso no se arregla con un logo nuevo.",
    solution:
      "Construimos identidad con posición: naming, sistema visual, narrativa, contenido y activaciones que la gente recuerda.",
    color: PALETTE[3],
    span: 3,
  },
  {
    id: "agencia",
    label: "Mi agencia me está viendo la cara",
    kicker: "Auditoría",
    body: "Reportes bonitos, cero claridad y nadie te explica a dónde se fue el presupuesto. Lo hemos visto muchas veces.",
    solution:
      "Revisamos cuentas, contratos, atribución y entregables. Te decimos qué sirve, qué no y qué estás pagando de más.",
    color: PALETTE[7],
    span: 2,
  },
  {
    id: "ayuda",
    label: "Tengo un problema, necesito ayuda",
    kicker: "Fixers",
    body: "Ya no quieres una propuesta de tres meses, quieres que alguien entre y lo resuelva.",
    solution:
      "Entramos rápido, diagnosticamos en días y ejecutamos. Somos el equipo al que llaman cuando ya urge.",
    color: PALETTE[4],
    span: 2,
  },
  {
    id: "intente-todo",
    label: "Ya intenté de todo",
    kicker: "Diagnóstico",
    body: "Cambiaste de agencia, de anuncios, de web, y sigue igual. Es agotador y es normal que estés harto.",
    solution:
      "Casi siempre el problema es el sistema, no el canal. Ordenamos oferta, medición y operación antes de gastar un peso más.",
    color: PALETTE[2],
    span: 2,
  },
  {
    id: "no-vendo",
    label: "No vendo nada",
    kicker: "Revenue",
    body: "Es la parte más incómoda de decir en voz alta. Y es la más fácil de diagnosticar bien.",
    solution:
      "Empezamos por oferta y precio, no por el anuncio. Después construimos la máquina de adquisición.",
    color: PALETTE[1],
    span: 2,
  },
  {
    id: "arreglar",
    label: "Tengo mucho que arreglar",
    kicker: "Sistemas",
    body: "Todo urge al mismo tiempo y no sabes por dónde empezar. Eso también lo entendemos.",
    solution:
      "Priorizamos por impacto: qué mueve caja este mes y qué construye marca los próximos tres años.",
    color: PALETTE[5],
    span: 2,
  },
  {
    id: "unico",
    label: "Soy el único que se preocupa",
    kicker: "Equipo",
    body: "Cargas el negocio solo, persigues a todos y nadie más ve los números. Cansa muchísimo.",
    solution:
      "Te damos un equipo de 30+ expertos que se comporta como socio: métricas a la vista y responsabilidad clara.",
    color: PALETTE[6],
    span: 2,
  },
];

export type ToolLane = {
  title: string;
  direction: "left" | "right";
  items: string[];
};

export const TOOL_LANES: ToolLane[] = [
  {
    title: "Marketing, publicidad y growth",
    direction: "left",
    items: [
      "Meta Ads",
      "Google Ads",
      "TikTok Ads / TikTok",
      "LinkedIn",
      "Instagram",
      "YouTube",
      "Google Analytics",
      "Google Tag Manager",
      "Looker Studio",
      "PostHog",
      "HubSpot / HubSpot Academy",
    ],
  },
  {
    title: "CRM, automatización y comunicación con clientes",
    direction: "right",
    items: [
      "GoHighLevel",
      "ManyChat",
      "WhatsApp Business",
      "Zapia",
      "Voccalo",
      "n8n",
      "Make",
      "Twilio",
      "OneSignal",
      "Resend",
      "SMS",
      "API de OpenAI",
      "APIs de inteligencia artificial",
    ],
  },
  {
    title: "E-commerce y ventas",
    direction: "left",
    items: ["Shopify", "Shopify POS", "Shopify Liquid", "Lobbi", "Fidelízalo"],
  },
  {
    title: "Websites, aplicaciones y desarrollo",
    direction: "right",
    items: [
      "Lovable",
      "Vercel",
      "Webflow",
      "Framer",
      "Supabase",
      "GitHub",
      "GitHub Actions",
      "React",
      "TypeScript",
      "Tailwind CSS",
      "shadcn/ui",
      "SQL",
      "Namecheap",
      "PWA",
    ],
  },
  {
    title: "Productividad y gestión de proyectos",
    direction: "left",
    items: [
      "Slack",
      "Basecamp",
      "Gather",
      "Clockify",
      "Google Sheets",
      "Microsoft Excel",
      "Google Meet",
      "Fathom",
    ],
  },
  {
    title: "Video, contenido y producción",
    direction: "right",
    items: ["Riverside", "Replica Studios", "YouTube", "TikTok", "Instagram"],
  },
  {
    title: "Software propio de Oasis",
    direction: "left",
    items: [
      "Oasis OS",
      "Bitácora",
      "2026 Performance Manager",
      "Money Guard",
      "Projects",
      "Oasis Timer",
      "Work Log",
      "Activity Tracking Layer",
    ],
  },
];
