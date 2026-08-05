import { useEffect, useRef } from "react";
import { ArrowRight, X } from "lucide-react";
import type { Answer } from "./heroContent";

export function InlineAnswer({
  answer,
  onClose,
  onNext,
  nextLabel,
}: {
  answer: Answer | null;
  onClose: () => void;
  onNext?: () => void;
  nextLabel?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (answer && ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [answer]);

  if (!answer) return null;

  return (
    <div
      ref={ref}
      key={answer.id}
      className="animate-rise-in border-t-2 border-b-2 border-[#111110] mt-6 md:mt-10"
      style={{ borderColor: answer.color }}
    >
      <div className="py-6 md:py-10 flex flex-col md:flex-row md:items-start gap-4 md:gap-10">
        <div className="md:w-[34%] shrink-0">
          <span
            className="font-mono-label text-[11px] tracking-[0.28em] uppercase"
            style={{ color: answer.color }}
          >
            {answer.kicker}
          </span>
          <p
            className="font-ultra text-[clamp(28px,4.6vw,64px)] leading-[0.92] mt-2"
            style={{ color: answer.color }}
          >
            {answer.label}
          </p>
        </div>

        <div className="flex-1 space-y-4">
          <p className="font-condensed text-[clamp(20px,2.4vw,34px)] leading-[1.18] text-[#111110]">
            {answer.body}
          </p>
          {answer.solution ? (
            <p className="text-[15px] md:text-[19px] leading-relaxed text-[#111110]/60 font-body max-w-[62ch]">
              {answer.solution}
            </p>
          ) : null}
        </div>

        <div className="shrink-0 self-start flex items-center gap-2">
          {onNext && nextLabel ? (
            <button
              type="button"
              onClick={onNext}
              className="group h-10 inline-flex items-center gap-2 px-3 border-2 transition-colors font-mono-label text-[10px] md:text-[11px] tracking-[0.2em] uppercase"
              style={{ borderColor: answer.color, color: answer.color }}
            >
              Siguiente: {nextLabel}
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="h-10 w-10 flex items-center justify-center border-2 border-[#111110]/15 hover:border-[#111110] transition-colors"
          >
            <X className="h-4 w-4 text-[#111110]" />
          </button>
        </div>
      </div>
    </div>
  );
}
