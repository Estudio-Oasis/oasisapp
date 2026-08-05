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

export type Tool = {
  name: string;
  desc: string;
};

export type ToolLane = {
  title: string;
  direction: "left" | "right";
  items: Tool[];
};

export const TOOL_LANES: ToolLane[] = [
  {
    title: "Creatividad, diseño y contenido",
    direction: "left",
    items: [
      { name: "Figma", desc: "Diseñar identidades, interfaces, presentaciones, prototipos y sistemas visuales colaborativos." },
      { name: "ChatGPT", desc: "Investigar, desarrollar estrategias, redactar contenido, analizar información y acelerar procesos." },
      { name: "Midjourney", desc: "Generar imágenes conceptuales, estilos visuales, referencias creativas y propuestas gráficas con IA." },
      { name: "CapCut", desc: "Editar reels, anuncios, videos cortos, subtítulos, efectos y contenido para redes sociales." },
      { name: "Riverside", desc: "Grabar entrevistas, podcasts y conversaciones remotas con audio y video de alta calidad." },
    ],
  },
  {
    title: "Comunicación y productividad",
    direction: "right",
    items: [
      { name: "Slack", desc: "Centralizar la comunicación interna del equipo por canales, proyectos y clientes." },
      { name: "Basecamp", desc: "Organizar tareas, documentos, conversaciones, pendientes y seguimiento de proyectos." },
      { name: "Notion", desc: "Documentar procesos, estrategias, manuales, briefings, bases de conocimiento y roadmaps." },
      { name: "Google Drive", desc: "Almacenar, compartir y organizar archivos de clientes y proyectos." },
      { name: "Google Docs", desc: "Crear documentos, propuestas, briefings, guiones y entregables colaborativos." },
      { name: "Google Sheets", desc: "Llevar controles, bases de datos, presupuestos, reportes y seguimiento operativo." },
      { name: "Google Slides", desc: "Crear presentaciones, propuestas comerciales, estrategias y pitch decks." },
      { name: "Google Meet", desc: "Realizar juntas virtuales con clientes, colaboradores y equipos." },
      { name: "Microsoft Excel", desc: "Analizar datos, presupuestos, proyecciones, costos y reportes financieros." },
      { name: "Zoom", desc: "Realizar reuniones, talleres y sesiones virtuales, incluyendo salas de trabajo." },
      { name: "Fathom", desc: "Grabar, transcribir y resumir automáticamente reuniones y llamadas." },
      { name: "Clockify", desc: "Registrar horas trabajadas por persona, proyecto, tarea o cliente." },
      { name: "Gather", desc: "Crear oficinas virtuales donde el equipo puede reunirse e interactuar mediante avatares." },
    ],
  },
  {
    title: "Publicidad, marketing y distribución",
    direction: "left",
    items: [
      { name: "Meta Ads", desc: "Crear y optimizar campañas publicitarias en Facebook e Instagram." },
      { name: "Google Ads", desc: "Captar clientes mediante anuncios en búsquedas, sitios web, aplicaciones y YouTube." },
      { name: "TikTok Ads", desc: "Distribuir anuncios en TikTok para generar alcance, tráfico, leads y ventas." },
      { name: "TikTok Shop", desc: "Vender productos directamente dentro de TikTok mediante contenido, lives y afiliados." },
      { name: "LinkedIn", desc: "Prospectar clientes B2B, reclutar talento y posicionar marcas o perfiles profesionales." },
      { name: "Instagram", desc: "Publicar contenido, construir comunidad, generar conversación y atraer clientes." },
      { name: "Facebook", desc: "Gestionar comunidades, grupos, páginas, anuncios y audiencias." },
      { name: "TikTok", desc: "Crear contenido de alcance orgánico, entretenimiento, educación y promoción." },
      { name: "YouTube", desc: "Distribuir videos largos, campañas, entrevistas, tutoriales y contenido de posicionamiento." },
      { name: "Google Analytics", desc: "Medir tráfico, comportamiento, conversiones y resultados dentro de sitios y tiendas." },
      { name: "Google Tag Manager", desc: "Instalar y administrar píxeles, eventos y etiquetas de medición sin modificar constantemente el sitio." },
      { name: "Looker Studio", desc: "Crear dashboards visuales conectando datos de publicidad, ventas y analítica." },
      { name: "PostHog", desc: "Analizar cómo utilizan los usuarios una aplicación mediante eventos, recorridos, embudos y grabaciones." },
      { name: "HubSpot", desc: "Gestionar contactos, ventas, marketing, CRM, formularios y automatizaciones." },
      { name: "Klaviyo", desc: "Crear campañas, segmentaciones y automatizaciones de email y SMS para e-commerce." },
    ],
  },
  {
    title: "CRM, automatización y mensajería",
    direction: "right",
    items: [
      { name: "GoHighLevel", desc: "Centralizar CRM, pipelines, formularios, calendarios, email, SMS y automatizaciones comerciales." },
      { name: "ManyChat", desc: "Automatizar conversaciones, respuestas, captación y seguimiento principalmente en Instagram." },
      { name: "WhatsApp Business", desc: "Atender clientes, dar seguimiento, compartir catálogos y mantener conversaciones comerciales." },
      { name: "Zapia", desc: "Asistente de IA dentro de WhatsApp para gestionar mensajes, consultas, reservas y otras tareas." },
      { name: "Make", desc: "Conectar aplicaciones y construir automatizaciones visuales sin desarrollar todo desde cero." },
      { name: "n8n", desc: "Crear automatizaciones avanzadas, integraciones, agentes de IA y flujos personalizados." },
      { name: "Twilio", desc: "Enviar y recibir mensajes de WhatsApp, SMS, llamadas y códigos de verificación mediante API." },
      { name: "OneSignal", desc: "Mandar notificaciones push a usuarios de sitios, aplicaciones y plataformas." },
      { name: "Resend", desc: "Enviar correos transaccionales desde aplicaciones, como confirmaciones, accesos y notificaciones." },
      { name: "OpenAI API", desc: "Integrar generación de texto, análisis, asistentes y funcionalidades de IA dentro de productos." },
    ],
  },
  {
    title: "E-commerce, ventas y fidelización",
    direction: "left",
    items: [
      { name: "Shopify", desc: "Construir, operar y hacer crecer tiendas en línea." },
      { name: "Shopify POS", desc: "Registrar ventas físicas y sincronizarlas con inventario, clientes y productos de Shopify." },
      { name: "Shopify Liquid", desc: "Personalizar temas, secciones y funcionalidades visuales dentro de Shopify." },
      { name: "Fidelízalo", desc: "Crear tarjetas de lealtad, monederos electrónicos, puntos y recompensas digitales para clientes." },
      { name: "Voccalo", desc: "Acompañar alumnos de academias y reducir la deserción mediante seguimiento y continuidad fuera de clase." },
    ],
  },
  {
    title: "Desarrollo de sitios y aplicaciones",
    direction: "right",
    items: [
      { name: "Lovable", desc: "Crear aplicaciones web y productos digitales rápidamente utilizando instrucciones en lenguaje natural." },
      { name: "Base44", desc: "Construir aplicaciones y sistemas internos con ayuda de inteligencia artificial y herramientas no-code." },
      { name: "Vercel", desc: "Publicar, alojar y administrar sitios y aplicaciones web." },
      { name: "Webflow", desc: "Diseñar y desarrollar sitios web visualmente con control avanzado de layout y animaciones." },
      { name: "Framer", desc: "Crear sitios web modernos, rápidos y visualmente atractivos con un editor de diseño." },
      { name: "Supabase", desc: "Base de datos, autenticación, almacenamiento y backend para aplicaciones." },
      { name: "GitHub", desc: "Guardar, versionar y colaborar sobre el código de sitios, aplicaciones y sistemas." },
      { name: "GitHub Actions", desc: "Automatizar pruebas, despliegues y procesos técnicos asociados al código." },
      { name: "Namecheap", desc: "Comprar y administrar dominios, DNS y otros servicios relacionados con sitios web." },
    ],
  },
  {
    title: "Tecnologías del stack",
    direction: "left",
    items: [
      { name: "React", desc: "Construir interfaces interactivas para aplicaciones y plataformas web." },
      { name: "TypeScript", desc: "Desarrollar aplicaciones JavaScript con mayor estructura, control y prevención de errores." },
      { name: "Tailwind CSS", desc: "Diseñar interfaces mediante clases reutilizables y un sistema visual consistente." },
      { name: "shadcn/ui", desc: "Componentes profesionales y personalizables para construir interfaces web." },
      { name: "SQL", desc: "Consultar, organizar y administrar información almacenada en bases de datos." },
      { name: "PWA", desc: "Convertir una plataforma web en una experiencia similar a una aplicación instalable." },
    ],
  },
  {
    title: "Sistemas y productos propios de Oasis",
    direction: "right",
    items: [
      { name: "Oasis OS", desc: "Ecosistema interno que reúne herramientas de operación, productividad, proyectos y desempeño." },
      { name: "2026 Performance Manager", desc: "Sistema para registrar objetivos, resultados, desempeño y seguimiento del equipo." },
      { name: "Money Guard", desc: "Herramienta para controlar finanzas, pagos, cobranza e información económica." },
      { name: "Projects", desc: "Centralizar proyectos, clientes, responsables, documentos, entregables y pagos." },
      { name: "Oasis Timer", desc: "Cronómetro interno para registrar el tiempo dedicado a cada cliente, proyecto y tarea." },
      { name: "Work Log", desc: "Bitácora de actividades realizadas por cada integrante del equipo." },
      { name: "Activity Tracking Layer", desc: "Capa que conecta actividad, tareas, horarios y reportes de productividad." },
      { name: "Bitácora", desc: "Espacio para documentar avances, decisiones, pendientes y actividad diaria." },
    ],
  },
];
