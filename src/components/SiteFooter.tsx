import { Link } from "react-router-dom";

const NAV = [
  { label: "Inicio", to: "/" },
  { label: "Servicios", to: "/servicios" },
  { label: "Portafolio", to: "/portfolio" },
  { label: "About", to: "/about" },
  { label: "Contacto", to: "/contacto" },
];

export function SiteFooter() {
  return (
    <footer className="bg-[#111110] pt-16 md:pt-20 pb-8 border-t border-[#FCFCFA]/10">
      <div className="max-w-[1700px] mx-auto px-4 md:px-6">
        <p className="font-ultra leading-[0.85] text-[clamp(64px,20vw,300px)] md:text-[min(15vw,22vh)] text-[#FCFCFA]/12">
          OASIS
        </p>

        <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-[#FCFCFA]/15 pt-8">
          <div>
            <h4 className="font-mono-label text-[10px] tracking-[0.3em] uppercase text-[#FCFCFA]/35 mb-4">
              Estudio
            </h4>
            <p className="text-[14px] text-[#FCFCFA]/70 leading-relaxed">
              Crecimiento basado en sistemas.
            </p>
            <p className="mt-3 text-[13px] text-[#FCFCFA]/40">Ciudad de México</p>
          </div>

          <div>
            <h4 className="font-mono-label text-[10px] tracking-[0.3em] uppercase text-[#FCFCFA]/35 mb-4">
              Navegación
            </h4>
            <div className="space-y-2">
              {NAV.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  className="block text-[13px] text-[#FCFCFA]/60 hover:text-[#FCFCFA] transition-colors"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-mono-label text-[10px] tracking-[0.3em] uppercase text-[#FCFCFA]/35 mb-4">
              Contacto
            </h4>
            <div className="space-y-2">
              <a
                href="mailto:joserogelioteran@gmail.com"
                className="block text-[13px] text-[#FCFCFA]/60 hover:text-[#FCFCFA] transition-colors"
              >
                Mail
              </a>
              <a
                href="https://wa.me/525667701206"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-[13px] text-[#FCFCFA]/60 hover:text-[#FCFCFA] transition-colors"
              >
                WhatsApp
              </a>
              <Link
                to="/contacto"
                className="block text-[13px] text-[#FCFCFA]/60 hover:text-[#FCFCFA] transition-colors"
              >
                Formulario
              </Link>
            </div>
          </div>

          <div>
            <h4 className="font-mono-label text-[10px] tracking-[0.3em] uppercase text-[#FCFCFA]/35 mb-4">
              Redes
            </h4>
            <div className="space-y-2">
              <a
                href="https://www.instagram.com/oasistud.io"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-[13px] text-[#FCFCFA]/60 hover:text-[#FCFCFA] transition-colors"
              >
                Instagram
              </a>
              <a
                href="https://www.linkedin.com/in/rogerteran"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-[13px] text-[#FCFCFA]/60 hover:text-[#FCFCFA] transition-colors"
              >
                LinkedIn
              </a>
              <a
                href="https://www.behance.net/rogertern"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-[13px] text-[#FCFCFA]/60 hover:text-[#FCFCFA] transition-colors"
              >
                Behance
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-[#FCFCFA]/10 flex flex-col md:flex-row justify-between gap-2">
          <p className="font-mono-label text-[10px] tracking-[0.2em] uppercase text-[#FCFCFA]/30">
            © 2026 Estudio Oasis
          </p>
          <Link
            to="/aviso-de-privacidad"
            className="font-mono-label text-[10px] tracking-[0.2em] uppercase text-[#FCFCFA]/30 hover:text-[#FCFCFA] transition-colors"
          >
            Aviso de Privacidad
          </Link>
        </div>
      </div>
    </footer>
  );
}
