import { useState } from "react";
import { X, Mail, Linkedin, Instagram } from "lucide-react";

const WHATSAPP = "525667701206";
const EMAIL = "joserogelioteran@gmail.com";
const WA_URL = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
  "Hola Roger, vi tu sitio y me gustaría platicar."
)}`;

interface Props {
  lang?: "es" | "en";
}

export function RogerContactFab({ lang = "es" }: Props) {
  const [open, setOpen] = useState(false);
  const [closed, setClosed] = useState(false);

  if (closed) return null;

  const t =
    lang === "es"
      ? { label: "WhatsApp", title: "¿Por dónde hablamos?", close: "Cerrar" }
      : { label: "WhatsApp", title: "Where should we talk?", close: "Close" };

  const channels = [
    {
      label: "WhatsApp",
      sub: "+52 56 6770 1206",
      href: WA_URL,
      bg: "bg-[#25D366]",
      icon: (
        <svg viewBox="0 0 24 24" fill="white" className="h-5 w-5">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
        </svg>
      ),
    },
    {
      label: "Instagram",
      sub: "@rayo_teran",
      href: "https://instagram.com/rayo_teran",
      bg: "bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF]",
      icon: <Instagram className="h-5 w-5 text-white" />,
    },
    {
      label: "LinkedIn",
      sub: "in/rogerteran",
      href: "https://www.linkedin.com/in/rogerteran",
      bg: "bg-[#0A66C2]",
      icon: <Linkedin className="h-5 w-5 text-white" />,
    },
    {
      label: lang === "es" ? "Correo" : "Email",
      sub: EMAIL,
      href: `mailto:${EMAIL}`,
      bg: "bg-[#1C1917]",
      icon: <Mail className="h-5 w-5 text-white" />,
    },
  ];

  return (
    <div className="fixed bottom-5 right-5 z-[80] flex flex-col items-end gap-3">
      {open && (
        <div className="w-[280px] rounded-xl bg-white shadow-2xl border border-[#E7E0D8] overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#E7E0D8] bg-[#FAF7F2]">
            <p className="font-serif-display text-[15px] text-[#1C1917]">
              {t.title}
            </p>
            <button
              onClick={() => setOpen(false)}
              aria-label={t.close}
              className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-[#E7E0D8] transition-colors"
            >
              <X className="h-4 w-4 text-[#57534E]" />
            </button>
          </div>
          <div className="p-2">
            {channels.map((c) => (
              <a
                key={c.label}
                href={c.href}
                target={c.href.startsWith("http") ? "_blank" : undefined}
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#FAF7F2] transition-colors"
              >
                <span
                  className={`h-9 w-9 rounded-full ${c.bg} flex items-center justify-center shrink-0`}
                >
                  {c.icon}
                </span>
                <span className="flex flex-col min-w-0">
                  <span className="text-[13px] font-semibold text-[#1C1917]">
                    {c.label}
                  </span>
                  <span className="text-[11px] text-[#57534E] truncate">
                    {c.sub}
                  </span>
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label={t.label}
          className="h-11 px-5 rounded-full bg-[#25D366] hover:bg-[#1FB955] text-white font-semibold text-[14px] shadow-lg flex items-center gap-2 transition-all hover:scale-[1.03]"
        >
          <svg viewBox="0 0 24 24" fill="white" className="h-5 w-5">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
          </svg>
          {t.label}
        </button>
        <button
          onClick={() => setClosed(true)}
          aria-label={t.close}
          className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-[#1C1917] hover:bg-black text-white flex items-center justify-center shadow-md border border-white"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
