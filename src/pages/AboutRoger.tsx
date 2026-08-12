import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { SiteNavbar } from "@/components/SiteNavbar";
import { SiteFooter } from "@/components/SiteFooter";
import { PALETTE } from "@/components/home/heroContent";

const EMAIL = "joserogelioteran@gmail.com";
const WHATSAPP = "525667701206";
const WA_URL = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
  "Hola Roger, vi tu sitio y me gustaría platicar.",
)}`;

const BIO = [
  'Soy José Rogelio "Roger" Terán Bueno. Estudié Psicología en el Tec de Monterrey y después Dirección Creativa en Miami Ad School. Entender cómo piensan las personas y cómo comunicar ideas es lo que ha definido mi carrera.',
  "He trabajado en agencias como Ogilvy, Leo Burnett, Havas, FCB, Media.Monks y VML. Fui Director Creativo de Nivea en FCB y llevé la estrategia de marca en español de los San Francisco 49ers, que se convirtieron en el equipo #1 de la NFL en redes sociales en México.",
  "Como Chief Growth Officer en Rocketfy escalé el revenue mensual de $1.5M a $4M USD en dos trimestres, liderando equipos de más de 40 personas entre Growth, Data, BI y Producto. En Platzi trabajé en el equipo de crecimiento enfocado en retención.",
  "Hoy doy clase en Miami Ad School México (Copywriting, Branding, Creative Direction y Paid Media) y dirijo Estudio Oasis.",
  "Lo que mejor hago es traducir datos complejos en decisiones claras, alinear equipos alrededor de las métricas que sí importan y construir cosas que crecen porque resuelven un problema real.",
];

const TIMELINE = [
  { years: "2011–2014", role: "Becario de RH / Marketing interno", company: "Rassini", desc: "Primeros pasos en comunicación organizacional y branding corporativo." },
  { years: "2014–2016", role: "Brand Manager", company: "Mundo Cuervo / José Cuervo", desc: "Dirección creativa, marca y marketing experiencial para la división turística en Tequila, Jalisco." },
  { years: "2015–2017", role: "Creative Direction", company: "Miami Ad School", desc: "Formación en dirección creativa y copywriting." },
  { years: "2016–2019", role: "Growth Manager / CMO", company: "Zoe Water & 98 Coast Av.", desc: "Estrategia creativa y growth. +200% de tráfico en Zoe Water y la campaña internacional “Living the Coast Life”." },
  { years: "2019–2021", role: "Retention Copywriter", company: "Platzi", desc: "Equipo de crecimiento enfocado en retención y engagement. Profesor de creatividad." },
  { years: "2021–2024", role: "Chief Growth Officer", company: "Rocketfy", desc: "De $1.5M a $4M USD de revenue mensual en dos trimestres. Equipos de 40+ personas." },
  { years: "2023–Hoy", role: "Profesor & mentor", company: "Miami Ad School México", desc: "Copywriting, Branding, Creative Direction, Paid Media y Design Systems." },
  { years: "2024–2025", role: "Brand Manager español", company: "San Francisco 49ers", desc: "Estrategia de marca para el mercado hispanohablante. #1 en redes de la NFL en México." },
];

const SKILLS = [
  { cat: "Estrategia", tags: ["Brand Strategy", "Growth Marketing", "Product-Led Growth", "CRO", "Neuromarketing"] },
  { cat: "Creativo", tags: ["Creative Direction", "Copywriting", "Art Direction", "Content Strategy", "Storytelling"] },
  { cat: "Digital", tags: ["Paid Media", "Performance", "SEO/SEM", "Social Media", "Email & CRM"] },
  { cat: "Producto", tags: ["Product Design", "UX/UI", "Design Systems", "Frontend", "Data Analytics"] },
  { cat: "Liderazgo", tags: ["Team Building", "Equipos cross-funcionales", "OKRs", "Cultura", "Coaching"] },
  { cat: "Herramientas", tags: ["Figma", "Webflow", "Python", "GA4", "Shopify"] },
];

export default function AboutRogerPage() {
  return (
    <div className="min-h-screen font-body bg-[#FCFCFA]">
      <div className="grain-overlay" aria-hidden />
      <SiteNavbar />

      <section className="pt-24 md:pt-28 pb-14 md:pb-20">
        <div className="max-w-[1700px] mx-auto px-4 md:px-6">
          <p className="font-mono-label text-[10px] md:text-[11px] tracking-[0.35em] uppercase text-[#111110]/40">
            Hola, soy
          </p>
          <h1 className="mt-5 font-ultra text-[clamp(52px,13vw,240px)] md:text-[min(10.5vw,16vh)] leading-[0.9] text-[#111110]">
            Roger <span className="text-[#C5221F]">Terán</span>
          </h1>
          <p className="mt-6 font-condensed text-[clamp(20px,3.6vw,42px)] md:text-[min(2.6vw,4.4vh)] leading-[1.08] text-[#111110]/45 max-w-[46ch]">
            Product & growth con formación en psicología y dirección creativa. Fundador de Estudio
            Oasis.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={WA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="h-12 px-6 flex items-center font-mono-label text-[10px] tracking-[0.2em] uppercase bg-[#111110] text-[#FCFCFA] hover:bg-[#C5221F] transition-colors"
            >
              WhatsApp
            </a>
            <a
              href={`mailto:${EMAIL}`}
              className="h-12 px-6 flex items-center font-mono-label text-[10px] tracking-[0.2em] uppercase border-2 border-[#111110]/20 text-[#111110] hover:border-[#111110] transition-colors"
            >
              Correo
            </a>
            <a
              href="https://www.linkedin.com/in/rogerteran"
              target="_blank"
              rel="noopener noreferrer"
              className="h-12 px-6 flex items-center font-mono-label text-[10px] tracking-[0.2em] uppercase border-2 border-[#111110]/20 text-[#111110] hover:border-[#111110] transition-colors"
            >
              LinkedIn
            </a>
            <a
              href="https://instagram.com/oasistud.io"
              target="_blank"
              rel="noopener noreferrer"
              className="h-12 px-6 flex items-center font-mono-label text-[10px] tracking-[0.2em] uppercase border-2 border-[#111110]/20 text-[#111110] hover:border-[#111110] transition-colors"
            >
              Instagram
            </a>
          </div>
        </div>
      </section>

      {/* Bio */}
      <section className="border-t-2 border-[#111110] py-12 md:py-20">
        <div className="max-w-[1700px] mx-auto px-4 md:px-6 grid md:grid-cols-[0.6fr_1.4fr] gap-8 md:gap-14">
          <h2 className="font-ultra text-[clamp(28px,6vw,80px)] md:text-[min(4.4vw,7vh)] leading-[0.95] text-[#111110]">
            Bio <span className="text-[#111110]/25">breve.</span>
          </h2>
          <div className="space-y-5 max-w-[70ch]">
            {BIO.map((p) => (
              <p key={p.slice(0, 24)} className="font-body text-[15px] md:text-[18px] leading-relaxed text-[#111110]/70">
                {p}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* Trayectoria */}
      <section className="border-t-2 border-[#111110] py-12 md:py-20">
        <div className="max-w-[1700px] mx-auto px-4 md:px-6">
          <h2 className="font-ultra text-[clamp(28px,6vw,80px)] md:text-[min(4.4vw,7vh)] leading-[0.95] text-[#111110]">
            Trayectoria
          </h2>
          <div className="mt-8 border-t-2 border-[#111110]">
            {TIMELINE.map((t, i) => (
              <div
                key={t.years + t.company}
                className="py-6 border-b border-[#111110]/15 grid md:grid-cols-[160px_1fr_1.2fr] gap-2 md:gap-8"
              >
                <span className="font-mono-label text-[10px] md:text-[11px] tracking-[0.2em] uppercase text-[#111110]/40 pt-1">
                  {t.years}
                </span>
                <div>
                  <p
                    className="font-condensed text-[clamp(19px,2.6vw,32px)] leading-none"
                    style={{ color: PALETTE[i % PALETTE.length] }}
                  >
                    {t.company}
                  </p>
                  <p className="mt-1 font-body text-[14px] text-[#111110]/55">{t.role}</p>
                </div>
                <p className="font-body text-[15px] md:text-[16px] leading-relaxed text-[#111110]/65">
                  {t.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Skills */}
      <section className="bg-[#111110] py-14 md:py-20">
        <div className="max-w-[1700px] mx-auto px-4 md:px-6">
          <h2 className="font-ultra text-[clamp(28px,6vw,80px)] md:text-[min(4.4vw,7vh)] leading-[0.95] text-[#FCFCFA]">
            Lo que sé hacer
          </h2>
          <div className="mt-8 grid md:grid-cols-3 gap-8 border-t border-[#FCFCFA]/15 pt-8">
            {SKILLS.map((s, i) => (
              <div key={s.cat}>
                <p
                  className="font-mono-label text-[10px] tracking-[0.24em] uppercase"
                  style={{ color: PALETTE[i % PALETTE.length] }}
                >
                  {s.cat}
                </p>
                <p className="mt-3 font-condensed text-[clamp(17px,2vw,26px)] leading-[1.2] text-[#FCFCFA]/70">
                  {s.tags.join(" · ")}
                </p>
              </div>
            ))}
          </div>

          <Link
            to="/#brief"
            className="mt-12 inline-flex items-center gap-2 h-12 px-6 bg-[#FCFCFA] text-[#111110] hover:bg-[#C5221F] hover:text-[#FCFCFA] transition-colors font-mono-label text-[10px] tracking-[0.2em] uppercase"
          >
            Cuéntame tu caso <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
