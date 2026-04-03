import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Menu, X, ChevronDown, ExternalLink } from "lucide-react";

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
            <button className="text-[13px] font-medium text-[var(--dm-charcoal)]/60 hover:text-[var(--dm-charcoal)] flex items-center gap-1">About <ChevronDown className="h-3 w-3" /></button>
            {aboutOpen && (
              <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-[var(--dm-sand)] py-2 min-w-[180px]">
                <Link to="/about" className="block px-4 py-2 text-[13px] text-[var(--dm-charcoal)] hover:bg-[var(--dm-sand-light)]">Estudio Oasis</Link>
                <Link to="/about/roger-teran" className="block px-4 py-2 text-[13px] text-[var(--dm-charcoal)] hover:bg-[var(--dm-sand-light)]">Roger Terán</Link>
              </div>
            )}
          </div>
          <Link to="/portfolio" className="text-[13px] font-medium text-[var(--dm-gold)]">Portafolio</Link>
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
          <Link to="/about" onClick={() => setMobileOpen(false)} className="block text-sm">About</Link>
          <Link to="/portfolio" onClick={() => setMobileOpen(false)} className="block text-sm text-[var(--dm-gold)]">Portafolio</Link>
        </div>
      )}
    </nav>
  );
}

type Category = "Todos" | "Brand Identity" | "Advertising" | "Content Strategy" | "Product Design" | "Growth";

const PROJECTS: { title: string; client: string; category: Category; desc: string; role: string; img: string }[] = [
  { title: "Identidad de Marca Zoé Water", client: "Zoé Water", category: "Brand Identity", desc: "Desarrollo completo de identidad visual, packaging y estrategia de marca para agua premium mexicana. Incremento de +200% en tráfico web.", role: "Brand Strategy & Creative Direction", img: "https://images.unsplash.com/photo-1523362628745-0c100150b504?w=800&q=80" },
  { title: "98 Coast Avenue — Living the Coast Life", client: "98 Coast Avenue", category: "Brand Identity", desc: "Campaña internacional de marca lifestyle. Dirección creativa de la campaña 'Living the Coast Life' con presencia en mercados internacionales.", role: "CMO & Creative Direction", img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80" },
  { title: "Mundo Cuervo Experience", client: "José Cuervo", category: "Brand Identity", desc: "Desarrollo de marca y marketing experiencial para la división turística de José Cuervo en Tequila, Jalisco.", role: "Brand Manager", img: "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=800&q=80" },
  { title: "Nivea — Campaña Regional", client: "Nivea / FCB", category: "Advertising", desc: "Dirección creativa de campañas publicitarias para Nivea en la región. Trabajo realizado como Director Creativo en FCB.", role: "Creative Director @ FCB", img: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&q=80" },
  { title: "Baileys — Campaña Digital", client: "Baileys", category: "Advertising", desc: "Estrategia creativa y ejecución de campañas digitales para Baileys. Contenido para redes sociales y activaciones digitales.", role: "Creative Direction", img: "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=800&q=80" },
  { title: "SF 49ers — Estrategia en Español", client: "San Francisco 49ers", category: "Content Strategy", desc: "Estrategia de marca para el mercado hispanohablante. El equipo se convirtió en #1 en redes sociales de la NFL en México.", role: "Brand Manager Español", img: "https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=800&q=80" },
  { title: "Platzi — Retención & Crecimiento", client: "Platzi", category: "Content Strategy", desc: "Estrategias de retención y engagement para la plataforma de educación online más grande de Latinoamérica.", role: "Retention Copywriter & Profesor", img: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80" },
  { title: "Oasis OS — Sistema Operativo", client: "Estudio Oasis", category: "Product Design", desc: "Diseño y desarrollo de producto para el sistema operativo de agencias. Bitácora, Hub de equipo, Money Guard y más.", role: "Founder & Product Designer", img: "https://d2xsxph8kpxj0f.cloudfront.net/310519663445384891/eFXXBswQmmosJvCxxJfAPY/os-product-UpwfCF6FLaSYDwR3ZBW5Jz.webp" },
  { title: "Rocketfy — Growth Engine", client: "Rocketfy", category: "Growth", desc: "Escalé revenue mensual de $1.5M a $4M USD en dos trimestres. Lideré equipos de 40+ personas.", role: "Chief Growth Officer", img: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80" },
  { title: "Miami Ad School México", client: "Miami Ad School", category: "Content Strategy", desc: "Profesor de Copywriting, Branding, Creative Direction, Paid Media y Design Systems.", role: "Profesor & Mentor", img: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&q=80" },
];

const CATEGORIES: Category[] = ["Todos", "Brand Identity", "Advertising", "Content Strategy", "Product Design", "Growth"];

export default function Portfolio() {
  const [filter, setFilter] = useState<Category>("Todos");
  const filtered = filter === "Todos" ? PROJECTS : PROJECTS.filter((p) => p.category === filter);

  return (
    <div className="min-h-screen font-body bg-[var(--dm-cream)]">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-16 md:pt-40 md:pb-20 bg-[var(--dm-charcoal)]">
        <div className="max-w-6xl mx-auto px-6">
          <Reveal>
            <p className="font-mono-label text-[11px] tracking-[0.3em] uppercase text-[var(--dm-gold)] mb-4">Portafolio</p>
            <h1 className="font-serif-display text-[clamp(36px,6vw,64px)] leading-[1.05] text-[var(--dm-cream)]">
              Trabajo<br /><span className="italic text-[var(--dm-gold)]">seleccionado</span>
            </h1>
            <p className="mt-4 text-[16px] text-[var(--dm-cream)]/60 max-w-lg">
              Una selección de proyectos que representan 15+ años de experiencia en branding, advertising, contenido, producto y growth.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Filters */}
      <div className="sticky top-16 z-40 bg-[var(--dm-cream)] border-b border-[var(--dm-sand)] py-4">
        <div className="max-w-6xl mx-auto px-6 flex gap-2 overflow-x-auto">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`text-[13px] font-medium px-4 py-2 rounded-sm whitespace-nowrap transition-colors ${filter === c ? "bg-[var(--dm-charcoal)] text-[var(--dm-cream)]" : "bg-[var(--dm-sand-light)] text-[var(--dm-charcoal)]/60 hover:text-[var(--dm-charcoal)]"}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <section className="py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-8">
          {filtered.map((p, i) => (
            <Reveal key={p.title} delay={i * 80}>
              <div className="border border-[var(--dm-sand)] rounded-sm overflow-hidden bg-white group">
                <div className="aspect-[16/10] overflow-hidden">
                  <img src={p.img} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
                </div>
                <div className="p-5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-sm bg-[var(--dm-sand-light)] text-[var(--dm-charcoal)]/60">{p.category}</span>
                  <h3 className="mt-3 text-[17px] font-semibold text-[var(--dm-charcoal)]">{p.title}</h3>
                  <p className="text-[13px] text-[var(--dm-gold)] font-medium">{p.client}</p>
                  <p className="mt-2 text-[13px] text-[var(--dm-charcoal)]/60 leading-relaxed">{p.desc}</p>
                  <p className="mt-2 text-[11px] font-mono-label tracking-wider text-[var(--dm-charcoal)]/40 uppercase">{p.role}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-[var(--dm-sand-light)]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <Reveal>
            <h2 className="font-serif-display text-[clamp(20px,3vw,32px)] text-[var(--dm-charcoal)] mb-6">Explora más en mis perfiles</h2>
            <div className="flex flex-wrap justify-center gap-3">
              {[
                { label: "Behance", href: "https://behance.net/rogertern" },
                { label: "Instagram", href: "https://instagram.com/rayo_teran" },
                { label: "LinkedIn", href: "https://linkedin.com/in/rogerteran" },
              ].map((l) => (
                <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" className="h-10 px-5 rounded-sm border border-[var(--dm-sand)] text-[var(--dm-charcoal)] text-[13px] font-semibold flex items-center gap-2 hover:bg-white transition-colors">
                  {l.label} <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <footer className="py-10 bg-[var(--dm-charcoal)]">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between gap-4">
          <p className="text-[11px] text-[var(--dm-cream)]/30">© 2026 Estudio Oasis. Todos los derechos reservados.</p>
          <p className="text-[11px] text-[var(--dm-cream)]/30">Ciudad de México, México</p>
        </div>
      </footer>
    </div>
  );
}
