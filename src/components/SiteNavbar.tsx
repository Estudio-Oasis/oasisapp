import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";

export function SiteNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  const links = [
    { label: "Servicios", to: "/servicios" },
    { label: "Portafolio", to: "/portfolio" },
    { label: "About", to: "/about" },
    { label: "Oasis OS", to: "/oasis-os" },
    { label: "Contacto", to: "/contacto" },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-[#FAF7F2] ${scrolled ? "shadow-sm" : ""} border-b border-[#E7E0D8]`}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="font-serif-display text-[20px] font-bold tracking-tight text-[#1C1917]">
          OASIS
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className="text-[13px] font-medium text-[#57534E] hover:text-[#1C1917] transition-colors">
              {l.label}
            </Link>
          ))}
          <Link
            to="/contacto"
            className="h-9 px-5 rounded-sm bg-[#1C1917] text-white text-[13px] font-semibold flex items-center gap-1.5 hover:bg-[#2D2D2D] transition-colors"
          >
            Hablemos
          </Link>
        </div>

        <button className="md:hidden text-[#1C1917]" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-[#FAF7F2] border-b border-[#E7E0D8] px-6 pb-4 space-y-3">
          {links.map((l) => (
            <Link key={l.to} to={l.to} onClick={() => setMobileOpen(false)} className="block text-sm text-[#1C1917]">
              {l.label}
            </Link>
          ))}
          <Link to="/contacto" onClick={() => setMobileOpen(false)} className="block text-sm font-semibold text-[#C8A96E]">
            Hablemos →
          </Link>
        </div>
      )}
    </nav>
  );
}
