import { useState } from "react";
import { X } from "lucide-react";
import { CAPABILITIES, PALETTE } from "./heroContent";
import { useLang } from "@/i18n/LanguageContext";

export function CapabilitiesSection() {
  const { t, pick } = useLang();
  const [openFixer, setOpenFixer] = useState(false);

  return (
    <section className="bg-[hsl(var(--paper))] border-t-2 border-[hsl(var(--ink))] pt-10 md:pt-16 pb-20 md:pb-28">
      <div className="max-w-[1700px] mx-auto px-4 md:px-6">
        <p className="font-label text-[10px] md:text-[11px] tracking-[0.35em] uppercase text-[hsl(var(--ink)/0.40)]">
          Zoom in
        </p>

        <h2 className="mt-5 font-ultra text-[clamp(34px,7.4vw,120px)] md:text-[min(6vw,10vh)] leading-[0.95] text-[hsl(var(--ink))]">
          {t("Somos un equipo de expertos", "We are a team of experts")}{" "}
          <span className="text-[hsl(var(--ink)/0.30)]">
            {t("en una sola mesa.", "at a single table.")}
          </span>
        </h2>

        <p className="mt-8 font-condensed text-[clamp(19px,3.2vw,42px)] md:text-[min(2.7vw,4.2vh)] leading-[1.14]">
          {CAPABILITIES.map((s, i) => (
            <span key={s.es}>
              <span
                className="transition-colors duration-300 hover:text-[hsl(var(--ink))]"
                style={{ color: PALETTE[i % PALETTE.length] }}
              >
                {pick(s)}
              </span>
              <span className="text-[hsl(var(--ink)/0.20)]">
                {i === CAPABILITIES.length - 1 ? t(", etc.", ", and more.") : ", "}
              </span>
            </span>
          ))}
        </p>

        <div className="mt-14 md:mt-20">
          <p className="font-ultra text-[clamp(34px,7.6vw,130px)] md:text-[min(6.6vw,11vh)] leading-[0.92] text-[hsl(var(--ink))]">
            We&apos;re the ultimate{" "}
            <button
              type="button"
              onClick={() => setOpenFixer((v) => !v)}
              className={`text-[#1A73E8] underline decoration-[0.06em] transition-colors ${
                openFixer ? "decoration-current" : "decoration-[#1A73E8]/30 hover:decoration-current"
              }`}
            >
              FIXERS
            </button>
            .
          </p>

          {openFixer && (
            <div className="mt-6 border-t-2 border-b-2 border-[#1A73E8] py-6 md:py-10 animate-rise-in grid md:grid-cols-[0.9fr_1.4fr] gap-6 md:gap-12">
              <div>
                <span className="font-label text-[11px] tracking-[0.28em] uppercase text-[#1A73E8]">
                  {t("¿Qué es un fixer?", "What is a fixer?")}
                </span>
                <p className="mt-2 font-ultra text-[clamp(28px,4.6vw,64px)] leading-[0.92] text-[#1A73E8]">
                  {t("El que llega y lo arregla", "The one who shows up and fixes it")}
                </p>
              </div>
              <div className="space-y-4">
                <p className="font-condensed text-[clamp(20px,2.4vw,34px)] leading-[1.18] text-[hsl(var(--ink))]">
                  {t(
                    "Un fixer no llega a proponer tres meses de junta. Llega, entiende el problema, lo desarma y lo resuelve.",
                    "A fixer doesn't show up to propose three months of meetings. They show up, understand the problem, take it apart, and solve it.",
                  )}
                </p>
                <p className="font-body text-[15px] md:text-[18px] leading-relaxed text-[hsl(var(--ink)/0.60)] max-w-[62ch]">
                  {t(
                    "Es el equipo al que llamas cuando ya urge: cuando la campaña no rinde, cuando la tienda se cae, cuando la marca no significa nada, cuando el contrato tiene que cerrarse esta semana. Entramos, diagnosticamos en días y ejecutamos con nuestra propia gente.",
                    "We're the team you call when it's urgent: when the campaign underperforms, when the store breaks, when the brand means nothing, when the contract has to close this week. We come in, diagnose in days, and execute with our own people.",
                  )}
                </p>
                <button
                  type="button"
                  onClick={() => setOpenFixer(false)}
                  className="inline-flex items-center gap-2 font-label text-[10px] tracking-[0.2em] uppercase text-[hsl(var(--ink)/0.50)] hover:text-[hsl(var(--ink))] transition-colors"
                >
                  <X className="h-3.5 w-3.5" /> {t("Cerrar", "Close")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
