import type { Bi } from "@/i18n/LanguageContext";

export type Chapter = {
  id: string;
  number: string;
  eyebrow: Bi;
  title: Bi;
  paragraphs: Bi[];
  statement?: Bi;
};

export const chapters: Chapter[] = [
  {
    id: "criterio",
    number: "01",
    eyebrow: { es: "Manifiesto", en: "Manifesto" },
    title: { es: "El marketing sin criterio sí está muriendo.", en: "Marketing without judgment is dying." },
    paragraphs: [
      { es: "La IA produce anuncios, una landing se construye en horas y las plataformas toman más decisiones solas. Eso es extraordinario.", en: "AI produces ads, a landing can be built in hours, and platforms make more decisions on their own. That is extraordinary." },
      { es: "Pero si ejecutar se vuelve más barato, pensar correctamente se vuelve más valioso. La pregunta no es si alguien sabe usar Meta Ads; es si sabe qué anunciar, a quién, por qué importa y cuánto puede pagar el negocio por conseguirlo.", en: "But when execution gets cheaper, thinking correctly becomes more valuable. The question is not whether someone can use Meta Ads; it is whether they know what to advertise, to whom, why it matters, and what the business can afford to pay." },
    ],
    statement: { es: "UNA HERRAMIENTA NO ES UNA ESTRATEGIA.", en: "A TOOL IS NOT A STRATEGY." },
  },
  {
    id: "maquina",
    number: "02",
    eyebrow: { es: "La máquina", en: "The machine" },
    title: { es: "Growth no es “hacer marketing”.", en: "Growth is not “doing marketing.”" },
    paragraphs: [
      { es: "Producto → Oferta → Adquisición → Conversión → Venta → Retención → Recomendación. Datos, experimentación, tecnología y operación atraviesan todo el sistema.", en: "Product → Offer → Acquisition → Conversion → Sale → Retention → Referral. Data, experimentation, technology, and operations run through the entire system." },
      { es: "Anuncios extraordinarios con una mala oferta pierden. Leads sin seguimiento pierden. Ventas sin margen pierden. El trabajo serio empieza encontrando el cuello de botella, no eligiendo una campaña.", en: "Great ads with a bad offer lose. Leads without follow-up lose. Sales without margin lose. Serious work begins by finding the bottleneck, not choosing a campaign." },
    ],
    statement: { es: "¿DÓNDE ESTÁ REALMENTE EL CUELLO DE BOTELLA?", en: "WHERE IS THE REAL BOTTLENECK?" },
  },
  {
    id: "dashboard",
    number: "03",
    eyebrow: { es: "Diagnóstico", en: "Diagnosis" },
    title: { es: "Tu dashboard también puede venderte humo.", en: "Your dashboard can sell you smoke, too." },
    paragraphs: [
      { es: "CTR arriba. CPC abajo. Leads arriba. Todo verde. La caja: ¿? Una métrica intermediaria no es un resultado empresarial.", en: "CTR up. CPC down. Leads up. Everything is green. Cash flow: ? An intermediate metric is not a business outcome." },
      { es: "Un lead no es una venta. Ingresos no son margen. Atribución no siempre significa causalidad. El marketing puede tardar, experimentar y fallar; lo que no debe hacer es operar sin una tesis sobre cómo crea valor.", en: "A lead is not a sale. Revenue is not margin. Attribution does not always mean causality. Marketing can take time, experiment, and fail; it should not operate without a thesis for how it creates value." },
    ],
    statement: { es: "PUEDES DELEGAR LA EJECUCIÓN. NO PUEDES DELEGAR EL CRITERIO.", en: "YOU CAN DELEGATE EXECUTION. YOU CANNOT DELEGATE JUDGMENT." },
  },
  {
    id: "responsabilidad",
    number: "04",
    eyebrow: { es: "Responsabilidad", en: "Accountability" },
    title: { es: "La parte que los empresarios tampoco queremos escuchar.", en: "The part business owners do not want to hear either." },
    paragraphs: [
      { es: "Si tres agencias no funcionaron, quizá las tres eran malas. Pero también hay que preguntar si conoces tus márgenes, tu costo de adquisición, la recompra y dónde se caen los prospectos.", en: "If three agencies failed, perhaps all three were bad. But you should also ask whether you know your margins, acquisition cost, repeat purchase, and where prospects drop off." },
      { es: "No necesitas convertirte en marketer. Necesitas entender suficiente marketing para dirigir una empresa que hace marketing, compartir los números y exigir hipótesis verificables.", en: "You do not need to become a marketer. You need to understand enough marketing to run a company that does marketing, share the numbers, and demand testable hypotheses." },
    ],
  },
];

export const framework: { title: Bi; body: Bi }[] = [
  { title: { es: "Producto", en: "Product" }, body: { es: "¿La gente quiere lo que vendes, cumple su promesa y lo recomendaría?", en: "Do people want what you sell, does it deliver its promise, and would they recommend it?" } },
  { title: { es: "Economía", en: "Economics" }, body: { es: "¿Qué margen deja una venta, cuánto puedes pagar por adquirirla y cuándo regresa ese dinero?", en: "What margin does a sale leave, what can you pay to acquire it, and when does that money return?" } },
  { title: { es: "Distribución", en: "Distribution" }, body: { es: "¿Dónde y cómo te descubre el mercado: paid, orgánico, ventas, partners o referidos?", en: "Where and how does the market find you: paid, organic, sales, partners, or referrals?" } },
  { title: { es: "Conversión", en: "Conversion" }, body: { es: "¿Qué debe ocurrir entre conocerte y pagarte? Oferta, confianza, checkout, ventas y seguimiento.", en: "What must happen between discovering you and paying you? Offer, trust, checkout, sales, and follow-up." } },
  { title: { es: "Retención", en: "Retention" }, body: { es: "¿Qué provoca que un cliente vuelva, compre más, recomiende o genere al siguiente?", en: "What makes a customer return, buy more, refer others, or generate the next customer?" } },
];

export const sources = [
  ["Product–Market Fit", "Y Combinator Library", "https://www.ycombinator.com/library"],
  ["Growth Loops", "Reforge", "https://www.reforge.com/blog/growth-loops"],
  ["North Star Metrics", "Reforge", "https://www.reforge.com/blog/north-star-metrics"],
  ["Growth, Marketing & Sales", "McKinsey", "https://www.mckinsey.com/capabilities/growth-marketing-and-sales/our-insights"],
  ["Conversion Lift", "Google Ads Help", "https://support.google.com/google-ads/answer/12003020"],
  ["Demografía de los Negocios", "INEGI", "https://www.inegi.org.mx/programas/dn/"],
] as const;
