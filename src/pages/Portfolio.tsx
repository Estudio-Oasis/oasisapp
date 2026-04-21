import { useState, useEffect, useRef, useCallback } from "react";
import { ExternalLink, X, ChevronLeft, ChevronRight } from "lucide-react";
import { SiteNavbar } from "@/components/SiteNavbar";
import { SiteFooter } from "@/components/SiteFooter";
import brandIdentityCollection from "@/assets/portfolio/brand-identity-collection.png";
import advertisingStrategy from "@/assets/portfolio/advertising-strategy.png";
import contentStrategyImg from "@/assets/portfolio/content-strategy.png";

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

type Category = "Todos" | "Brand Identity" | "Advertising" | "Content Strategy" | "Product Design" | "Growth" | "Gaming";

type Project = {
  title: string;
  client: string;
  category: Category;
  desc: string;
  role: string;
  img: string;
  /** When true, the image is shown contained (full image visible) on a neutral background.
   *  When false, the image fills the frame (cover). Default: true. */
  contain?: boolean;
  /** Optional YouTube video ID. When present, the card and lightbox embed the video. */
  youtubeId?: string;
};

const PROJECTS: Project[] = [
  { title: "San Francisco 49ers", client: "San Francisco 49ers", category: "Growth", desc: "Estrategia de marca para el mercado hispanohablante. El equipo se convirtió en #1 en redes sociales de la NFL en México.", role: "Brand Manager Español", img: "https://d2xsxph8kpxj0f.cloudfront.net/310519663445384891/eFXXBswQmmosJvCxxJfAPY/oasis_49ers_6d7ee2c0.jpg" },
  { title: "Rocketfy", client: "Rocketfy", category: "Growth", desc: "Como Chief Growth Officer, escalé el revenue mensual de $1.5M a $4M USD en dos trimestres.", role: "Chief Growth Officer", img: "https://d2xsxph8kpxj0f.cloudfront.net/310519663445384891/eFXXBswQmmosJvCxxJfAPY/oasis_rocketfy_d8528d42.jpg" },
  { title: "Liverpool Gourmet", client: "Liverpool", category: "Brand Identity", desc: "Materiales de branding para el mercado gourmet de Liverpool. Texturas de mármol negro, recetario, packaging premium.", role: "Branding & Packaging", img: "https://d2xsxph8kpxj0f.cloudfront.net/310519663445384891/eFXXBswQmmosJvCxxJfAPY/oasis_liverpool_46662b18.jpg" },
  { title: "Mundo Cuervo", client: "José Cuervo", category: "Brand Identity", desc: "Dirección creativa, desarrollo de marca y marketing experiencial para la división turística de José Cuervo.", role: "Brand Manager", img: "https://d2xsxph8kpxj0f.cloudfront.net/310519663445384891/eFXXBswQmmosJvCxxJfAPY/oasis_josecuervo_4a462909.jpg" },
  { title: "Zoé Water", client: "Zoé Water", category: "Brand Identity", desc: "Refinamiento de logotipo, colección de stickers digitales con 30,000+ descargas, campaña con Playmobil.", role: "Brand Strategy & Growth", img: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663445384891/sSnOTstnVAIyYMic.jpg" },
  { title: "INDUMET Aerospace", client: "Indumet", category: "Brand Identity", desc: "Identidad visual futurista para empresa aeroespacial. Logotipo moderno, sitio web innovador, branding completo.", role: "Logo, Website, Branding", img: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663445384891/mdCAeemnwUZhbqGV.jpg" },
  { title: "The Baileys Babe", client: "Baileys", category: "Advertising", desc: "Campaña 'The Baileys Babe' para rejuvenecer la marca. Sitio web, marketing digital, advertising y webmenu.", role: "Creative Direction", img: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663445384891/BzLqnsJyfVkbOGBg.jpg" },
  { title: "Café Society", client: "Café Society", category: "Content Strategy", desc: "Dirección artística para Instagram, estrategia de contenido cohesivo, website y social media.", role: "Logo, Website, Marketing, Social, Branding", img: "https://d2xsxph8kpxj0f.cloudfront.net/310519663445384891/eFXXBswQmmosJvCxxJfAPY/oasis_cafe_society_3d651b9d.jpg" },
  { title: "98 Coast Avenue", client: "98 Coast Avenue", category: "Advertising", desc: "Campaña internacional 'Living the Coast Life'. Marketing digital, advertising, social media y branding.", role: "Marketing, Advertising, Social, Branding", img: "https://d2xsxph8kpxj0f.cloudfront.net/310519663445384891/eFXXBswQmmosJvCxxJfAPY/oasis_98coast_322b6ebd.jpg" },
  { title: "Ya Nos Vinos", client: "Ya Nos Vinos", category: "Content Strategy", desc: "Experiencia de marca vibrante y auténtica para amantes del vino. Feed dinámico, contenido inteligente.", role: "Marketing, Advertising, RRSS, Branding", img: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663445384891/nMtedhczGaBcaXhh.jpg" },
  { title: "Panoramika", client: "Panoramika", category: "Advertising", desc: "Contenido que combina fotografía, infografías y datos para clínica dental. Espectaculares, social media, app.", role: "Logo, Marketing, Social Media", img: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663445384891/rSpgZWrUkrkCzxyd.jpg" },
  { title: "Platzi", client: "Platzi", category: "Growth", desc: "Equipo de crecimiento enfocado en retención. Estrategias para reducir churn y mantener engagement.", role: "Retention Copywriter & Growth", img: "https://d2xsxph8kpxj0f.cloudfront.net/310519663445384891/eFXXBswQmmosJvCxxJfAPY/oasis_platzi_7158a39e.jpg" },
  { title: "RAGSAN", client: "RAGSAN", category: "Product Design", desc: "App CAMU para presidentes municipales. Plataforma legal para gestión de expedientes.", role: "Website, Intranet, App, Social", img: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663445384891/nPfRKPmkZWnNjjuv.jpg" },
  { title: "El Carnalito", client: "El Carnalito", category: "Advertising", desc: "Propuesta integral para apertura de nueva sucursal. Materiales promocionales, espectaculares y social media.", role: "Advertising & Social Media", img: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663445384891/KQjLLIBqvxIsdiqb.jpg" },
  { title: "Tiendas en Línea & Websites", client: "Múltiples clientes", category: "Product Design", desc: "Páginas web poderosas, intuitivas y responsivas. Plataformas digitales a medida, tiendas en línea.", role: "Landing, Websites, Apps & Ecommerce", img: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663445384891/BYLrjGrOJOKVdgon.jpg" },
  { title: "Oasis OS", client: "Estudio Oasis", category: "Product Design", desc: "Diseño y desarrollo de producto para el sistema operativo de agencias creativas.", role: "Founder & Product Designer", img: "https://d2xsxph8kpxj0f.cloudfront.net/310519663445384891/eFXXBswQmmosJvCxxJfAPY/os-product-UpwfCF6FLaSYDwR3ZBW5Jz.webp", contain: false },
  { title: "Brand Identity Collection", client: "Casa Nungaray · Ixtlahuaca · Apolo & más", category: "Brand Identity", desc: "Sistema visual completo para Casa Nungaray (Mezcal de Cata, Oaxaca), branding institucional Ixtlahuaca, identidad Apolo y dirección creativa para múltiples marcas.", role: "Brand Identity, Packaging & Strategy", img: brandIdentityCollection },
  { title: "Advertising Strategy", client: "Cubbo · Mabe · Kellogg's · Platzi", category: "Advertising", desc: "Campañas multi-marca: lanzamiento Cubbo (fulfillment), Mabe estufas doble deli, All-Bran de Kellogg's y Platzi Day. Estrategia, copy y dirección de arte.", role: "Creative Direction & Copywriting", img: advertisingStrategy },
  { title: "Content Strategy", client: "Kit-Cat Klock · Rocketfy", category: "Content Strategy", desc: "Dirección de contenido para Kit-Cat Klock (USA, the iconic clock with eyes desde 1932) y Rocketfy: pop culture, narrativa visual y feeds que convierten.", role: "Content Direction & Social Strategy", img: contentStrategyImg },
  { title: "Game Trailer — Dirección Musical & Edición", client: "Gaming", category: "Gaming", desc: "Dirigí la música del trailer y edité el corte final para sincronizar ritmo, impacto y narrativa visual del juego.", role: "Music Direction & Video Editing", img: "https://img.youtube.com/vi/5u5ptgu1PRU/maxresdefault.jpg", contain: false, youtubeId: "5u5ptgu1PRU" },
];

const CATEGORIES: Category[] = ["Todos", "Brand Identity", "Advertising", "Content Strategy", "Product Design", "Growth", "Gaming"];

export default function Portfolio() {
  const [filter, setFilter] = useState<Category>("Todos");
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const filtered = filter === "Todos" ? PROJECTS : PROJECTS.filter((p) => p.category === filter);

  const closeLightbox = useCallback(() => setLightboxIdx(null), []);
  const prevLightbox = useCallback(() => setLightboxIdx((i) => (i === null ? null : (i - 1 + filtered.length) % filtered.length)), [filtered.length]);
  const nextLightbox = useCallback(() => setLightboxIdx((i) => (i === null ? null : (i + 1) % filtered.length)), [filtered.length]);

  useEffect(() => {
    if (lightboxIdx === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") prevLightbox();
      if (e.key === "ArrowRight") nextLightbox();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handler);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handler);
    };
  }, [lightboxIdx, closeLightbox, prevLightbox, nextLightbox]);

  return (
    <div className="min-h-screen font-body bg-[#FAF7F2]">
      <SiteNavbar />

      {/* Hero */}
      <section className="pt-32 pb-16 md:pt-40 md:pb-20 bg-[#1C1917]">
        <div className="max-w-6xl mx-auto px-6">
          <Reveal>
            <p className="font-mono-label text-[11px] tracking-[0.3em] uppercase text-[#C8A96E] mb-4">Portafolio</p>
            <h1 className="font-serif-display text-[clamp(36px,6vw,64px)] leading-[1.05] text-white">
              Trabajo<br /><span className="italic text-[#C8A96E]">seleccionado</span>
            </h1>
            <p className="mt-4 text-[16px] text-[#A8A29E] max-w-lg">
              Una selección de proyectos que representan 15+ años de experiencia en branding, advertising, contenido, producto y growth.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Filters */}
      <div className="sticky top-16 z-40 bg-[#FAF7F2]/95 backdrop-blur border-b border-[#E7E0D8] py-4">
        <div className="max-w-6xl mx-auto px-6 flex gap-2 overflow-x-auto">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`text-[13px] font-medium px-4 py-2 rounded-sm whitespace-nowrap transition-colors ${filter === c ? "bg-[#1C1917] text-white" : "bg-[#F0E8DD] text-[#57534E] hover:text-[#1C1917]"}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <section className="py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-8">
          {filtered.map((p, i) => {
            const contain = p.contain !== false;
            return (
              <Reveal key={p.title} delay={i * 60}>
                <article className="border border-[#E7E0D8] rounded-sm overflow-hidden bg-white group flex flex-col h-full">
                  <button
                    type="button"
                    onClick={() => setLightboxIdx(i)}
                    className="block w-full aspect-[16/10] overflow-hidden bg-[#F0E8DD] cursor-zoom-in relative"
                    aria-label={p.youtubeId ? `Reproducir video de ${p.client}` : `Ampliar imagen de ${p.client}`}
                  >
                    <img
                      src={p.img}
                      alt={`${p.client} — ${p.title}`}
                      className={`w-full h-full ${contain ? "object-contain p-4" : "object-cover"} group-hover:scale-[1.02] transition-transform duration-500`}
                      loading="lazy"
                    />
                    {p.youtubeId && (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                        <span className="h-16 w-16 rounded-full bg-white/95 flex items-center justify-center shadow-lg">
                          <span className="ml-1 w-0 h-0 border-y-[10px] border-y-transparent border-l-[16px] border-l-[#1C1917]" />
                        </span>
                      </span>
                    )}
                  </button>
                  <div className="p-5 flex-1 flex flex-col">
                    <span className="self-start text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-sm bg-[#F0E8DD] text-[#57534E]">{p.category}</span>
                    <h3 className="mt-3 text-[17px] font-semibold text-[#1C1917]">{p.title}</h3>
                    <p className="text-[13px] text-[#C8A96E] font-medium">{p.client}</p>
                    <p className="mt-2 text-[13px] text-[#57534E] leading-relaxed">{p.desc}</p>
                    <p className="mt-auto pt-3 text-[11px] font-mono-label tracking-wider text-[#A8A29E] uppercase">{p.role}</p>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* Lightbox */}
      {lightboxIdx !== null && filtered[lightboxIdx] && (
        <div
          className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 md:p-10"
          onClick={closeLightbox}
          role="dialog"
          aria-modal="true"
        >
          <button
            onClick={(e) => { e.stopPropagation(); closeLightbox(); }}
            className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
          {filtered.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prevLightbox(); }}
                className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                aria-label="Anterior"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); nextLightbox(); }}
                className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                aria-label="Siguiente"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
          <div className="max-w-6xl w-full max-h-full flex flex-col items-center gap-4" onClick={(e) => e.stopPropagation()}>
            {filtered[lightboxIdx].youtubeId ? (
              <div className="w-full max-w-5xl aspect-video bg-black rounded-sm overflow-hidden">
                <iframe
                  src={`https://www.youtube.com/embed/${filtered[lightboxIdx].youtubeId}?autoplay=1&rel=0`}
                  title={filtered[lightboxIdx].title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <img
                src={filtered[lightboxIdx].img}
                alt={filtered[lightboxIdx].title}
                className="max-w-full max-h-[80vh] object-contain rounded-sm"
              />
            )}
            <div className="text-center text-white">
              <p className="text-[11px] font-mono-label tracking-[0.3em] uppercase text-[#C8A96E]">{filtered[lightboxIdx].client}</p>
              <h3 className="mt-1 font-serif-display text-[20px] md:text-[24px]">{filtered[lightboxIdx].title}</h3>
              <p className="mt-1 text-[12px] text-[#A8A29E] uppercase tracking-wider">{filtered[lightboxIdx].role}</p>
            </div>
          </div>
        </div>
      )}

      {/* CTA */}
      <section className="py-16 bg-[#F0E8DD]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <Reveal>
            <h2 className="font-serif-display text-[clamp(20px,3vw,32px)] text-[#1C1917] mb-6">Explora más en mis perfiles</h2>
            <div className="flex flex-wrap justify-center gap-3">
              {[
                { label: "Behance", href: "https://behance.net/rogertern" },
                { label: "Instagram", href: "https://instagram.com/rayo_teran" },
                { label: "LinkedIn", href: "https://linkedin.com/in/rogerteran" },
              ].map((l) => (
                <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" className="h-10 px-5 rounded-sm border border-[#E7E0D8] text-[#1C1917] text-[13px] font-semibold flex items-center gap-2 hover:bg-white transition-colors">
                  {l.label} <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
