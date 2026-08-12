import type { Bi } from "@/i18n/LanguageContext";

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

/** Las 5 etapas del sistema de crecimiento — se muestran como slider tipo app */
export type Stage = {
  id: string;
  n: string;
  label: Bi;
  kicker: Bi;
  body: Bi;
  detail: Bi;
  proof: Bi;
  color: string;
};

export const STAGES: Stage[] = [
  {
    id: "datos",
    n: "01",
    label: { es: "Datos y estrategia", en: "Data & strategy" },
    kicker: { es: "Dónde estás parado", en: "Where you stand" },
    body: {
      es: "Primero medimos. Auditamos tus números, tus canales y tu operación para decirte dónde estás hoy, a dónde puedes llegar y cuánto te va a costar llegar ahí.",
      en: "We measure first. We audit your numbers, channels, and operation to tell you where you are today, how far you can go, and what getting there will cost.",
    },
    detail: {
      es: "Analítica, experimentación y pruebas reales: no opinamos, probamos. Todo lo que sigue se decide con datos, no con corazonadas.",
      en: "Analytics, experimentation, and real testing: we don't give opinions, we run tests. Everything that follows is decided with data, not hunches.",
    },
    proof: { es: "Diagnóstico en días, no en meses.", en: "Diagnosis in days, not months." },
    color: PALETTE[0],
  },
  {
    id: "adquisicion",
    n: "02",
    label: { es: "Adquisición", en: "Acquisition" },
    kicker: { es: "Que te encuentren y te compren", en: "Get found and get bought" },
    body: {
      es: "12 años corriendo pauta en todo lo que existe: Meta, Google, TikTok y TikTok Shop, LinkedIn, medios offline. B2B, B2C y D2C.",
      en: "12 years running paid media on everything out there: Meta, Google, TikTok and TikTok Shop, LinkedIn, offline media. B2B, B2C, and D2C.",
    },
    detail: {
      es: "Desde ventas tradicionales y listas de leads para prospección en LinkedIn, hasta campañas de performance a escala. Siempre combinado con creatividad y marca: venimos de ser brand managers de Nivea, Spotify, San Francisco 49ers, 98 Coast Av., Caramela, Platzi, Rocketfy, Grupo Carso y Zoe Water.",
      en: "From traditional sales and lead lists for LinkedIn prospecting to performance campaigns at scale. Always paired with creative and brand work: we come from being brand managers for Nivea, Spotify, the San Francisco 49ers, 98 Coast Av., Caramela, Platzi, Rocketfy, Grupo Carso, and Zoe Water.",
    },
    proof: {
      es: "Marca + performance en el mismo equipo.",
      en: "Brand + performance on the same team.",
    },
    color: PALETTE[1],
  },
  {
    id: "activacion",
    n: "03",
    label: { es: "Activación", en: "Activation" },
    kicker: {
      es: "Que la primera compra no sea suerte",
      en: "Make the first purchase repeatable",
    },
    body: {
      es: "Activamos al usuario que ya llegó: programas de lealtad, CRMs a la medida, seguimiento por WhatsApp y email, newsletter y comunidad.",
      en: "We activate the customer who already showed up: loyalty programs, custom CRMs, WhatsApp and email follow-up, newsletter, and community.",
    },
    detail: {
      es: "El objetivo es que la relación no termine en la primera venta: construimos la base para mandar campañas todo el año, mantener el negocio activo y convertir compradores en clientes de verdad.",
      en: "The goal is for the relationship not to end at the first sale: we build the base to run campaigns all year, keep the business active, and turn buyers into real customers.",
    },
    proof: { es: "CRM propio, no plantillas.", en: "Custom CRM, not templates." },
    color: PALETTE[2],
  },
  {
    id: "retencion",
    n: "04",
    label: { es: "Retención", en: "Retention" },
    kicker: { es: "Que no se vayan", en: "Keep them from leaving" },
    body: {
      es: "No sólo traemos clientes nuevos: minimizamos el churn. Vemos conducta, cuánto gastan y cada cuánto, y actuamos antes de perderlos.",
      en: "We don't just bring in new customers, we minimize churn. We look at behavior, how much they spend and how often, and act before you lose them.",
    },
    detail: {
      es: "Usamos análisis RFM — Recencia (cuándo te compró por última vez), Frecuencia (cada cuánto compra) y Valor (cuánto deja). Con eso separamos a tus clientes champions de los dormidos y a cada grupo le hablamos distinto: lealtad, promociones y campañas para mover caja todo el año, no sólo en temporada.",
      en: "We use RFM analysis — Recency (when they last bought), Frequency (how often they buy), and Value (how much they leave behind). That separates your champion customers from the dormant ones, and we talk to each group differently: loyalty, promotions, and campaigns to move cash all year, not just in season.",
    },
    proof: { es: "El negocio se mueve los 12 meses.", en: "The business moves all 12 months." },
    color: PALETTE[3],
  },
  {
    id: "escala",
    n: "05",
    label: { es: "Escala", en: "Scale" },
    kicker: {
      es: "Cuando ya funciona, se multiplica",
      en: "Once it works, you multiply it",
    },
    body: {
      es: "Equipo comercial y de negociación internacional. Cerramos contratos, alianzas y estructuras que hacen crecer el negocio completo, no sólo la campaña.",
      en: "Commercial and international negotiation team. We close contracts, partnerships, and structures that grow the whole business, not just the campaign.",
    },
    detail: {
      es: "Fuimos los primeros en convencer a FedEx México de aceptar pago contra entrega. Acompañamos a Smart Bimo de pequeño negocio a startup con rondas de inversión de millones de dólares y miles de emprendedores formados. En Rocketfy reconstruimos el sistema de crecimiento completo: academia, sistema de señales por usuario y trabajo mano a mano dentro de su Shopify.",
      en: "We were the first to convince FedEx Mexico to accept cash on delivery. We took Smart Bimo from small business to a startup raising multi-million dollar rounds, with thousands of digital entrepreneurs trained. At Rocketfy we rebuilt the entire growth system: academy, per-user signal system, and hands-on work inside their Shopify.",
    },
    proof: { es: "Casos reales, no promesas.", en: "Real cases, not promises." },
    color: PALETTE[4],
  },
];

export const BRANDS_MANAGED = [
  "Nivea",
  "Spotify",
  "San Francisco 49ers",
  "98 Coast Av.",
  "Caramela",
  "Platzi",
  "Rocketfy",
  "Grupo Carso",
  "Zoe Water",
  "Liverpool",
  "BBVA",
  "Baileys",
  "Herbalife",
  "SEDENA",
  "Mundo Cuervo",
  "Indumet",
  "Miami Ad School",
  "Koena",
  "Maalob",
];

export const CAPABILITIES: Bi[] = [
  { es: "Estrategia de Marca (Branding)", en: "Brand Strategy (Branding)" },
  { es: "Planeación Estratégica (Planning)", en: "Strategic Planning" },
  { es: "Dirección Comercial (Revenue y Ventas)", en: "Commercial Leadership (Revenue & Sales)" },
  { es: "E-commerce (100m+ USD)", en: "E-commerce (100m+ USD)" },
  {
    es: "Relaciones Públicas (Alianzas & Sponsorships)",
    en: "Public Relations (Partnerships & Sponsorships)",
  },
  {
    es: "Compra de Medios (Digital Paid Media & Offline)",
    en: "Media Buying (Digital Paid Media & Offline)",
  },
  { es: "Activaciones de Marca (Real-time on-site)", en: "Brand Activations (Real-time on-site)" },
  { es: "Producción Audiovisual (Full-cycle)", en: "Film & Video Production (Full-cycle)" },
  { es: "DevOps & Infra", en: "DevOps & Infra" },
  { es: "Product Design & Frontend", en: "Product Design & Frontend" },
  { es: "Desarrollo de Software", en: "Software Development" },
  { es: "Data & Computer Science", en: "Data & Computer Science" },
  { es: "CRM & Lifecycle", en: "CRM & Lifecycle" },
  { es: "Sistemas de Atribución y Señales", en: "Attribution & Signal Systems" },
  { es: "Dashboards", en: "Dashboards" },
  { es: "IA", en: "AI" },
  { es: "Agentes", en: "Agents" },
  { es: "Automatizaciones", en: "Automations" },
  { es: "Eventos", en: "Events" },
];

export type Tool = {
  name: string;
  desc: Bi;
};

export type ToolLane = {
  id: string;
  title: Bi;
  direction: "left" | "right";
  items: Tool[];
};

export const TOOL_LANES: ToolLane[] = [
  {
    id: "creative",
    title: {
      es: "Creatividad, diseño y contenido",
      en: "Creative, design, and content",
    },
    direction: "left",
    items: [
      {
        name: "Figma",
        desc: {
          es: "Diseñar identidades, interfaces, presentaciones, prototipos y sistemas visuales colaborativos.",
          en: "Designing identities, interfaces, decks, prototypes, and collaborative design systems.",
        },
      },
      {
        name: "ChatGPT",
        desc: {
          es: "Investigar, desarrollar estrategias, redactar contenido, analizar información y acelerar procesos.",
          en: "Research, strategy development, copywriting, analysis, and speeding up processes.",
        },
      },
      {
        name: "Midjourney",
        desc: {
          es: "Generar imágenes conceptuales, estilos visuales, referencias creativas y propuestas gráficas con IA.",
          en: "Generating concept imagery, visual styles, creative references, and graphic proposals with AI.",
        },
      },
      {
        name: "CapCut",
        desc: {
          es: "Editar reels, anuncios, videos cortos, subtítulos, efectos y contenido para redes sociales.",
          en: "Editing reels, ads, short video, captions, effects, and social content.",
        },
      },
      {
        name: "Riverside",
        desc: {
          es: "Grabar entrevistas, podcasts y conversaciones remotas con audio y video de alta calidad.",
          en: "Recording interviews, podcasts, and remote conversations in high-quality audio and video.",
        },
      },
    ],
  },
  {
    id: "productivity",
    title: { es: "Comunicación y productividad", en: "Communication and productivity" },
    direction: "right",
    items: [
      {
        name: "Slack",
        desc: {
          es: "Centralizar la comunicación interna del equipo por canales, proyectos y clientes.",
          en: "Centralizing internal team communication by channel, project, and client.",
        },
      },
      {
        name: "Basecamp",
        desc: {
          es: "Organizar tareas, documentos, conversaciones, pendientes y seguimiento de proyectos.",
          en: "Organizing tasks, documents, conversations, to-dos, and project follow-up.",
        },
      },
      {
        name: "Notion",
        desc: {
          es: "Documentar procesos, estrategias, manuales, briefings, bases de conocimiento y roadmaps.",
          en: "Documenting processes, strategies, playbooks, briefs, knowledge bases, and roadmaps.",
        },
      },
      {
        name: "Google Drive",
        desc: {
          es: "Almacenar, compartir y organizar archivos de clientes y proyectos.",
          en: "Storing, sharing, and organizing client and project files.",
        },
      },
      {
        name: "Google Docs",
        desc: {
          es: "Crear documentos, propuestas, briefings, guiones y entregables colaborativos.",
          en: "Writing documents, proposals, briefs, scripts, and collaborative deliverables.",
        },
      },
      {
        name: "Google Sheets",
        desc: {
          es: "Llevar controles, bases de datos, presupuestos, reportes y seguimiento operativo.",
          en: "Trackers, databases, budgets, reports, and operational follow-up.",
        },
      },
      {
        name: "Google Slides",
        desc: {
          es: "Crear presentaciones, propuestas comerciales, estrategias y pitch decks.",
          en: "Building presentations, commercial proposals, strategies, and pitch decks.",
        },
      },
      {
        name: "Google Meet",
        desc: {
          es: "Realizar juntas virtuales con clientes, colaboradores y equipos.",
          en: "Running virtual meetings with clients, collaborators, and teams.",
        },
      },
      {
        name: "Microsoft Excel",
        desc: {
          es: "Analizar datos, presupuestos, proyecciones, costos y reportes financieros.",
          en: "Analyzing data, budgets, projections, costs, and financial reports.",
        },
      },
      {
        name: "Zoom",
        desc: {
          es: "Realizar reuniones, talleres y sesiones virtuales, incluyendo salas de trabajo.",
          en: "Hosting meetings, workshops, and virtual sessions, including breakout rooms.",
        },
      },
      {
        name: "Fathom",
        desc: {
          es: "Grabar, transcribir y resumir automáticamente reuniones y llamadas.",
          en: "Recording, transcribing, and automatically summarizing meetings and calls.",
        },
      },
      {
        name: "Clockify",
        desc: {
          es: "Registrar horas trabajadas por persona, proyecto, tarea o cliente.",
          en: "Logging hours worked by person, project, task, or client.",
        },
      },
      {
        name: "Gather",
        desc: {
          es: "Crear oficinas virtuales donde el equipo puede reunirse e interactuar mediante avatares.",
          en: "Virtual offices where the team meets and interacts through avatars.",
        },
      },
    ],
  },
  {
    id: "media",
    title: {
      es: "Publicidad, marketing y distribución",
      en: "Advertising, marketing, and distribution",
    },
    direction: "left",
    items: [
      {
        name: "Meta Ads",
        desc: {
          es: "Crear y optimizar campañas publicitarias en Facebook e Instagram.",
          en: "Building and optimizing ad campaigns on Facebook and Instagram.",
        },
      },
      {
        name: "Google Ads",
        desc: {
          es: "Captar clientes mediante anuncios en búsquedas, sitios web, aplicaciones y YouTube.",
          en: "Capturing customers through search, display, app, and YouTube ads.",
        },
      },
      {
        name: "TikTok Ads",
        desc: {
          es: "Distribuir anuncios en TikTok para generar alcance, tráfico, leads y ventas.",
          en: "Running TikTok ads for reach, traffic, leads, and sales.",
        },
      },
      {
        name: "TikTok Shop",
        desc: {
          es: "Vender productos directamente dentro de TikTok mediante contenido, lives y afiliados.",
          en: "Selling products inside TikTok through content, lives, and affiliates.",
        },
      },
      {
        name: "LinkedIn",
        desc: {
          es: "Prospectar clientes B2B, reclutar talento y posicionar marcas o perfiles profesionales.",
          en: "B2B prospecting, recruiting talent, and positioning brands or professional profiles.",
        },
      },
      {
        name: "Instagram",
        desc: {
          es: "Publicar contenido, construir comunidad, generar conversación y atraer clientes.",
          en: "Publishing content, building community, sparking conversation, and attracting customers.",
        },
      },
      {
        name: "Facebook",
        desc: {
          es: "Gestionar comunidades, grupos, páginas, anuncios y audiencias.",
          en: "Managing communities, groups, pages, ads, and audiences.",
        },
      },
      {
        name: "TikTok",
        desc: {
          es: "Crear contenido de alcance orgánico, entretenimiento, educación y promoción.",
          en: "Creating organic-reach content for entertainment, education, and promotion.",
        },
      },
      {
        name: "YouTube",
        desc: {
          es: "Distribuir videos largos, campañas, entrevistas, tutoriales y contenido de posicionamiento.",
          en: "Distributing long-form video, campaigns, interviews, tutorials, and positioning content.",
        },
      },
      {
        name: "Google Analytics",
        desc: {
          es: "Medir tráfico, comportamiento, conversiones y resultados dentro de sitios y tiendas.",
          en: "Measuring traffic, behavior, conversions, and results across sites and stores.",
        },
      },
      {
        name: "Google Tag Manager",
        desc: {
          es: "Instalar y administrar píxeles, eventos y etiquetas de medición sin modificar constantemente el sitio.",
          en: "Installing and managing pixels, events, and tracking tags without constantly editing the site.",
        },
      },
      {
        name: "Looker Studio",
        desc: {
          es: "Crear dashboards visuales conectando datos de publicidad, ventas y analítica.",
          en: "Building visual dashboards that connect ad, sales, and analytics data.",
        },
      },
      {
        name: "PostHog",
        desc: {
          es: "Analizar cómo utilizan los usuarios una aplicación mediante eventos, recorridos, embudos y grabaciones.",
          en: "Analyzing how users move through an app via events, paths, funnels, and session replays.",
        },
      },
      {
        name: "HubSpot",
        desc: {
          es: "Gestionar contactos, ventas, marketing, CRM, formularios y automatizaciones.",
          en: "Managing contacts, sales, marketing, CRM, forms, and automations.",
        },
      },
      {
        name: "Klaviyo",
        desc: {
          es: "Crear campañas, segmentaciones y automatizaciones de email y SMS para e-commerce.",
          en: "Building email and SMS campaigns, segments, and automations for e-commerce.",
        },
      },
    ],
  },
  {
    id: "crm",
    title: { es: "CRM, automatización y mensajería", en: "CRM, automation, and messaging" },
    direction: "right",
    items: [
      {
        name: "GoHighLevel",
        desc: {
          es: "Centralizar CRM, pipelines, formularios, calendarios, email, SMS y automatizaciones comerciales.",
          en: "Centralizing CRM, pipelines, forms, calendars, email, SMS, and sales automations.",
        },
      },
      {
        name: "ManyChat",
        desc: {
          es: "Automatizar conversaciones, respuestas, captación y seguimiento principalmente en Instagram.",
          en: "Automating conversations, replies, lead capture, and follow-up mainly on Instagram.",
        },
      },
      {
        name: "WhatsApp Business",
        desc: {
          es: "Atender clientes, dar seguimiento, compartir catálogos y mantener conversaciones comerciales.",
          en: "Serving customers, following up, sharing catalogs, and holding sales conversations.",
        },
      },
      {
        name: "Zapia",
        desc: {
          es: "Asistente de IA dentro de WhatsApp para gestionar mensajes, consultas, reservas y otras tareas.",
          en: "An AI assistant inside WhatsApp to handle messages, questions, bookings, and other tasks.",
        },
      },
      {
        name: "Make",
        desc: {
          es: "Conectar aplicaciones y construir automatizaciones visuales sin desarrollar todo desde cero.",
          en: "Connecting apps and building visual automations without coding everything from scratch.",
        },
      },
      {
        name: "n8n",
        desc: {
          es: "Crear automatizaciones avanzadas, integraciones, agentes de IA y flujos personalizados.",
          en: "Building advanced automations, integrations, AI agents, and custom workflows.",
        },
      },
      {
        name: "Twilio",
        desc: {
          es: "Enviar y recibir mensajes de WhatsApp, SMS, llamadas y códigos de verificación mediante API.",
          en: "Sending and receiving WhatsApp, SMS, calls, and verification codes via API.",
        },
      },
      {
        name: "OneSignal",
        desc: {
          es: "Mandar notificaciones push a usuarios de sitios, aplicaciones y plataformas.",
          en: "Sending push notifications to users of sites, apps, and platforms.",
        },
      },
      {
        name: "Resend",
        desc: {
          es: "Enviar correos transaccionales desde aplicaciones, como confirmaciones, accesos y notificaciones.",
          en: "Sending transactional email from apps: confirmations, access links, and notifications.",
        },
      },
      {
        name: "OpenAI API",
        desc: {
          es: "Integrar generación de texto, análisis, asistentes y funcionalidades de IA dentro de productos.",
          en: "Embedding text generation, analysis, assistants, and AI features into products.",
        },
      },
    ],
  },
  {
    id: "ecommerce",
    title: {
      es: "E-commerce, ventas y fidelización",
      en: "E-commerce, sales, and loyalty",
    },
    direction: "left",
    items: [
      {
        name: "Shopify",
        desc: {
          es: "Construir, operar y hacer crecer tiendas en línea.",
          en: "Building, running, and growing online stores.",
        },
      },
      {
        name: "Shopify POS",
        desc: {
          es: "Registrar ventas físicas y sincronizarlas con inventario, clientes y productos de Shopify.",
          en: "Recording in-person sales and syncing them with Shopify inventory, customers, and products.",
        },
      },
      {
        name: "Shopify Liquid",
        desc: {
          es: "Personalizar temas, secciones y funcionalidades visuales dentro de Shopify.",
          en: "Customizing themes, sections, and visual functionality inside Shopify.",
        },
      },
      {
        name: "Fidelízalo",
        desc: {
          es: "Crear tarjetas de lealtad, monederos electrónicos, puntos y recompensas digitales para clientes.",
          en: "Creating loyalty cards, digital wallets, points, and rewards for customers.",
        },
      },
      {
        name: "Voccalo",
        desc: {
          es: "Acompañar alumnos de academias y reducir la deserción mediante seguimiento y continuidad fuera de clase.",
          en: "Supporting academy students and reducing dropout through follow-up and continuity outside class.",
        },
      },
    ],
  },
  {
    id: "build",
    title: {
      es: "Desarrollo de sitios y aplicaciones",
      en: "Site and app development",
    },
    direction: "right",
    items: [
      {
        name: "Lovable",
        desc: {
          es: "Crear aplicaciones web y productos digitales rápidamente utilizando instrucciones en lenguaje natural.",
          en: "Building web apps and digital products fast using natural-language instructions.",
        },
      },
      {
        name: "Base44",
        desc: {
          es: "Construir aplicaciones y sistemas internos con ayuda de inteligencia artificial y herramientas no-code.",
          en: "Building apps and internal systems with AI and no-code tooling.",
        },
      },
      {
        name: "Vercel",
        desc: {
          es: "Publicar, alojar y administrar sitios y aplicaciones web.",
          en: "Deploying, hosting, and managing websites and web apps.",
        },
      },
      {
        name: "Webflow",
        desc: {
          es: "Diseñar y desarrollar sitios web visualmente con control avanzado de layout y animaciones.",
          en: "Designing and building sites visually with advanced layout and animation control.",
        },
      },
      {
        name: "Framer",
        desc: {
          es: "Crear sitios web modernos, rápidos y visualmente atractivos con un editor de diseño.",
          en: "Creating modern, fast, visually strong websites in a design-first editor.",
        },
      },
      {
        name: "Supabase",
        desc: {
          es: "Base de datos, autenticación, almacenamiento y backend para aplicaciones.",
          en: "Database, authentication, storage, and backend for applications.",
        },
      },
      {
        name: "GitHub",
        desc: {
          es: "Guardar, versionar y colaborar sobre el código de sitios, aplicaciones y sistemas.",
          en: "Storing, versioning, and collaborating on code for sites, apps, and systems.",
        },
      },
      {
        name: "GitHub Actions",
        desc: {
          es: "Automatizar pruebas, despliegues y procesos técnicos asociados al código.",
          en: "Automating tests, deployments, and technical processes tied to the code.",
        },
      },
      {
        name: "Namecheap",
        desc: {
          es: "Comprar y administrar dominios, DNS y otros servicios relacionados con sitios web.",
          en: "Buying and managing domains, DNS, and related website services.",
        },
      },
    ],
  },
  {
    id: "stack",
    title: { es: "Tecnologías del stack", en: "Stack technologies" },
    direction: "left",
    items: [
      {
        name: "React",
        desc: {
          es: "Construir interfaces interactivas para aplicaciones y plataformas web.",
          en: "Building interactive interfaces for web apps and platforms.",
        },
      },
      {
        name: "TypeScript",
        desc: {
          es: "Desarrollar aplicaciones JavaScript con mayor estructura, control y prevención de errores.",
          en: "Writing JavaScript apps with more structure, control, and error prevention.",
        },
      },
      {
        name: "Tailwind CSS",
        desc: {
          es: "Diseñar interfaces mediante clases reutilizables y un sistema visual consistente.",
          en: "Designing interfaces with reusable classes and a consistent visual system.",
        },
      },
      {
        name: "shadcn/ui",
        desc: {
          es: "Componentes profesionales y personalizables para construir interfaces web.",
          en: "Professional, customizable components for building web interfaces.",
        },
      },
      {
        name: "SQL",
        desc: {
          es: "Consultar, organizar y administrar información almacenada en bases de datos.",
          en: "Querying, organizing, and managing data stored in databases.",
        },
      },
      {
        name: "PWA",
        desc: {
          es: "Convertir una plataforma web en una experiencia similar a una aplicación instalable.",
          en: "Turning a web platform into an installable, app-like experience.",
        },
      },
    ],
  },
];
