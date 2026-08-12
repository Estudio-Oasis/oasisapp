import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { STAGES } from "./heroContent";
import { useLang } from "@/i18n/LanguageContext";

export function StageSlider() {
  const { t, pick } = useLang();
  const [i, setI] = useState(0);
  const [auto, setAuto] = useState(true);
  const stage = STAGES[i];

  useEffect(() => {
    if (!auto) return;
    const id = setInterval(() => setI((p) => (p + 1) % STAGES.length), 7000);
    return () => clearInterval(id);
  }, [auto]);

  const go = (next: number) => {
    setAuto(false);
    setI((next + STAGES.length) % STAGES.length);
  };

  return (
    <div className="mt-8 md:mt-10">
      {/* Tabs / progreso tipo app */}
      <div className="flex flex-wrap gap-2">
        {STAGES.map((s, idx) => {
          const on = idx === i;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => go(idx)}
              style={{
                borderColor: on ? s.color : undefined,
                backgroundColor: on ? s.color : undefined,
              }}
              className={`font-label text-[10px] md:text-[11px] tracking-[0.18em] uppercase px-3 md:px-4 py-2 border-2 transition-colors ${
                on
                  ? "text-[hsl(var(--paper))]"
                  : "border-[hsl(var(--ink)/0.15)] text-[hsl(var(--ink)/0.50)] hover:border-[hsl(var(--ink))] hover:text-[hsl(var(--ink))]"
              }`}
            >
              {s.n} · {pick(s.label)}
            </button>
          );
        })}
      </div>

      {/* Panel */}
      <div
        key={stage.id}
        className="mt-5 border-t-2 pt-6 md:pt-8 animate-rise-in"
        style={{ borderColor: stage.color }}
      >
        <div className="grid md:grid-cols-[1fr_1.15fr] gap-6 md:gap-12">
          <div>
            <span
              className="font-label text-[10px] md:text-[11px] tracking-[0.28em] uppercase"
              style={{ color: stage.color }}
            >
              {pick(stage.kicker)}
            </span>
            <p
              className="mt-2 font-ultra leading-[0.9] text-[clamp(38px,10vw,110px)] md:text-[min(5.4vw,9vh)]"
              style={{ color: stage.color }}
            >
              {pick(stage.label)}
            </p>
            <p className="mt-3 font-label text-[10px] tracking-[0.2em] uppercase text-[hsl(var(--ink)/0.40)]">
              {pick(stage.proof)}
            </p>
          </div>

          <div>
            <p className="font-condensed text-[clamp(19px,2.6vw,32px)] leading-[1.15] text-[hsl(var(--ink))]">
              {pick(stage.body)}
            </p>
            <p className="mt-4 font-body text-[15px] md:text-[17px] leading-relaxed text-[hsl(var(--ink)/0.60)] max-w-[62ch]">
              {pick(stage.detail)}
            </p>
          </div>
        </div>

        <div className="mt-7 flex items-center gap-2">
          <button
            type="button"
            onClick={() => go(i - 1)}
            aria-label={t("Anterior", "Previous")}
            className="h-11 w-11 flex items-center justify-center border-2 border-[hsl(var(--ink)/0.15)] hover:border-[hsl(var(--ink))] transition-colors"
          >
            <ArrowLeft className="h-4 w-4 text-[hsl(var(--ink))]" />
          </button>
          <button
            type="button"
            onClick={() => go(i + 1)}
            className="h-11 px-5 flex items-center gap-2 border-2 border-[hsl(var(--ink))] text-[hsl(var(--ink))] hover:bg-[hsl(var(--ink))] hover:text-[hsl(var(--paper))] transition-colors font-label text-[10px] tracking-[0.2em] uppercase"
          >
            {t("Siguiente", "Next")}: {pick(STAGES[(i + 1) % STAGES.length].label)}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
