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
  label: string;
  kicker: string;
  body: string;
  detail: string;
  proof: string;
  color: string;
};

export const STAGES: Stage[] = [
  {
    id: "datos",
    n: "01",
    label: "Datos y estrategia",
    kicker: "Dónde estás parado",
    body: "Primero medimos. Auditamos tus números, tus canales y tu operación para decirte dónde estás hoy, a dónde puedes llegar y cuánto te va a costar llegar ahí.",
    detail:
      "Analítica, experimentación y pruebas reales: no opinamos, probamos. Todo lo que sigue se decide con datos, no con corazonadas.",
    proof: "Diagnóstico en días, no en meses.",
    color: PALETTE[0],
  },
  {
    id: "adquisicion",
    n: "02",
    label: "Adquisición",
    kicker: "Que te encuentren y te compren",
    body: "12 años corriendo pauta en todo lo que existe: Meta, Google, TikTok y TikTok Shop, LinkedIn, medios offline. B2B, B2C y D2C.",
    detail:
      "Desde ventas tradicionales y listas de leads para prospección en LinkedIn, hasta campañas de performance a escala. Siempre combinado con creatividad y marca: venimos de ser brand managers de Nivea, Spotify, San Francisco 49ers, 98 Coast Av., Caramela, Platzi, Rocketfy, Grupo Carso y Zoe Water.",
    proof: "Marca + performance en el mismo equipo.",
    color: PALETTE[1],
  },
  {
    id: "activacion",
    n: "03",
    label: "Activación",
    kicker: "Que la primera compra no sea suerte",
    body: "Activamos al usuario que ya llegó: programas de lealtad, CRMs a la medida, seguimiento por WhatsApp y email, newsletter y comunidad.",
    detail:
      "El objetivo es que la relación no termine en la primera venta: construimos la base para mandar campañas todo el año, mantener el negocio activo y convertir compradores en clientes de verdad.",
    proof: "CRM propio, no plantillas.",
    color: PALETTE[2],
  },
  {
    id: "retencion",
    n: "04",
    label: "Retención",
    kicker: "Que no se vayan",
    body: "No sólo traemos clientes nuevos: minimizamos el churn. Vemos conducta, cuánto gastan y cada cuánto, y actuamos antes de perderlos.",
    detail:
      "Usamos análisis RFM — Recencia (cuándo te compró por última vez), Frecuencia (cada cuánto compra) y Valor (cuánto deja). Con eso separamos a tus clientes champions de los dormidos y a cada grupo le hablamos distinto: lealtad, promociones y campañas para mover caja todo el año, no sólo en temporada.",
    proof: "El negocio se mueve los 12 meses.",
    color: PALETTE[3],
  },
  {
    id: "escala",
    n: "05",
    label: "Escala",
    kicker: "Cuando ya funciona, se multiplica",
    body: "Equipo comercial y de negociación internacional. Cerramos contratos, alianzas y estructuras que hacen crecer el negocio completo, no sólo la campaña.",
    detail:
      "Fuimos los primeros en convencer a FedEx México de aceptar pago contra entrega. Acompañamos a Smart Bimo de pequeño negocio a startup con rondas de inversión de millones de dólares y miles de emprendedores formados. En Rocketfy reconstruimos el sistema de crecimiento completo: academia, sistema de señales por usuario y trabajo mano a mano dentro de su Shopify.",
    proof: "Casos reales, no promesas.",
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

export const CAPABILITIES = [
  "Estrategia de Marca (Branding)",
  "Planeación Estratégica (Planning)",
  "Dirección Comercial (Revenue y Ventas)",
  "E-commerce (100m+ USD)",
  "Relaciones Públicas (Alianzas & Sponsorships)",
  "Compra de Medios (Digital Paid Media & Offline)",
  "Activaciones de Marca (Real-time on-site)",
  "Producción Audiovisual (Full-cycle)",
  "DevOps & Infra",
  "Product Design & Frontend",
  "Desarrollo de Software",
  "Data & Computer Science",
  "CRM & Lifecycle",
  "Sistemas de Atribución y Señales",
  "Dashboards",
  "IA",
  "Agentes",
  "Automatizaciones",
  "Eventos",
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
];
