import { useState } from "react";
import { Sparkles, Check, X, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/analytics";

const DAILY_KEY_PREFIX = "bitacora_ai_refine_";

function getDailyCount(): number {
  const key = DAILY_KEY_PREFIX + new Date().toISOString().slice(0, 10);
  return parseInt(localStorage.getItem(key) || "0", 10);
}

function incrementDailyCount(): void {
  const key = DAILY_KEY_PREFIX + new Date().toISOString().slice(0, 10);
  localStorage.setItem(key, String(getDailyCount() + 1));
}

interface AiSuggestion {
  title: string;
  description: string;
}

interface Props {
  text: string;
  onAccept: (refined: string) => void;
  /** New: callback when user accepts title + description separately */
  onAcceptStructured?: (suggestion: AiSuggestion) => void;
  maxPerDay?: number | null;
}

export function AiRefineButton({ text, onAccept, onAcceptStructured, maxPerDay = 5 }: Props) {
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<AiSuggestion | null>(null);
  const limitReached = maxPerDay !== null && getDailyCount() >= maxPerDay;

  if (text.length <= 5 && !suggestion) return null;
  if (limitReached && !suggestion) {
    return (
      <span className="text-[10px] text-foreground-muted px-1">Límite diario de IA alcanzado</span>
    );
  }

  const handleRefine = async () => {
    if (loading || !text.trim() || limitReached) return;
    setLoading(true);
    trackEvent("ai_refine_used");
    try {
      const { data, error } = await supabase.functions.invoke("rewrite-description", {
        body: { text: text.trim() },
      });
      if (error) throw error;

      const title = data?.title?.trim() || data?.result?.trim() || "";
      const description = data?.description?.trim() || "";

      if (title) {
        setSuggestion({ title, description });
        incrementDailyCount();
      }
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  };

  if (suggestion) {
    return (
      <div className="space-y-1.5 px-1 py-2 rounded-lg bg-accent/5 border border-accent/20">
        {/* Title */}
        <div className="flex items-start gap-2">
          <Sparkles className="h-3 w-3 text-accent shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold text-foreground-muted uppercase tracking-wider mb-0.5">Título sugerido</p>
            <p className="text-[12px] font-medium text-foreground">{suggestion.title}</p>
          </div>
        </div>

        {/* Description */}
        {suggestion.description && (
          <div className="flex items-start gap-2">
            <Pencil className="h-3 w-3 text-accent/60 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold text-foreground-muted uppercase tracking-wider mb-0.5">Descripción mejorada</p>
              <p className="text-[11px] text-foreground-secondary leading-relaxed">{suggestion.description}</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1.5 pl-5">
          <button
            onClick={() => {
              if (onAcceptStructured) {
                onAcceptStructured(suggestion);
              } else {
                onAccept(suggestion.title);
              }
              setSuggestion(null);
            }}
            className="h-7 px-2.5 rounded-md bg-accent/15 flex items-center gap-1 text-[11px] font-medium text-accent hover:bg-accent/25 transition-colors"
          >
            <Check className="h-3 w-3" />
            Aceptar
          </button>
          <button
            onClick={() => {
              // Accept only title
              onAccept(suggestion.title);
              setSuggestion(null);
            }}
            className="h-7 px-2.5 rounded-md bg-background-secondary flex items-center gap-1 text-[11px] font-medium text-foreground-secondary hover:text-foreground transition-colors"
          >
            Solo título
          </button>
          <button
            onClick={() => setSuggestion(null)}
            className="h-7 w-7 rounded-md bg-background-secondary flex items-center justify-center text-foreground-muted hover:text-foreground transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={handleRefine}
      disabled={loading || text.length <= 5}
      className="flex items-center gap-1 text-[11px] text-foreground-muted hover:text-accent transition-colors disabled:opacity-30 px-1"
    >
      <Sparkles className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
      {loading ? "Refinando…" : "Mejorar con IA"}
    </button>
  );
}
