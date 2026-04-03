import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Menu, X, ChevronDown, MapPin, GraduationCap, ExternalLink } from "lucide-react";

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

function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--dm-cream)]/95 backdrop-blur-xl border-b border-[var(--dm-sand)]">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="font-serif-display text-[20px] font-bold text-[var(--dm-charcoal)]">OASIS</Link>
        <div className="hidden md:flex items-center gap-8">
          <Link to="/" className="text-[13px] font-medium text-[var(--dm-charcoal)]/60 hover:text-[var(--dm-charcoal)]">Inicio</Link>
          <div className="relative group" onMouseEnter={() => setAboutOpen(true)} onMouseLeave={() => setAboutOpen(false)}>
            <button className="text-[13px] font-medium text-[var(--dm-gold)] flex items-center gap-1">About <ChevronDown className="h-3 w-3" /></button>
            {aboutOpen && (
              <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-[var(--dm-sand)] py-2 min-w-[180px]">
                <Link to="/about" className="block px-4 py-2 text-[13px] text-[var(--dm-charcoal)] hover:bg-[var(--dm-sand-light)]">Estudio Oasis</Link>
                <Link to="/about/roger-teran" className="block px-4 py-2 text-[13px] text-[var(--dm-charcoal)] hover:bg-[var(--dm-sand-light)]">Roger Terán</Link>
              </div>
            )}
          </div>
          <Link to="/portfolio" className="text-[13px] font-medium text-[var(--dm-charcoal)]/60 hover:text-[var(--dm-charcoal)]">Portafolio</Link>
          <Link to="/login" className="text-[13px] font-medium text-[var(--dm-charcoal)]/60 hover:text-[var(--dm-charcoal)]">Oasis OS</Link>
          <Link to="/signup" className="h-9 px-5 rounded-sm bg-[var(--dm-charcoal)] text-[var(--dm-cream)] text-[13px] font-semibold flex items-center">Probar gratis</Link>
        </div>
        <button className="md:hidden text-[var(--dm-charcoal)]" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {mobileOpen && (
        <div className="md:hidden bg-[var(--dm-cream)] border-b border-[var(--dm-sand)] px-6 pb-4 space-y-3">
          <Link to="/" onClick={() => setMobileOpen(false)} className="block text-sm">Inicio</Link>
          <Link to="/about" onClick={() => setMobileOpen(false)} className="block text-sm">Estudio Oasis</Link>
          <Link to="/about/roger-teran" onClick={() => setMobileOpen(false)} className="block text-sm text-[var(--dm-gold)]">Roger Terán</Link>
          <Link to="/portfolio" onClick={() => setMobileOpen(false)} className="block text-sm">Portafolio</Link>
        </div>
      )}
    </nav>
  );
}

const TIMELINE = [
  { years: "2011–2014", role: "Becario de RH / Marketing Interno", company: "Rassini", desc: "Primeros pasos en comunicación organizacional, marketing interno y branding corporativo." },
  { years: "2014–2016", role: "Brand Manager", company: "Mundo Cuervo / José Cuervo", desc: "Dirección creativa, desarrollo de marca y marketing experiencial para la división turística de José Cuervo en Tequila, Jalisco." },
  { years: "2015–2017", role: "Creative Direction", company: "Miami Ad School", desc: "Formación en dirección creativa y copywriting en una de las escuelas de publicidad más reconocidas del mundo." },
  { years: "2016–2019", role: "Growth Manager / CMO", company: "Zoé Water & 98 Coast Avenue", desc: "Liderazgo de estrategia creativa y growth. +200% tráfico web en Zoé Water. Campaña internacional 'Living the Coast Life' en 98 Coast Av." },
  { years: "2019–2021", role: "Retention Copywriter", company: "Platzi", desc: "Equipo de crecimiento. Estrategias para reducir churn y mantener engagement. Profesor de Creatividad." },
  { years: "2021–2024", role: "Chief Growth Officer", company: "Rocketfy", desc: "Escalé revenue mensual de $1.5M a $4M USD en dos trimestres. Lideré equipos de 40+ personas en Growth, Data, BI y Producto." },
  { years: "2023–Presente", role: "Profesor & Mentor", company: "Miami Ad School México", desc: "Copywriting, Branding, Creative Direction, Paid Media, Design Systems. Formando talento creativo senior." },
  { years: "2024–2025", role: "Brand Manager Español", company: "San Francisco 49ers", desc: "Estrategia de marca para el mercado hispanohablante. El equipo se convirtió en #1 en redes sociales de la NFL en México." },
  { years: "2025–Presente", role: "Founder", company: "Estudio Oasis / Oasis OS", desc: "Estudio creativo y sistema operativo para agencias y equipos de servicios." },
];

const EXPERTISE = [
  { cat: "Estrategia", tags: ["Brand Strategy", "Growth Marketing", "Product-Led Growth", "CRO", "Neuromarketing"] },
  { cat: "Creativo", tags: ["Creative Direction", "Copywriting", "Art Direction", "Content Strategy", "Storytelling"] },
  { cat: "Digital", tags: ["Paid Media", "Performance Marketing", "SEO/SEM", "Social Media", "Email Marketing"] },
  { cat: "Producto", tags: ["Product Design", "UX/UI", "Design Systems", "Frontend", "Data Analytics"] },
  { cat: "Liderazgo", tags: ["Team Building", "Cross-functional Leadership", "OKRs", "Cultura", "Coaching"] },
  { cat: "Herramientas", tags: ["Figma", "Webflow", "Python", "Google Analytics 4", "Shopify"] },
];

export default function AboutRoger() {
  return (
    <div className="min-h-screen font-body bg-[var(--dm-cream)]">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-16 md:pt-40 md:pb-20 bg-[var(--dm-charcoal)]">
        <div className="relative max-w-6xl mx-auto px-6">
          <Reveal>
            <p className="font-mono-label text-[11px] tracking-[0.3em] uppercase text-[var(--dm-gold)] mb-4">Sobre Roger</p>
            <h1 className="font-serif-display text-[clamp(36px,6vw,64px)] leading-[1.05] text-[var(--dm-cream)]">
              José Rogelio<br /><span className="italic text-[var(--dm-gold)]">"Roger" Terán</span>
            </h1>
            <p className="mt-4 text-[16px] text-[var(--dm-cream)]/60 max-w-lg">
              Product & Growth Leader con formación en psicología y una trayectoria que combina marketing, producto y toma de decisiones basada en datos.
            </p>
          </Reveal>
          <div className="mt-8 flex gap-6 border-b border-[var(--dm-cream)]/10">
            <Link to="/about" className="pb-3 text-[14px] text-[var(--dm-cream)]/50 hover:text-[var(--dm-cream)]/70">Estudio Oasis</Link>
            <Link to="/about/roger-teran" className="pb-3 text-[14px] font-semibold text-[var(--dm-cream)] border-b-2 border-[var(--dm-gold)]">Roger Terán</Link>
          </div>
        </div>
      </section>

      {/* Bio */}
      <section className="py-24 md:py-36">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-5 gap-16">
          {/* Sidebar */}
          <div className="md:col-span-2 md:sticky md:top-24 self-start">
            <Reveal>
              <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663445384891/eFXXBswQmmosJvCxxJfAPY/about-roger-XN3CDjsVCtGvdF5hcCG8Sk.webp" alt="Roger Terán" className="rounded-sm w-full object-cover mb-6" />
              <div className="space-y-3 text-[13px] text-[var(--dm-charcoal)]/70">
                <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-[var(--dm-gold)]" /> Ciudad de México, México</div>
                <div className="flex items-start gap-2"><GraduationCap className="h-4 w-4 text-[var(--dm-gold)] mt-0.5 shrink-0" />
                  <div>BS Psicología — Tec de Monterrey<br />Creative Direction — Miami Ad School<br />Social Justice — Harvard University</div>
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                {[
                  { label: "LinkedIn", href: "https://linkedin.com/in/rogerteran" },
                  { label: "Behance", href: "https://behance.net/rogertern" },
                  { label: "Instagram", href: "https://instagram.com/rayo_teran" },
                ].map((l) => (
                  <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" className="text-[12px] text-[var(--dm-gold)] hover:text-[var(--dm-gold-light)] flex items-center gap-1">
                    {l.label} <ExternalLink className="h-3 w-3" />
                  </a>
                ))}
              </div>
            </Reveal>
          </div>

          {/* Content */}
          <div className="md:col-span-3">
            <Reveal>
              <p className="font-mono-label text-[11px] tracking-[0.3em] uppercase text-[var(--dm-gold)] mb-4">Sobre Roger</p>
              <h2 className="font-serif-display text-[clamp(24px,3.5vw,40px)] leading-tight text-[var(--dm-charcoal)]">
                Product & Growth Leader<br /><span className="italic text-[var(--dm-terracotta)]">con alma creativa</span>
              </h2>
            </Reveal>
            <Reveal delay={100}>
              <div className="mt-6 space-y-4 text-[15px] text-[var(--dm-charcoal)]/70 leading-relaxed">
                <p>Soy José Rogelio "Roger" Terán Bueno. Estudié Psicología en el Tec de Monterrey y después Dirección Creativa en Miami Ad School. Esa combinación — entender cómo piensan las personas y cómo comunicar ideas — ha definido toda mi carrera.</p>
                <p>He trabajado en agencias como Ogilvy, Leo Burnett, Havas, FCB, Media Monks y VML. Fui Director Creativo para Nivea en FCB. Lideré la estrategia de marca en español de los San Francisco 49ers, convirtiéndolos en el equipo #1 en redes sociales de la NFL en México.</p>
                <p>Como Chief Growth Officer en Rocketfy, escalé el revenue mensual de $1.5M a $4M USD en dos trimestres, liderando equipos de más de 40 personas. En Platzi, trabajé en el equipo de crecimiento enfocado en retención.</p>
                <p>Hoy soy profesor en Miami Ad School México, donde enseño Copywriting, Branding, Creative Direction y Paid Media. Y soy el fundador de Estudio Oasis y Oasis OS — donde condenso todo lo que aprendí en 15+ años de agencias en un sistema que le pone proceso a la creatividad.</p>
                <p>Mi principal fortaleza es traducir data compleja en decisiones estratégicas claras, alinear equipos alrededor de métricas que realmente importan y construir productos y experiencias que crecen porque resuelven problemas reales.</p>
              </div>
              <Link to="/portfolio" className="inline-block mt-6 text-[12px] font-semibold uppercase tracking-[0.15em] text-[var(--dm-gold)] hover:text-[var(--dm-gold-light)]">
                Ver mi portafolio →
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Expertise */}
      <section className="py-20 bg-[var(--dm-sand-light)]">
        <div className="max-w-6xl mx-auto px-6">
          <Reveal>
            <h2 className="font-serif-display text-[clamp(24px,3vw,36px)] text-[var(--dm-charcoal)] text-center mb-12">Áreas de conocimiento</h2>
          </Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {EXPERTISE.map((e, i) => (
              <Reveal key={e.cat} delay={i * 80}>
                <div className="border border-[var(--dm-sand)] rounded-sm p-5 bg-white">
                  <h3 className="text-[14px] font-semibold text-[var(--dm-charcoal)] mb-3">{e.cat}</h3>
                  <div className="flex flex-wrap gap-2">
                    {e.tags.map((t) => (
                      <span key={t} className="text-[11px] px-2.5 py-1 rounded-sm bg-[var(--dm-sand-light)] text-[var(--dm-charcoal)]/70 font-medium">{t}</span>
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
            <h2 className="font-serif-display text-[clamp(24px,3vw,36px)] text-[var(--dm-charcoal)] text-center mb-16">15+ años de experiencia</h2>
          </Reveal>
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-[var(--dm-sand)]" />
            <div className="space-y-12">
              {TIMELINE.map((t, i) => (
                <Reveal key={i} delay={i * 60}>
                  <div className={`relative flex items-start gap-8 ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"}`}>
                    {/* Dot */}
                    <div className="absolute left-4 md:left-1/2 -translate-x-1/2 h-3 w-3 rounded-full bg-[var(--dm-gold)] border-2 border-[var(--dm-cream)] z-10" />
                    {/* Content */}
                    <div className={`ml-12 md:ml-0 md:w-[45%] ${i % 2 === 0 ? "md:text-right md:pr-8" : "md:text-left md:pl-8"}`}>
                      <span className="font-mono-label text-[11px] tracking-wider text-[var(--dm-gold)]">{t.years}</span>
                      <h3 className="text-[15px] font-semibold text-[var(--dm-charcoal)] mt-1">{t.role}</h3>
                      <p className="text-[13px] font-medium text-[var(--dm-terracotta)]">{t.company}</p>
                      <p className="text-[13px] text-[var(--dm-charcoal)]/60 mt-1 leading-relaxed">{t.desc}</p>
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
      <section className="py-24 md:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <Reveal>
            <p className="font-mono-label text-[11px] tracking-[0.3em] uppercase text-[var(--dm-gold)] mb-4 text-center">Trabajo destacado</p>
            <h2 className="font-serif-display text-[clamp(24px,3vw,36px)] text-[var(--dm-charcoal)] text-center mb-4">Una muestra del trabajo creativo y estratégico</h2>
            <p className="text-center text-[15px] text-[var(--dm-charcoal)]/60 mb-12">de más de 15 años.</p>
          </Reveal>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { cat: "Brand Identity", img: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663445384891/EWExAWOaittuhJAz.jpg", desc: "Casa Nungaray mezcal, Ixtlahuaca, Intimo, Pure Pleasure — identidades visuales completas con aplicaciones", span: true },
              { cat: "Advertising", img: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663445384891/UyPfhdmMyVFygNQx.jpg", desc: "Cubbo fulfillment, Mabe, All Bran, Platzi Day — campañas publicitarias multiplataforma" },
              { cat: "Content Strategy", img: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663445384891/QMCVJuyUlmXGSQMq.jpg", desc: "Kit-Cat Clock social media, Rocketfy Galaxia Ventas — estrategia de contenido y social media" },
              { cat: "Product Design", img: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663445384891/qtAYITXkazAKTMAv.jpg", desc: "Sedes, Mango app, Nouvet, alarm app — diseño web, apps móviles y plataformas digitales" },
              { cat: "Logos & Branding", img: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663445384891/UiruLEtuDDHnWuwK.jpg", desc: "13+ identidades de marca creadas — desde mezcal artesanal hasta tech startups" },
            ].map((item, i) => (
              <Reveal key={item.cat} delay={i * 80} className={item.span ? "md:col-span-2" : ""}>
                <Link to={`/portfolio`} className="block border border-[var(--dm-sand)] rounded-sm overflow-hidden bg-white group">
                  <div className={`${item.span ? "aspect-[2/1]" : "aspect-[16/10]"} overflow-hidden`}>
                    <img src={item.img} alt={item.cat} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
                  </div>
                  <div className="p-4">
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-sm bg-[var(--dm-sand-light)] text-[var(--dm-charcoal)]/60">{item.cat}</span>
                    <p className="mt-2 text-[13px] text-[var(--dm-charcoal)]/60 leading-relaxed">{item.desc}</p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-[var(--dm-charcoal)]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <Reveal>
            <h2 className="font-serif-display text-[clamp(24px,4vw,44px)] text-[var(--dm-cream)]">
              Ve mi <span className="italic text-[var(--dm-gold)]">trabajo</span>
            </h2>
            <Link to="/portfolio" className="mt-8 inline-flex h-12 px-7 rounded-sm bg-[var(--dm-gold)] text-[var(--dm-charcoal)] text-[14px] font-semibold items-center gap-2 hover:bg-[var(--dm-gold-light)]">
              Ver portafolio <ArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>
        </div>
      </section>

      <footer className="py-10 bg-[var(--dm-charcoal)] border-t border-[var(--dm-cream)]/10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between gap-4">
          <p className="text-[11px] text-[var(--dm-cream)]/30">© 2026 Estudio Oasis. Todos los derechos reservados.</p>
          <p className="text-[11px] text-[var(--dm-cream)]/30">Ciudad de México, México</p>
        </div>
      </footer>
    </div>
  );
}
