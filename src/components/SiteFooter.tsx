import { Link } from "react-router-dom";

export function SiteFooter() {
  return (
    <footer className="py-16 md:py-24 bg-[#1C1917]">
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        {/* Col 1 — Brand */}
        <div>
          <span className="font-serif-display text-[28px] text-white">OASIS</span>
          <p className="mt-3 text-[14px] text-[#A8A29E] leading-relaxed font-body italic">
            Design that grows your business.
          </p>
          <p className="mt-4 text-[13px] text-[#A8A29E]/60">Ciudad de México</p>
        </div>

        {/* Col 2 — Nav */}
        <div>
          <h4 className="font-mono-label text-[10px] tracking-[0.3em] uppercase text-[#A8A29E] mb-4">
            Navegación
          </h4>
          <div className="space-y-2">
            {[
              { label: "Inicio", to: "/" },
              { label: "Servicios", to: "/servicios" },
              { label: "Portafolio", to: "/portfolio" },
              { label: "About", to: "/about" },
              { label: "Oasis OS", to: "/oasis-os" },
              { label: "Contacto", to: "/contacto" },
            ].map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="block text-[13px] text-[#A8A29E] hover:text-white transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Col 3 — Contact */}
        <div>
          <h4 className="font-mono-label text-[10px] tracking-[0.3em] uppercase text-[#A8A29E] mb-4">
            Contacto
          </h4>
          <div className="space-y-2">
            <a
              href="mailto:joserogelioteran@gmail.com"
              className="block text-[13px] text-[#A8A29E] hover:text-white transition-colors"
            >
              Escríbenos por mail
            </a>
            <a
              href="https://wa.me/525667701206"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-[13px] text-[#A8A29E] hover:text-white transition-colors"
            >
              Escríbenos por WhatsApp
            </a>
            <Link
              to="/contacto"
              className="block text-[13px] text-[#A8A29E] hover:text-white transition-colors"
            >
              Formulario de contacto
            </Link>
          </div>
        </div>

        {/* Col 4 — Social */}
        <div>
          <h4 className="font-mono-label text-[10px] tracking-[0.3em] uppercase text-[#A8A29E] mb-4">
            Redes
          </h4>
          <div className="space-y-2">
            <a
              href="https://www.instagram.com/oasistud.io"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-[13px] text-[#A8A29E] hover:text-white transition-colors"
            >
              Instagram · @oasistud.io
            </a>
            <a
              href="https://www.linkedin.com/in/rogerteran"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-[13px] text-[#A8A29E] hover:text-white transition-colors"
            >
              LinkedIn · Roger Terán
            </a>
            <a
              href="https://www.behance.net/rogertern"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-[13px] text-[#A8A29E] hover:text-white transition-colors"
            >
              Behance · rogertern
            </a>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="max-w-6xl mx-auto px-6 mt-12 pt-6 border-t border-white/10 flex flex-col md:flex-row justify-between gap-2">
        <p className="text-[11px] text-[#A8A29E]/50">
          © 2025 Estudio Oasis. Todos los derechos reservados.
        </p>
        <div className="flex gap-3">
          <Link
            to="/aviso-de-privacidad"
            className="text-[11px] text-[#A8A29E]/50 hover:text-white transition-colors"
          >
            Aviso de Privacidad
          </Link>
          <Link
            to="/login"
            className="text-[11px] text-[#A8A29E]/30 hover:text-white transition-colors"
          >
            Acceso equipo
          </Link>
        </div>
      </div>
    </footer>
  );
}
