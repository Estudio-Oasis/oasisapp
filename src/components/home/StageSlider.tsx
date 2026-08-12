import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { STAGES } from "./heroContent";

export function StageSlider() {
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
              className={`font-mono-label text-[10px] md:text-[11px] tracking-[0.18em] uppercase px-3 md:px-4 py-2 border-2 transition-colors ${
                on
                  ? "text-[#FCFCFA]"
                  : "border-[#111110]/15 text-[#111110]/50 hover:border-[#111110] hover:text-[#111110]"
              }`}
            >
              {s.n} · {s.label}
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
              className="font-mono-label text-[10px] md:text-[11px] tracking-[0.28em] uppercase"
              style={{ color: stage.color }}
            >
              {stage.kicker}
            </span>
            <p
              className="mt-2 font-ultra leading-[0.9] text-[clamp(38px,10vw,110px)] md:text-[min(5.4vw,9vh)]"
              style={{ color: stage.color }}
            >
              {stage.label}
            </p>
            <p className="mt-3 font-mono-label text-[10px] tracking-[0.2em] uppercase text-[#111110]/40">
              {stage.proof}
            </p>
          </div>

          <div>
            <p className="font-condensed text-[clamp(19px,2.6vw,32px)] leading-[1.15] text-[#111110]">
              {stage.body}
            </p>
            <p className="mt-4 font-body text-[15px] md:text-[17px] leading-relaxed text-[#111110]/60 max-w-[62ch]">
              {stage.detail}
            </p>
          </div>
        </div>

        <div className="mt-7 flex items-center gap-2">
          <button
            type="button"
            onClick={() => go(i - 1)}
            aria-label="Anterior"
            className="h-11 w-11 flex items-center justify-center border-2 border-[#111110]/15 hover:border-[#111110] transition-colors"
          >
            <ArrowLeft className="h-4 w-4 text-[#111110]" />
          </button>
          <button
            type="button"
            onClick={() => go(i + 1)}
            className="h-11 px-5 flex items-center gap-2 border-2 border-[#111110] text-[#111110] hover:bg-[#111110] hover:text-[#FCFCFA] transition-colors font-mono-label text-[10px] tracking-[0.2em] uppercase"
          >
            Siguiente: {STAGES[(i + 1) % STAGES.length].label}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
