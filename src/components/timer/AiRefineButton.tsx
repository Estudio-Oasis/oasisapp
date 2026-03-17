import { useState } from "react";
import { Sparkles, Check, X } from "lucide-react";
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

interface Props {
  text: string;
  onAccept: (refined: string) => void;
  maxPerDay?: number | null;
}

export function AiRefineButton({ text, onAccept, maxPerDay = 5 }: Props) {
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const limitReached = maxPerDay !== null && getDailyCount() >= maxPerDay;

  if (text.length <= 5 && !suggestion) return null;
  if (limitReached && !suggestion) {
    return (
      <span className="text-[10px] text-foreground-muted px-1">Límite diario de IA alcanzado</span>
    );
  }

  const handleRefine = async () => {
    if (loading || !text.trim()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("rewrite-description", {
        body: { text: text.trim() },
      });
      if (error) throw error;
      const result = data?.result?.trim();
      if (result && result !== text.trim()) {
        setSuggestion(result);
      }
    } catch {
      // Silent fail — non-critical feature
    } finally {
      setLoading(false);
    }
  };

  if (suggestion) {
    return (
      <div className="flex items-center gap-2 px-1 py-1.5 rounded-lg bg-accent/5 border border-accent/20">
        <Sparkles className="h-3 w-3 text-accent shrink-0" />
        <span className="text-[12px] text-foreground flex-1 truncate">{suggestion}</span>
        <button
          onClick={() => {
            onAccept(suggestion);
            setSuggestion(null);
          }}
          className="h-6 w-6 rounded-md bg-accent/15 flex items-center justify-center text-accent hover:bg-accent/25 transition-colors"
        >
          <Check className="h-3 w-3" />
        </button>
        <button
          onClick={() => setSuggestion(null)}
          className="h-6 w-6 rounded-md bg-background-secondary flex items-center justify-center text-foreground-muted hover:text-foreground transition-colors"
        >
          <X className="h-3 w-3" />
        </button>
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
