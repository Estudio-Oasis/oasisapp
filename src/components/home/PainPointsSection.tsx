import { useState } from "react";
import { RotatingWord } from "./BrutalistHero";
import { PAIN_POINTS, type Answer } from "./heroContent";
import { InlineAnswer } from "./InlineAnswer";

const QUESTION_WORDS = ["cómo", "qué"];

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

        {/* Rompecabezas */}
        <div className="mt-8 md:mt-12 grid grid-cols-2 md:grid-cols-6 gap-2 md:gap-3">
          {PAIN_POINTS.map((p) => {
            const isActive = active?.id === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setActive(isActive ? null : p)}
                style={{
                  borderColor: p.color,
                  ["--pp" as string]: p.color,
                  backgroundColor: isActive ? p.color : undefined,
                }}
                className={`group relative text-left border-2 p-4 md:p-6 min-h-[110px] md:min-h-[180px] flex items-end overflow-hidden transition-colors duration-300 hover:bg-[var(--pp)] animate-rise-in ${
                  p.span === 3 ? "md:col-span-3 col-span-2" : "md:col-span-2"
                }`}
              >
                <span
                  className={`font-ultra text-[clamp(21px,3.2vw,44px)] leading-[0.95] transition-colors group-hover:text-[#FCFCFA] ${
                    isActive ? "text-[#FCFCFA]" : "text-[#111110]"
                  }`}
                >
                  {p.label}
                </span>
              </button>
            );
          })}
        </div>

        <InlineAnswer answer={active} onClose={() => setActive(null)} />
      </div>
    </section>
  );
}
