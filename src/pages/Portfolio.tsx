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
  { title: "Zoé Water — Evolución con Propósito", client: "Zoé Water", category: "Brand Identity", desc: "Refinamiento de logotipo, colección de stickers digitales con 30,000+ descargas, campaña de colaboración con Playmobil. Logo, marketing, advertising, social media, packing, branding y merchandise.", role: "Brand Strategy & Growth Manager", img: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663445384891/sSnOTstnVAIyYMic.jpg" },
  { title: "INDUMET — Industria Aeroespacial", client: "Indumet Aerospace", category: "Brand Identity", desc: "Identidad visual futurista para empresa aeroespacial. Logotipo moderno y vanguardista, sitio web innovador, branding completo alineado con la esencia del sector aeroespacial.", role: "Logo, Website, Branding", img: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663445384891/mdCAeemnwUZhbqGV.jpg" },
  { title: "Baileys — The Baileys Babe", client: "Baileys", category: "Advertising", desc: "Campaña 'The Baileys Babe' para rejuvenecer la marca. Sitio web, marketing digital, advertising y webmenu. Posicionamiento como la indulgencia perfecta para cualquier momento.", role: "Creative Direction", img: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663445384891/BzLqnsJyfVkbOGBg.jpg" },
  { title: "Ya Nos Vinos — Brindis por la Marca", client: "Ya Nos Vinos", category: "Content Strategy", desc: "Experiencia de marca vibrante y auténtica para amantes del vino. Feed dinámico, contenido inteligente, vehículo brandeado, social media strategy completa.", role: "Marketing, Advertising, RRSS, Branding", img: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663445384891/nMtedhczGaBcaXhh.jpg" },
  { title: "Panoramika — Experiencia Visual Dental", client: "Panoramika", category: "Advertising", desc: "Contenido que combina fotografía impresionante, infografías y datos para clínica dental. Espectaculares, social media, app mobile y branding completo.", role: "Logo, Marketing, Advertising, Social Media", img: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663445384891/rSpgZWrUkrkCzxyd.jpg" },
  { title: "RAGSAN — Gestión Municipal y Legal", client: "RAGSAN", category: "Product Design", desc: "App CAMU para presidentes municipales. Plataforma legal RAGSAN para gestión de expedientes. Visualización geográfica interactiva para decisiones en tiempo real.", role: "Website, Intranet, App, Social Media", img: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663445384891/nPfRKPmkZWnNjjuv.jpg" },
  { title: "El Carnalito — Sabor que Llega Más Lejos", client: "El Carnalito", category: "Advertising", desc: "Propuesta integral para apertura de nueva sucursal. Materiales promocionales, adaptación de identidad visual, espectaculares y social media para restaurante mexicano.", role: "Advertising & Social Media", img: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663445384891/KQjLLIBqvxIsdiqb.jpg" },
  { title: "Tiendas en Línea y Websites", client: "Múltiples clientes", category: "Product Design", desc: "Páginas web poderosas, intuitivas y responsivas. Plataformas digitales a medida, tiendas en línea, marketplaces (Amazon, MercadoLibre). Spring Air, fitness financiero, Autoline y más.", role: "Landing Pages, Websites, Apps & Ecommerce", img: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663445384891/BYLrjGrOJOKVdgon.jpg" },
  { title: "Oasis OS — Sistema Operativo", client: "Estudio Oasis", category: "Product Design", desc: "Diseño y desarrollo de producto para el sistema operativo de agencias. Bitácora, Hub de equipo, Money Guard y más.", role: "Founder & Product Designer", img: "https://d2xsxph8kpxj0f.cloudfront.net/310519663445384891/eFXXBswQmmosJvCxxJfAPY/os-product-UpwfCF6FLaSYDwR3ZBW5Jz.webp" },
  { title: "Brand Identity — Logos y Marcas", client: "Múltiples marcas", category: "Brand Identity", desc: "Colección de identidades de marca: Casa Arrebato, Gaston, Inefable, Thisabilities, Chico Basico, Mahalia, WAT4, Elian Beltran, UNO, Felix Media, Casa Nungaray, Claribel Hincapie, Ixtlahuaca. Más evolución de logos para Rocketfy y Zoé Water.", role: "Brand Identity & Strategy", img: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663445384891/UiruLEtuDDHnWuwK.jpg" },
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
