import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { SiteNavbar } from "@/components/SiteNavbar";
import { SiteFooter } from "@/components/SiteFooter";
import { PALETTE } from "@/components/home/heroContent";
import { useLang, type Bi } from "@/i18n/LanguageContext";

const EMAIL = "joserogelioteran@gmail.com";
const WHATSAPP = "525667701206";
const WA_URL = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
  "Hola Roger, vi tu sitio y me gustaría platicar.",
)}`;

const BIO: Bi[] = [
  { es: 'Soy José Rogelio "Roger" Terán Bueno. Estudié Psicología en el Tec de Monterrey y después Dirección Creativa en Miami Ad School. Entender cómo piensan las personas y cómo comunicar ideas es lo que ha definido mi carrera.', en: 'I'm José Rogelio "Roger" Terán Bueno. I studied Psychology at Tec de Monterrey and then Creative Direction at Miami Ad School. Understanding how people think and how to communicate ideas is what has defined my career.' },
  { es: "He trabajado en agencias como Ogilvy, Leo Burnett, Havas, FCB, Media.Monks y VML. Fui Director Creativo de Nivea en FCB y llevé la estrategia de marca en español de los San Francisco 49ers, que se convirtieron en el equipo #1 de la NFL en redes sociales en México.", en: "I've worked at agencies like Ogilvy, Leo Burnett, Havas, FCB, Media.Monks, and VML. I was Creative Director for Nivea at FCB and ran the Spanish-language brand strategy for the San Francisco 49ers, who became the #1 NFL team on social media in Mexico." },
  { es: "Como Chief Growth Officer en Rocketfy escalé el revenue mensual de $1.5M a $4M USD en dos trimestres, liderando equipos de más de 40 personas entre Growth, Data, BI y Producto. En Platzi trabajé en el equipo de crecimiento enfocado en retención.", en: "As Chief Growth Officer at Rocketfy I scaled monthly revenue from $1.5M to $4M USD in two quarters, leading teams of 40+ people across Growth, Data, BI, and Product. At Platzi I worked on the growth team focused on retention." },
  { es: "Hoy doy clase en Miami Ad School México (Copywriting, Branding, Creative Direction y Paid Media) y dirijo Estudio Oasis.", en: "Today I teach at Miami Ad School Mexico (Copywriting, Branding, Creative Direction, and Paid Media) and run Estudio Oasis." },
  { es: "Lo que mejor hago es traducir datos complejos en decisiones claras, alinear equipos alrededor de las métricas que sí importan y construir cosas que crecen porque resuelven un problema real.", en: "What I do best is turning complex data into clear decisions, aligning teams around the metrics that actually matter, and building things that grow because they solve a real problem." },
];

const TIMELINE: { years: string | Bi; role: Bi; company: string; desc: Bi }[] = [
  { years: "2011–2014", role: { es: "Becario de RH / Marketing interno", en: "HR / internal marketing intern" }, company: "Rassini", desc: { es: "Primeros pasos en comunicación organizacional y branding corporativo.", en: "First steps in organizational communication and corporate branding." } },
  { years: "2014–2016", role: { es: "Brand Manager", en: "Brand Manager" }, company: "Mundo Cuervo / José Cuervo", desc: { es: "Dirección creativa, marca y marketing experiencial para la división turística en Tequila, Jalisco.", en: "Creative direction, brand, and experiential marketing for the tourism division in Tequila, Jalisco." } },
  { years: "2015–2017", role: { es: "Creative Direction", en: "Creative Direction" }, company: "Miami Ad School", desc: { es: "Formación en dirección creativa y copywriting.", en: "Training in creative direction and copywriting." } },
  { years: "2016–2019", role: { es: "Growth Manager / CMO", en: "Growth Manager / CMO" }, company: "Zoe Water & 98 Coast Av.", desc: { es: "Estrategia creativa y growth. +200% de tráfico en Zoe Water y la campaña internacional “Living the Coast Life”.", en: "Creative strategy and growth. +200% traffic at Zoe Water and the international “Living the Coast Life” campaign." } },
  { years: "2019–2021", role: { es: "Retention Copywriter", en: "Retention Copywriter" }, company: "Platzi", desc: { es: "Equipo de crecimiento enfocado en retención y engagement. Profesor de creatividad.", en: "Growth team focused on retention and engagement. Creativity instructor." } },
  { years: "2021–2024", role: { es: "Chief Growth Officer", en: "Chief Growth Officer" }, company: "Rocketfy", desc: { es: "De $1.5M a $4M USD de revenue mensual en dos trimestres. Equipos de 40+ personas.", en: "From $1.5M to $4M USD in monthly revenue in two quarters. Teams of 40+ people." } },
  { years: { es: "2023–Hoy", en: "2023–Now" }, role: { es: "Profesor & mentor", en: "Professor & mentor" }, company: "Miami Ad School México", desc: { es: "Copywriting, Branding, Creative Direction, Paid Media y Design Systems.", en: "Copywriting, Branding, Creative Direction, Paid Media, and Design Systems." } },
  { years: "2024–2025", role: { es: "Brand Manager español", en: "Spanish-language Brand Manager" }, company: "San Francisco 49ers", desc: { es: "Estrategia de marca para el mercado hispanohablante. #1 en redes de la NFL en México.", en: "Brand strategy for the Spanish-speaking market. #1 NFL team on social in Mexico." } },
];

const SKILLS: { cat: Bi; tags: string[] }[] = [
  { cat: { es: "Estrategia", en: "Strategy" }, tags: ["Brand Strategy", "Growth Marketing", "Product-Led Growth", "CRO", "Neuromarketing"] },
  { cat: { es: "Creativo", en: "Creative" }, tags: ["Creative Direction", "Copywriting", "Art Direction", "Content Strategy", "Storytelling"] },
  { cat: { es: "Digital", en: "Digital" }, tags: ["Paid Media", "Performance", "SEO/SEM", "Social Media", "Email & CRM"] },
  { cat: { es: "Producto", en: "Product" }, tags: ["Product Design", "UX/UI", "Design Systems", "Frontend", "Data Analytics"] },
  { cat: { es: "Liderazgo", en: "Leadership" }, tags: ["Team Building", "Cross-functional teams", "OKRs", "Cultura", "Coaching"] },
  { cat: { es: "Herramientas", en: "Tools" }, tags: ["Figma", "Webflow", "Python", "GA4", "Shopify"] },
];

export default function AboutRogerPage() {
  const { t, pick } = useLang();
  return (
    <div className="min-h-screen font-body bg-[hsl(var(--paper))]">
      <div className="grain-overlay" aria-hidden />
      <SiteNavbar />

      <section className="pt-24 md:pt-28 pb-14 md:pb-20">
        <div className="max-w-[1700px] mx-auto px-4 md:px-6">
          <p className="font-label text-[10px] md:text-[11px] tracking-[0.35em] uppercase text-[hsl(var(--ink)/0.40)]">
            {t("Hola, soy", "Hi, I'm")}
          </p>
          <h1 className="mt-5 font-ultra text-[clamp(52px,13vw,240px)] md:text-[min(10.5vw,16vh)] leading-[0.9] text-[hsl(var(--ink))]">
            Roger <span className="text-[#C5221F]">Terán</span>
          </h1>
          <p className="mt-6 font-condensed text-[clamp(20px,3.6vw,42px)] md:text-[min(2.6vw,4.4vh)] leading-[1.08] text-[hsl(var(--ink)/0.45)] max-w-[46ch]">
            {t(
              "Product & growth con formación en psicología y dirección creativa. Fundador de Estudio Oasis.",
              "Product & growth, trained in psychology and creative direction. Founder of Estudio Oasis.",
            )}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={WA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="h-12 px-6 flex items-center font-label text-[10px] tracking-[0.2em] uppercase bg-[hsl(var(--ink))] text-[hsl(var(--paper))] hover:bg-[#C5221F] transition-colors"
            >
              WhatsApp
            </a>
            <a
              href={`mailto:${EMAIL}`}
              className="h-12 px-6 flex items-center font-label text-[10px] tracking-[0.2em] uppercase border-2 border-[hsl(var(--ink)/0.20)] text-[hsl(var(--ink))] hover:border-[hsl(var(--ink))] transition-colors"
            >
              {t("Correo", "Email")}
            </a>
            <a
              href="https://www.linkedin.com/in/rogerteran"
              target="_blank"
              rel="noopener noreferrer"
              className="h-12 px-6 flex items-center font-label text-[10px] tracking-[0.2em] uppercase border-2 border-[hsl(var(--ink)/0.20)] text-[hsl(var(--ink))] hover:border-[hsl(var(--ink))] transition-colors"
            >
              LinkedIn
            </a>
            <a
              href="https://instagram.com/oasistud.io"
              target="_blank"
              rel="noopener noreferrer"
              className="h-12 px-6 flex items-center font-label text-[10px] tracking-[0.2em] uppercase border-2 border-[hsl(var(--ink)/0.20)] text-[hsl(var(--ink))] hover:border-[hsl(var(--ink))] transition-colors"
            >
              Instagram
            </a>
          </div>
        </div>
      </section>

      {/* Bio */}
      <section className="border-t-2 border-[hsl(var(--ink))] py-12 md:py-20">
        <div className="max-w-[1700px] mx-auto px-4 md:px-6 grid md:grid-cols-[0.6fr_1.4fr] gap-8 md:gap-14">
          <h2 className="font-ultra text-[clamp(28px,6vw,80px)] md:text-[min(4.4vw,7vh)] leading-[0.95] text-[hsl(var(--ink))]">
            {t("Bio", "Short")} <span className="text-[hsl(var(--ink)/0.25)]">{t("breve.", "bio.")}</span>
          </h2>
          <div className="space-y-5 max-w-[70ch]">
            {BIO.map((p) => (
              <p
                key={p.es.slice(0, 24)}
                className="font-body text-[15px] md:text-[18px] leading-relaxed text-[hsl(var(--ink)/0.70)]"
              >
                {pick(p)}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* Trayectoria */}
      <section className="border-t-2 border-[hsl(var(--ink))] py-12 md:py-20">
        <div className="max-w-[1700px] mx-auto px-4 md:px-6">
          <h2 className="font-ultra text-[clamp(28px,6vw,80px)] md:text-[min(4.4vw,7vh)] leading-[0.95] text-[hsl(var(--ink))]">
            {t("Trayectoria", "Track record")}
          </h2>
          <div className="mt-8 border-t-2 border-[hsl(var(--ink))]">
            {TIMELINE.map((item, i) => (
              <div
                key={item.company}
                className="py-6 border-b border-[hsl(var(--ink)/0.15)] grid md:grid-cols-[160px_1fr_1.2fr] gap-2 md:gap-8"
              >
                <span className="font-label text-[10px] md:text-[11px] tracking-[0.2em] uppercase text-[hsl(var(--ink)/0.40)] pt-1">
                  {typeof item.years === "string" ? item.years : pick(item.years)}
                </span>
                <div>
                  <p
                    className="font-condensed text-[clamp(19px,2.6vw,32px)] leading-none"
                    style={{ color: PALETTE[i % PALETTE.length] }}
                  >
                    {item.company}
                  </p>
                  <p className="mt-1 font-body text-[14px] text-[hsl(var(--ink)/0.55)]">{pick(item.role)}</p>
                </div>
                <p className="font-body text-[15px] md:text-[16px] leading-relaxed text-[hsl(var(--ink)/0.65)]">
                  {pick(item.desc)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Skills */}
      <section className="bg-[hsl(var(--ink))] py-14 md:py-20">
        <div className="max-w-[1700px] mx-auto px-4 md:px-6">
          <h2 className="font-ultra text-[clamp(28px,6vw,80px)] md:text-[min(4.4vw,7vh)] leading-[0.95] text-[hsl(var(--paper))]">
            {t("Lo que sé hacer", "What I do")}
          </h2>
          <div className="mt-8 grid md:grid-cols-3 gap-8 border-t border-[hsl(var(--paper)/0.15)] pt-8">
            {SKILLS.map((s, i) => (
              <div key={s.cat.es}>
                <p
                  className="font-label text-[10px] tracking-[0.24em] uppercase"
                  style={{ color: PALETTE[i % PALETTE.length] }}
                >
                  {pick(s.cat)}
                </p>
                <p className="mt-3 font-condensed text-[clamp(17px,2vw,26px)] leading-[1.2] text-[hsl(var(--paper)/0.70)]">
                  {s.tags.join(" · ")}
                </p>
              </div>
            ))}
          </div>

          <Link
            to="/#brief"
            className="mt-12 inline-flex items-center gap-2 h-12 px-6 bg-[hsl(var(--paper))] text-[hsl(var(--ink))] hover:bg-[#C5221F] hover:text-[hsl(var(--paper))] transition-colors font-label text-[10px] tracking-[0.2em] uppercase"
          >
            {t("Cuéntame tu caso", "Tell me your case")} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
