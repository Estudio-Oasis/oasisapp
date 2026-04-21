import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, MapPin, GraduationCap, ExternalLink, Mail } from "lucide-react";
import { SiteNavbar } from "@/components/SiteNavbar";
import { SiteFooter } from "@/components/SiteFooter";

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, visible } = useReveal();
  return (
    <div ref={ref} className={`transition-all duration-700 ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

const TIMELINE = [
  { years: "2011–2014", role: "Becario de RH / Marketing Interno", company: "Rassini", desc: "Primeros pasos en comunicación organizacional, marketing interno y branding corporativo." },
  { years: "2014–2016", role: "Brand Manager", company: "Mundo Cuervo / José Cuervo", desc: "Dirección creativa, desarrollo de marca y marketing experiencial para la división turística de José Cuervo en Tequila, Jalisco." },
  { years: "2015–2017", role: "Creative Direction", company: "Miami Ad School", desc: "Formación en dirección creativa y copywriting en una de las escuelas de publicidad más reconocidas del mundo." },
  { years: "2016–2019", role: "Growth Manager / CMO", company: "Zoé Water & 98 Coast Avenue", desc: "Liderazgo de estrategia creativa y growth. +200% tráfico web en Zoé Water. Campaña internacional 'Living the Coast Life' en 98 Coast Av." },
  { years: "2019–2021", role: "Retention Copywriter", company: "Platzi", desc: "Equipo de crecimiento enfocado en retención y engagement. Profesor de Creatividad." },
  { years: "2021–2024", role: "Chief Growth Officer", company: "Rocketfy", desc: "Escalé revenue mensual de $1.5M a $4M USD en dos trimestres. Lideré equipos de 40+ personas en Growth, Data, BI y Producto." },
  { years: "2023–Presente", role: "Profesor & Mentor", company: "Miami Ad School México", desc: "Copywriting, Branding, Creative Direction, Paid Media, Design Systems. Formando talento creativo senior." },
  { years: "2024–2025", role: "Brand Manager Español", company: "San Francisco 49ers", desc: "Estrategia de marca para el mercado hispanohablante. El equipo se convirtió en #1 en redes sociales de la NFL en México." },
];

const EXPERTISE = [
  { cat: "Estrategia", tags: ["Brand Strategy", "Growth Marketing", "Product-Led Growth", "CRO", "Neuromarketing"] },
  { cat: "Creativo", tags: ["Creative Direction", "Copywriting", "Art Direction", "Content Strategy", "Storytelling"] },
  { cat: "Digital", tags: ["Paid Media", "Performance Marketing", "SEO/SEM", "Social Media", "Email Marketing"] },
  { cat: "Producto", tags: ["Product Design", "UX/UI", "Design Systems", "Frontend", "Data Analytics"] },
  { cat: "Liderazgo", tags: ["Team Building", "Cross-functional Leadership", "OKRs", "Cultura", "Coaching"] },
  { cat: "Herramientas", tags: ["Figma", "Webflow", "Python", "Google Analytics 4", "Shopify"] },
];

const FEATURED_WORK = [
  { cat: "Brand Identity", img: "https://d2xsxph8kpxj0f.cloudfront.net/310519663445384891/eFXXBswQmmosJvCxxJfAPY/roger_brand_identity_bf807ff9.jpg", desc: "Casa Nungaray mezcal, Ixtlahuaca, Intimo, Pure Pleasure — identidades visuales completas con aplicaciones", span: true },
  { cat: "Advertising", img: "https://d2xsxph8kpxj0f.cloudfront.net/310519663445384891/eFXXBswQmmosJvCxxJfAPY/roger_advertising_61e40ef1.jpg", desc: "Cubbo fulfillment, Mabe, All Bran, Platzi Day — campañas publicitarias multiplataforma" },
  { cat: "Content Strategy", img: "https://d2xsxph8kpxj0f.cloudfront.net/310519663445384891/eFXXBswQmmosJvCxxJfAPY/roger_content_strategy_f5a25f34.jpg", desc: "Kit-Cat Clock social media, Rocketfy Galaxia Ventas — estrategia de contenido y social media" },
  { cat: "Product Design", img: "https://d2xsxph8kpxj0f.cloudfront.net/310519663445384891/eFXXBswQmmosJvCxxJfAPY/roger_product_design_fcdbb4ef.jpg", desc: "Sedes, Mango app, Nouvet, alarm app — diseño web, apps móviles y plataformas digitales" },
  { cat: "Logos & Branding", img: "https://d2xsxph8kpxj0f.cloudfront.net/310519663445384891/eFXXBswQmmosJvCxxJfAPY/roger_logos_grid_0f4cd52b.jpg", desc: "15+ identidades de marca creadas — desde mezcal artesanal hasta tech startups" },
  { cat: "Logo Evolution", img: "https://d2xsxph8kpxj0f.cloudfront.net/310519663445384891/eFXXBswQmmosJvCxxJfAPY/roger_logo_evolution_58c31615.jpg", desc: "Evolución de logos para Rocketfy y Zoé Water — refinamiento estratégico de marca" },
];

export default function AboutRoger() {
  return (
    <div className="min-h-screen font-body bg-[#FAF7F2]">
      <SiteNavbar />

      {/* Hero */}
      <section className="relative pt-32 pb-16 md:pt-40 md:pb-20 bg-[#1C1917]">
        <div className="relative max-w-6xl mx-auto px-6">
          <Reveal>
            <p className="font-mono-label text-[11px] tracking-[0.3em] uppercase text-[#C8A96E] mb-4">Hola, soy</p>
            <h1 className="font-serif-display text-[clamp(36px,6vw,64px)] leading-[1.05] text-white">
              José Rogelio<br /><span className="italic text-[#C8A96E]">"Roger" Terán</span>
            </h1>
            <p className="mt-4 text-[16px] text-[#A8A29E] max-w-lg">
              Product & Growth Leader con formación en psicología y una trayectoria que combina marketing, producto y toma de decisiones basada en datos.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/portfolio" className="h-11 px-6 rounded-sm bg-[#C8A96E] text-[#1C1917] text-[13px] font-semibold flex items-center gap-2 hover:bg-[#D4B87A] transition-colors">
                Ver portafolio <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="mailto:r@estudiooasis.com" className="h-11 px-6 rounded-sm border border-white/20 text-white text-[13px] font-semibold flex items-center gap-2 hover:bg-white/5 transition-colors">
                <Mail className="h-4 w-4" /> Contáctame
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Bio */}
      <section className="py-24 md:py-36">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-5 gap-16">
          <div className="md:col-span-2 md:sticky md:top-24 self-start">
            <Reveal>
              <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663445384891/eFXXBswQmmosJvCxxJfAPY/about-roger-XN3CDjsVCtGvdF5hcCG8Sk.webp" alt="Roger Terán" className="rounded-sm w-full object-cover mb-6" />
              <div className="space-y-3 text-[13px] text-[#57534E]">
                <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-[#C8A96E]" /> Ciudad de México, México</div>
                <div className="flex items-start gap-2"><GraduationCap className="h-4 w-4 text-[#C8A96E] mt-0.5 shrink-0" />
                  <div>BS Psicología — Tec de Monterrey<br />Creative Direction — Miami Ad School<br />Social Justice — Harvard University</div>
                </div>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                {[
                  { label: "LinkedIn", href: "https://linkedin.com/in/rogerteran" },
                  { label: "Behance", href: "https://behance.net/rogertern" },
                  { label: "Instagram", href: "https://instagram.com/rayo_teran" },
                ].map((l) => (
                  <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" className="text-[12px] text-[#C8A96E] hover:text-[#D4B87A] flex items-center gap-1">
                    {l.label} <ExternalLink className="h-3 w-3" />
                  </a>
                ))}
              </div>
            </Reveal>
          </div>

          <div className="md:col-span-3">
            <Reveal>
              <p className="font-mono-label text-[11px] tracking-[0.3em] uppercase text-[#C8A96E] mb-4">Sobre mí</p>
              <h2 className="font-serif-display text-[clamp(24px,3.5vw,40px)] leading-tight text-[#1C1917]">
                Product & Growth Leader<br /><span className="italic text-[#B85C38]">con alma creativa</span>
              </h2>
            </Reveal>
            <Reveal delay={100}>
              <div className="mt-6 space-y-4 text-[15px] text-[#57534E] leading-relaxed">
                <p>Soy José Rogelio "Roger" Terán Bueno. Estudié Psicología en el Tec de Monterrey y después Dirección Creativa en Miami Ad School. Esa combinación — entender cómo piensan las personas y cómo comunicar ideas — ha definido toda mi carrera.</p>
                <p>He trabajado en agencias como Ogilvy, Leo Burnett, Havas, FCB, Media Monks y VML. Fui Director Creativo para Nivea en FCB. Lideré la estrategia de marca en español de los San Francisco 49ers, convirtiéndolos en el equipo #1 en redes sociales de la NFL en México.</p>
                <p>Como Chief Growth Officer en Rocketfy, escalé el revenue mensual de $1.5M a $4M USD en dos trimestres, liderando equipos de más de 40 personas. En Platzi, trabajé en el equipo de crecimiento enfocado en retención.</p>
                <p>Hoy soy profesor en Miami Ad School México, donde enseño Copywriting, Branding, Creative Direction y Paid Media.</p>
                <p>Mi principal fortaleza es traducir data compleja en decisiones estratégicas claras, alinear equipos alrededor de métricas que realmente importan y construir productos y experiencias que crecen porque resuelven problemas reales.</p>
              </div>
              <Link to="/portfolio" className="inline-block mt-6 text-[12px] font-semibold uppercase tracking-[0.15em] text-[#C8A96E] hover:text-[#D4B87A]">
                Ver mi portafolio →
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Expertise */}
      <section className="py-20 bg-[#F0E8DD]">
        <div className="max-w-6xl mx-auto px-6">
          <Reveal>
            <h2 className="font-serif-display text-[clamp(24px,3vw,36px)] text-[#1C1917] text-center mb-12">Áreas de conocimiento</h2>
          </Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {EXPERTISE.map((e, i) => (
              <Reveal key={e.cat} delay={i * 80}>
                <div className="border border-[#E7E0D8] rounded-sm p-5 bg-white">
                  <h3 className="text-[14px] font-semibold text-[#1C1917] mb-3">{e.cat}</h3>
                  <div className="flex flex-wrap gap-2">
                    {e.tags.map((t) => (
                      <span key={t} className="text-[11px] px-2.5 py-1 rounded-sm bg-[#F0E8DD] text-[#57534E] font-medium">{t}</span>
                    ))}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-24 md:py-32">
        <div className="max-w-4xl mx-auto px-6">
          <Reveal>
            <h2 className="font-serif-display text-[clamp(24px,3vw,36px)] text-[#1C1917] text-center mb-16">15+ años de experiencia</h2>
          </Reveal>
          <div className="relative">
            <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-[#E7E0D8]" />
            <div className="space-y-12">
              {TIMELINE.map((t, i) => (
                <Reveal key={i} delay={i * 60}>
                  <div className={`relative flex items-start gap-8 ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"}`}>
                    <div className="absolute left-4 md:left-1/2 -translate-x-1/2 h-3 w-3 rounded-full bg-[#C8A96E] border-2 border-[#FAF7F2] z-10" />
                    <div className={`ml-12 md:ml-0 md:w-[45%] ${i % 2 === 0 ? "md:text-right md:pr-8" : "md:text-left md:pl-8"}`}>
                      <span className="font-mono-label text-[11px] tracking-wider text-[#C8A96E]">{t.years}</span>
                      <h3 className="text-[15px] font-semibold text-[#1C1917] mt-1">{t.role}</h3>
                      <p className="text-[13px] font-medium text-[#B85C38]">{t.company}</p>
                      <p className="text-[13px] text-[#57534E] mt-1 leading-relaxed">{t.desc}</p>
                    </div>
                    <div className="hidden md:block md:w-[45%]" />
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trabajo Destacado */}
      <section className="py-24 md:py-32 bg-[#F0E8DD]">
        <div className="max-w-6xl mx-auto px-6">
          <Reveal>
            <p className="font-mono-label text-[11px] tracking-[0.3em] uppercase text-[#C8A96E] mb-4 text-center">Trabajo destacado</p>
            <h2 className="font-serif-display text-[clamp(24px,3vw,36px)] text-[#1C1917] text-center mb-4">Una muestra del trabajo creativo y estratégico</h2>
            <p className="text-center text-[15px] text-[#57534E] mb-12">de más de 15 años.</p>
          </Reveal>
          <div className="grid md:grid-cols-2 gap-6">
            {FEATURED_WORK.map((item, i) => (
              <Reveal key={item.cat} delay={i * 80} className={item.span ? "md:col-span-2" : ""}>
                <Link to="/portfolio" className="block border border-[#E7E0D8] rounded-sm overflow-hidden bg-white group">
                  <div className={`${item.span ? "aspect-[2/1]" : "aspect-[16/10]"} overflow-hidden`}>
                    <img src={item.img} alt={item.cat} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500" loading="lazy" />
                  </div>
                  <div className="p-4">
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-sm bg-[#F0E8DD] text-[#57534E]">{item.cat}</span>
                    <p className="mt-2 text-[13px] text-[#57534E] leading-relaxed">{item.desc}</p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-[#1C1917]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <Reveal>
            <h2 className="font-serif-display text-[clamp(24px,4vw,44px)] text-white">
              Trabajemos <span className="italic text-[#C8A96E]">juntos</span>
            </h2>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/portfolio" className="h-12 px-7 rounded-sm bg-[#C8A96E] text-[#1C1917] text-[14px] font-semibold flex items-center gap-2 hover:bg-[#D4B87A]">
                Ver portafolio <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="mailto:r@estudiooasis.com" className="h-12 px-7 rounded-sm border border-white/20 text-white text-[14px] font-semibold flex items-center gap-2 hover:bg-white/5">
                <Mail className="h-4 w-4" /> Escríbeme
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
