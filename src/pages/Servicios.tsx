import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { SiteNavbar } from "@/components/SiteNavbar";
import { SiteFooter } from "@/components/SiteFooter";

const SERVICES = [
  {
    num: "01",
    title: "Branding",
    subtitle: "Identidades que la gente recuerda.",
    items: [
      "Logotipos y sistemas de identidad",
      "Naming y arquitectura de marca",
      "Packaging y etiquetado",
      "Señalética y ambientación",
      "Brandbooks y guías de estilo",
      "Estrategia de marca",
    ],
  },
  {
    num: "02",
    title: "Marketing & Publicidad",
    subtitle: "Contenido que convierte. Publicidad que escala.",
    items: [
      "Campañas en Meta, Google y TikTok",
      "Estrategia de contenido y social media",
      "Out-of-home (OOH) y espectaculares",
      "Medios tradicionales",
      "Email marketing y CRM",
      "Estrategia de crecimiento (Growth)",
    ],
  },
  {
    num: "03",
    title: "Tecnología",
    subtitle: "Plataformas digitales que trabajan para tu negocio.",
    items: [
      "Websites y landing pages",
      "Aplicaciones web y móviles",
      "E-commerce y marketplaces",
      "Sistemas internos a medida",
      "Integraciones y APIs",
      "OasisOS — sistema operativo para agencias",
    ],
  },
];

export default function ServiciosPage() {
  return (
    <div className="min-h-screen font-body bg-[#FAF7F2]">
      <SiteNavbar />

      {/* Hero */}
      <section className="pt-32 pb-16 md:pt-40 md:pb-20 bg-[#1C1917]">
        <div className="max-w-6xl mx-auto px-6">
          <p className="font-mono-label text-[11px] tracking-[0.3em] uppercase text-[#C8A96E] mb-4">Servicios</p>
          <h1 className="font-serif-display text-[clamp(36px,6vw,64px)] leading-[1.05] text-white">
            Lo que <span className="italic text-[#C8A96E]">hacemos.</span>
          </h1>
          <p className="mt-4 text-[16px] text-[#A8A29E] max-w-lg font-body">
            Branding, marketing y tecnología para negocios que quieren crecer. 10 años de experiencia, +200 clientes.
          </p>
        </div>
      </section>

      {/* Services */}
      <section className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-6 space-y-20">
          {SERVICES.map((service) => (
            <div key={service.num} className="grid md:grid-cols-2 gap-12 items-start">
              <div>
                <span className="font-serif-display text-[72px] font-bold text-[#E7E0D8] leading-none">{service.num}</span>
                <h2 className="mt-2 font-serif-display text-[clamp(28px,3.5vw,40px)] text-[#1C1917]">{service.title}</h2>
                <p className="mt-3 text-[16px] text-[#57534E] font-body">{service.subtitle}</p>
              </div>
              <ul className="space-y-3 pt-4">
                {service.items.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-[15px] text-[#57534E] font-body">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C8A96E] mt-2 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-[#F0E8DD]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="font-serif-display text-[clamp(24px,4vw,44px)] text-[#1C1917]">¿Listo para empezar?</h2>
          <p className="mt-4 text-[16px] text-[#57534E] font-body">Cuéntanos tu proyecto. Respondemos en menos de 24 horas.</p>
          <Link
            to="/contacto"
            className="mt-8 inline-flex items-center gap-2 h-12 px-8 rounded-sm bg-[#1C1917] text-white text-[14px] font-semibold hover:bg-[#2D2D2D] transition-all"
          >
            Hablemos <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
