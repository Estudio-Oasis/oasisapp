import { SiteNavbar } from "@/components/SiteNavbar";
import { SiteFooter } from "@/components/SiteFooter";
import { BriefSection } from "@/components/home/BriefSection";

const EMAIL = "r@oasistud.io";
const WHATSAPP = "525667701206";
const WA_URL = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
  "Hola, vi el sitio de Estudio Oasis y quiero platicar.",
)}`;

const CHANNELS = [
  { label: "WhatsApp", value: "+52 56 6770 1206", href: WA_URL, external: true },
  { label: "Correo", value: EMAIL, href: `mailto:${EMAIL}`, external: false },
  { label: "Instagram", value: "@oasistud.io", href: "https://instagram.com/oasistud.io", external: true },
  { label: "LinkedIn", value: "/in/rogerteran", href: "https://www.linkedin.com/in/rogerteran", external: true },
];

export default function ContactoPage() {
  return (
    <div className="min-h-screen font-body bg-[#FCFCFA]">
      <div className="grain-overlay" aria-hidden />
      <SiteNavbar />

      <section className="pt-24 md:pt-28 pb-12 md:pb-16">
        <div className="max-w-[1700px] mx-auto px-4 md:px-6">
          <p className="font-mono-label text-[10px] md:text-[11px] tracking-[0.35em] uppercase text-[#111110]/40">
            Contacto
          </p>
          <h1 className="mt-5 font-ultra text-[clamp(46px,12vw,220px)] md:text-[min(9.6vw,15vh)] leading-[0.9] text-[#111110]">
            Hablemos <span className="text-[#C5221F]">claro.</span>
          </h1>
          <p className="mt-6 font-body text-[15px] md:text-[18px] leading-relaxed text-[#111110]/55 max-w-[64ch]">
            Escríbenos por donde te sea más fácil, o llena el brief de abajo si quieres que
            lleguemos a la primera junta ya con diagnóstico.
          </p>

          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 border-t-2 border-[#111110]">
            {CHANNELS.map((c) => (
              <a
                key={c.label}
                href={c.href}
                target={c.external ? "_blank" : undefined}
                rel={c.external ? "noopener noreferrer" : undefined}
                className="group py-6 md:py-8 lg:px-6 lg:first:pl-0 border-b border-[#111110]/15 lg:border-b-0 lg:border-r lg:border-r-[#111110]/15 lg:last:border-r-0"
              >
                <span className="font-mono-label text-[10px] tracking-[0.24em] uppercase text-[#111110]/40">
                  {c.label}
                </span>
                <p className="mt-2 font-condensed text-[clamp(20px,3vw,32px)] leading-none text-[#111110] group-hover:text-[#C5221F] transition-colors break-words">
                  {c.value}
                </p>
              </a>
            ))}
          </div>
        </div>
      </section>

      <BriefSection />

      <SiteFooter />
    </div>
  );
}
