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
  /** Short kicker shown above the answer inside the modal */
  kicker: string;
  /** Placeholder copy — se reemplaza con los textos definitivos */
  body: string;
  color: string;
  /** Relative tile weight for the puzzle layout */
  span: number;
};

export const PILLARS: Answer[] = [
  {
    id: "adquisicion",
    label: "Adquisición",
    kicker: "Pilar 01",
    body: "Cómo hacemos que la gente correcta te encuentre y compre: medios pagados, contenido, alianzas y señales limpias de atribución.",
    color: PALETTE[0],
    span: 1,
  },
  {
    id: "activacion",
    label: "Activación",
    kicker: "Pilar 02",
    body: "Cómo convertimos ese primer contacto en una primera compra: onboarding, oferta, mensaje y fricción cero.",
    color: PALETTE[1],
    span: 1,
  },
  {
    id: "retencion",
    label: "Retención",
    kicker: "Pilar 03",
    body: "Cómo hacemos que regresen: CRM, lifecycle, comunidad y producto que cumple lo que la marca promete.",
    color: PALETTE[2],
    span: 1,
  },
  {
    id: "ltv",
    label: "Lifetime Value (LTV)",
    kicker: "Pilar 04",
    body: "Cómo hacemos que cada cliente valga más con el tiempo: pricing, recompra, upsell y economía unitaria sana.",
    color: PALETTE[3],
    span: 1,
  },
];

export const PAIN_POINTS: Answer[] = [
  {
    id: "mas-ventas",
    label: "Más ventas en mi tienda online",
    kicker: "E-commerce",
    body: "Auditamos tu embudo completo, arreglamos las fugas y escalamos con medios pagados y CRM. Hemos operado tiendas de 100m+ USD.",
    color: PALETTE[0],
    span: 3,
  },
  {
    id: "conozcan",
    label: "Quiero que me conozcan de verdad",
    kicker: "Branding",
    body: "Construimos una identidad con posición, no con adornos: naming, sistema visual, narrativa y activaciones que la gente recuerda.",
    color: PALETTE[3],
    span: 3,
  },
  {
    id: "agencia",
    label: "Mi agencia me está viendo la cara",
    kicker: "Auditoría",
    body: "Revisamos cuentas, contratos, atribución y entregables. Te decimos qué se está pagando, qué sirve y qué no.",
    color: PALETTE[7],
    span: 2,
  },
  {
    id: "ayuda",
    label: "Tengo un problema, necesito ayuda",
    kicker: "Fixers",
    body: "Entramos rápido, diagnosticamos y ejecutamos. Somos el equipo que llega cuando ya hay que arreglar cosas.",
    color: PALETTE[4],
    span: 2,
  },
  {
    id: "intente-todo",
    label: "Ya intenté de todo",
    kicker: "Diagnóstico",
    body: "Casi siempre el problema no es el canal, es el sistema. Ordenamos oferta, medición y operación antes de gastar un peso más.",
    color: PALETTE[2],
    span: 2,
  },
  {
    id: "no-vendo",
    label: "No vendo nada",
    kicker: "Revenue",
    body: "Empezamos por la oferta y el precio, no por el anuncio. Después construimos la máquina de adquisición.",
    color: PALETTE[1],
    span: 2,
  },
  {
    id: "arreglar",
    label: "Tengo mucho que arreglar",
    kicker: "Sistemas",
    body: "Priorizamos por impacto: qué mueve caja este mes y qué construye marca los próximos tres años.",
    color: PALETTE[5],
    span: 2,
  },
  {
    id: "unico",
    label: "Soy el único que se preocupa",
    kicker: "Equipo",
    body: "Te damos un equipo de 30+ expertos que se comporta como socio: métricas a la vista y responsabilidad clara.",
    color: PALETTE[6],
    span: 2,
  },
];
