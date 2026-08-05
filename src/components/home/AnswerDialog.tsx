import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { Answer } from "./heroContent";

export function AnswerDialog({
  answer,
  onClose,
}: {
  answer: Answer | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={!!answer} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl bg-[#FCFCFA] border-2 border-[#111110] rounded-none p-0 gap-0">
        {answer ? (
          <>
            <div className="h-2" style={{ backgroundColor: answer.color }} />
            <DialogHeader className="px-6 md:px-8 pt-6 md:pt-8 space-y-3 text-left">
              <span
                className="font-mono-label text-[11px] tracking-[0.28em] uppercase"
                style={{ color: answer.color }}
              >
                {answer.kicker}
              </span>
              <DialogTitle className="font-ultra !text-[clamp(30px,6vw,54px)] !font-black leading-[0.92] text-[#111110] tracking-[-0.015em]">
                {answer.label}
              </DialogTitle>
            </DialogHeader>
            <DialogDescription asChild>
              <p className="px-6 md:px-8 pb-8 pt-4 text-[16px] md:text-[18px] leading-relaxed text-[#111110]/70 font-body">
                {answer.body}
              </p>
            </DialogDescription>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
