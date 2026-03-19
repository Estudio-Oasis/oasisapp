import { useState, useRef, useEffect } from "react";
import { Sparkles, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { callAiFieldHelper } from "@/lib/extractClient";

interface AiFieldHelperProps {
  action: string;
  context: Record<string, unknown>;
  onResult?: (result: string) => void;
  label?: string;
  readOnly?: boolean;
}

export function AiFieldHelper({ action, context, onResult, label, readOnly = false }: AiFieldHelperProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const popRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popRef.current && !popRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleClick = async () => {
    if (result) {
      setOpen(true);
      return;
    }
    setLoading(true);
    setOpen(true);
    try {
      const r = await callAiFieldHelper(action, context);
      setResult(r);
    } catch {
      setResult("No se pudo obtener la sugerencia de IA.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onClick={handleClick}
        className="inline-flex items-center gap-0.5 text-foreground-muted hover:text-accent transition-colors"
        title={label || "Asistente IA"}
      >
        <Sparkles className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
      </button>

      {open && (
        <div
          ref={popRef}
          className="absolute top-full left-0 mt-1 z-50 w-[280px] bg-background border border-border rounded-lg p-3 shadow-md"
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <span className="text-micro text-foreground-muted">{label || "Sugerencia IA"}</span>
            <button onClick={() => setOpen(false)} className="text-foreground-muted hover:text-foreground">
              <X className="h-3 w-3" />
            </button>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 py-3 text-sm text-foreground-secondary">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Pensando...
            </div>
          ) : (
            <>
              <p className="text-sm text-foreground whitespace-pre-wrap">{result}</p>
              {!readOnly && onResult && result && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="mt-2 w-full"
                  onClick={() => {
                    onResult(result);
                    setOpen(false);
                  }}
                >
                  Usar esto
                </Button>
              )}
            </>
          )}
        </div>
      )}
    </span>
  );
}
