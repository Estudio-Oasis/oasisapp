import { useState } from "react";
import { RotatingWord } from "./BrutalistHero";
import { PAIN_POINTS, type Answer } from "./heroContent";
import { AnswerDialog } from "./AnswerDialog";

const QUESTION_WORDS = ["cómo", "qué", "cuándo", "por qué"];

export function PainPointsSection() {
  const [active, setActive] = useState<Answer | null>(null);

  return (
    <section className="bg-[#FCFCFA] border-t-2 border-[#111110] pt-10 md:pt-16 pb-20 md:pb-28">
      <div className="max-w-[1700px] mx-auto px-4 md:px-6">
        <h2 className="font-ultra text-[clamp(38px,8.4vw,150px)] leading-[0.88] text-[#111110]">
          ¿Quieres saber{" "}
          <RotatingWord
            words={QUESTION_WORDS}
            interval={2000}
            offset={300}
            className="text-[#E8453C]"
          />{" "}
          hacemos?
        </h2>

        <p className="mt-6 md:mt-8 font-mono-label text-[11px] md:text-[12px] tracking-[0.28em] uppercase text-[#111110]/40">
          Elige lo que te suena — te decimos cómo lo resolvemos
        </p>

        {/* Rompecabezas */}
        <div className="mt-8 md:mt-12 grid grid-cols-2 md:grid-cols-6 gap-2 md:gap-3">
          {PAIN_POINTS.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setActive(p)}
              style={{ borderColor: p.color, ["--pp" as string]: p.color }}
              className={`group relative text-left border-2 p-4 md:p-6 min-h-[120px] md:min-h-[180px] flex flex-col justify-between overflow-hidden transition-colors duration-300 hover:bg-[var(--pp)] animate-rise-in ${
                p.span === 3 ? "md:col-span-3 col-span-2" : "md:col-span-2"
              }`}
            >
              <span
                className="font-mono-label text-[10px] tracking-[0.24em] uppercase transition-colors group-hover:text-white/70"
                style={{ color: p.color }}
              >
                {String(i + 1).padStart(2, "0")} · {p.kicker}
              </span>
              <span className="font-ultra text-[clamp(20px,3.2vw,44px)] leading-[0.95] text-[#111110] transition-colors group-hover:text-white">
                {p.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <AnswerDialog answer={active} onClose={() => setActive(null)} />
    </section>
  );
}
