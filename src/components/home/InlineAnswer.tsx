import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import type { Answer } from "./heroContent";

export function InlineAnswer({
  answer,
  onClose,
}: {
  answer: Answer | null;
  onClose: () => void;
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

        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="self-start shrink-0 h-10 w-10 flex items-center justify-center border-2 border-[#111110]/15 hover:border-[#111110] transition-colors"
        >
          <X className="h-4 w-4 text-[#111110]" />
        </button>
      </div>
    </div>
  );
}
