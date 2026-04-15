import { Link } from "react-router-dom";

export function SiteFooter() {
  return (
    <footer className="py-16 md:py-24 bg-[#1C1917]">
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div className="md:col-span-2">
          <span className="font-serif-display text-[28px] text-white">OASIS</span>
          <p className="mt-4 text-[14px] text-[#A8A29E] leading-relaxed font-body max-w-sm">
            Estudio creativo con 10+ años de experiencia. Branding, marketing, tecnología y creadores de OasisOS.
          </p>
        </div>
        <div>
          <h4 className="font-mono-label text-[10px] tracking-[0.3em] uppercase text-[#A8A29E] mb-4">Navegación</h4>
          <div className="space-y-2">
            {[
              { label: "Inicio", to: "/" },
              { label: "Servicios", to: "/servicios" },
              { label: "Portafolio", to: "/portfolio" },
              { label: "About", to: "/about" },
              { label: "Oasis OS", to: "/oasis-os" },
              { label: "Contacto", to: "/contacto" },
            ].map((l) => (
              <Link key={l.to} to={l.to} className="block text-[13px] text-[#A8A29E] hover:text-white transition-colors">{l.label}</Link>
            ))}
          </div>
        </div>
        <div>
          <h4 className="font-mono-label text-[10px] tracking-[0.3em] uppercase text-[#A8A29E] mb-4">Contacto</h4>
          <div className="space-y-2">
            <a href="mailto:joserogelioteran@gmail.com" className="block text-[13px] text-[#A8A29E] hover:text-white transition-colors">joserogelioteran@gmail.com</a>
            <a href="https://linkedin.com/in/rogerteran" target="_blank" rel="noopener noreferrer" className="block text-[13px] text-[#A8A29E] hover:text-white transition-colors">LinkedIn</a>
            <a href="https://behance.net/rogertern" target="_blank" rel="noopener noreferrer" className="block text-[13px] text-[#A8A29E] hover:text-white transition-colors">Behance</a>
            <Link to="/aviso-de-privacidad" className="block text-[13px] text-[#A8A29E]/50 hover:text-white transition-colors">Aviso de privacidad</Link>
            <Link to="/login" className="block text-[13px] text-[#A8A29E]/50 hover:text-white transition-colors">Acceso equipo</Link>
          </div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-6 mt-12 pt-6 border-t border-white/10 flex flex-col md:flex-row justify-between gap-2">
        <p className="text-[11px] text-[#A8A29E]/50">© 2026 Estudio Oasis. Todos los derechos reservados.</p>
        <p className="text-[11px] text-[#A8A29E]/50">Ciudad de México, México</p>
      </div>
    </footer>
  );
}
