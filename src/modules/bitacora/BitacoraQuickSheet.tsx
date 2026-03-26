import { useState, useRef, useEffect, useCallback } from "react";
import { useBitacora } from "./BitacoraContext";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import {
  Play,
  Clock,
  Video,
  Coffee,
  Utensils,
  ListTodo,
  Mic,
  MicOff,
  Check,
  X,
} from "lucide-react";
import { getClientColor } from "@/lib/timer-utils";
import { getNormalizedActivityType, getActivityConfig } from "@/components/timer/ActivityConstants";
import { toast } from "sonner";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { AiRefineButton } from "@/components/timer/AiRefineButton";
import { trackEvent } from "@/lib/analytics";
import { useAuth } from "@/contexts/AuthContext";
import { ActivityDetailsPanel } from "@/components/ActivityDetailsPanel";
import { useAutoSuggestClient } from "@/hooks/useAutoSuggestClient";

interface QuickAction {
  key: string;
  label: string;
  icon: React.ElementType;
  isBreak: boolean;
}

const QUICK_ACTIONS: QuickAction[] = [
  { key: "reunion", label: "Reunión", icon: Video, isBreak: false },
  { key: "break", label: "Descanso", icon: Coffee, isBreak: true },
  { key: "comida", label: "Comida", icon: Utensils, isBreak: true },
  { key: "pendientes", label: "Pendientes", icon: ListTodo, isBreak: false },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: "start" | "switch";
}

export function BitacoraQuickSheet({ open, onOpenChange, mode = "start" }: Props) {
  const bita = useBitacora();
  const { user } = useAuth();
  const speech = useSpeechRecognition();

  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedActivityType, setSelectedActivityType] = useState<string | null>(null);
  const [isBillable, setIsBillable] = useState(true);
  const [notes, setNotes] = useState("");
  const [suggestionDismissed, setSuggestionDismissed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-suggest client from text
  const suggestion = useAutoSuggestClient(text, bita.clients, bita.projects);
  const showSuggestion = suggestion && !selectedClientId && !suggestionDismissed;

  useEffect(() => {
    if (open) {
      setText("");
      setSelectedClientId(null);
      setSelectedProjectId(null);
      setSelectedActivityType(null);
      setIsBillable(true);
      setNotes("");
      setSuggestionDismissed(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      if (speech.isListening) speech.stopListening();
    }
  }, [open]);

  useEffect(() => {
    if (speech.transcript) {
      setText((prev) => {
        const base = prev.trim();
        return base ? `${base} ${speech.transcript}` : speech.transcript;
      });
    }
  }, [speech.transcript]);

  // Reset dismissed state when text changes significantly
  useEffect(() => {
    setSuggestionDismissed(false);
  }, [text.length > 3 ? text.slice(0, 10) : ""]);

  const handleStart = useCallback(
    async (
      desc?: string | null,
      clientId?: string | null,
      taskId?: string | null,
      projectId?: string | null
    ) => {
      setLoading(true);
      try {
        const fullDesc = notes.trim()
          ? `${desc || ""}${desc ? "\n" : ""}${notes.trim()}`
          : desc || null;
        const input = {
          description: fullDesc,
          clientId: clientId || null,
          taskId: taskId || null,
          projectId: projectId || null,
        };
        const fn = mode === "switch" ? bita.switchActivity : bita.startActivity;
        await fn(input);
        onOpenChange(false);
      } catch {
        toast.error("No se pudo iniciar. Intenta de nuevo.");
      } finally {
        setLoading(false);
      }
    },
    [mode, bita, onOpenChange, notes]
  );

  const handleQuickAction = useCallback(
    async (action: QuickAction) => {
      setLoading(true);
      try {
        await bita.startQuickAction(action.key);
        onOpenChange(false);
      } catch {
        toast.error("No se pudo iniciar.");
      } finally {
        setLoading(false);
      }
    },
    [bita, onOpenChange]
  );

  const handleSubmit = useCallback(() => {
    handleStart(text.trim() || null, selectedClientId, null, selectedProjectId);
  }, [text, selectedClientId, selectedProjectId, handleStart]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const toggleMic = () => {
    if (speech.isListening) {
      speech.stopListening();
    } else {
      trackEvent("dictation_used", { source: "quick_sheet" });
      speech.startListening();
    }
  };

  const acceptSuggestion = () => {
    if (!suggestion) return;
    setSelectedClientId(suggestion.clientId);
    if (suggestion.projectId) setSelectedProjectId(suggestion.projectId);
    setSuggestionDismissed(true);
  };

  const { projects, clients, recents } = bita;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl px-4 pb-6 pt-3 max-h-[85dvh] overflow-y-auto border-t border-border"
      >
        <SheetTitle className="sr-only">
          {mode === "switch" ? "Cambiar actividad" : "Iniciar actividad"}
        </SheetTitle>

        <div className="flex justify-center mb-3">
          <div className="h-1 w-10 rounded-full bg-foreground/15" />
        </div>

        {/* Quick Actions — above the input */}
        <div className="flex gap-1.5 mb-3">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.key}
                onClick={() => handleQuickAction(action)}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-background-secondary py-2.5 text-[11px] font-medium text-foreground-secondary hover:text-foreground hover:bg-background-tertiary transition-colors active:scale-[0.97] disabled:opacity-50"
              >
                <Icon className="h-3.5 w-3.5" />
                {action.label}
              </button>
            );
          })}
        </div>

        {/* Input */}
        <div className="space-y-2">
          <div className="relative">
            <Input
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe o dicta lo que estás haciendo…"
              className="h-12 text-[15px] pr-24 bg-background-secondary border-0 rounded-xl placeholder:text-foreground-muted focus-visible:ring-1 focus-visible:ring-accent/40"
              disabled={loading}
            />
            <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {speech.isSupported && (
                <button
                  onClick={toggleMic}
                  disabled={loading}
                  className={`h-9 w-9 rounded-lg flex items-center justify-center transition-all ${
                    speech.isListening
                      ? "bg-accent text-accent-foreground animate-pulse"
                      : "bg-background-tertiary text-foreground-muted hover:text-foreground"
                  } disabled:opacity-50`}
                >
                  {speech.isListening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                </button>
              )}
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="h-9 w-9 rounded-lg bg-accent flex items-center justify-center text-accent-foreground hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
              >
                <Play className="h-4 w-4 ml-0.5" />
              </button>
            </div>
          </div>

          {/* Auto-suggest */}
          {showSuggestion && (
            <div className="flex items-center gap-2 px-1 animate-in fade-in-0 slide-in-from-top-1 duration-150">
              <span className="text-[11px] text-foreground-muted">¿Para</span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[11px] font-medium text-accent">
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: getClientColor(suggestion.clientName) }}
                />
                {suggestion.clientName}
                {suggestion.projectName && ` · ${suggestion.projectName}`}
              </span>
              <span className="text-[11px] text-foreground-muted">?</span>
              <button
                onClick={acceptSuggestion}
                className="h-5 w-5 rounded-full bg-accent/15 flex items-center justify-center text-accent hover:bg-accent/25 transition-colors"
              >
                <Check className="h-3 w-3" />
              </button>
              <button
                onClick={() => setSuggestionDismissed(true)}
                className="h-5 w-5 rounded-full bg-foreground/5 flex items-center justify-center text-foreground-muted hover:text-foreground transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}

          {/* AI Refine */}
          <AiRefineButton
            text={text}
            onAccept={(refined) => setText(refined)}
            onAcceptStructured={(s) => {
              setText(s.title);
              if (s.description) setNotes(s.description);
            }}
          />
        </div>

        {/* Details — always visible, no collapsible toggle */}
        <div className="mt-3 px-1">
          <ActivityDetailsPanel
            clients={clients}
            projects={projects}
            selectedClientId={selectedClientId}
            selectedProjectId={selectedProjectId}
            selectedActivityType={selectedActivityType}
            isBillable={isBillable}
            notes={notes}
            onClientChange={setSelectedClientId}
            onProjectChange={(id) => {
              setSelectedProjectId(id);
              if (id) {
                const project = projects.find((p) => p.id === id);
                if (project) setSelectedClientId(project.clientId);
              }
            }}
            onActivityTypeChange={setSelectedActivityType}
            onBillableChange={setIsBillable}
            onNotesChange={setNotes}
            onClientCreated={(client) => {
              // Immediately refresh so new client appears in chips
              bita.refreshClients();
            }}
            onProjectCreated={() => bita.refreshProjects()}
          />
        </div>

        {/* Recents */}
        {recents.length > 0 && (
          <div className="mt-4">
            <p className="text-[10px] font-semibold text-foreground-muted uppercase tracking-wider px-1 mb-2">
              Recientes
            </p>
            <div className="space-y-0.5">
              {recents.map((item) => {
                const actType = getNormalizedActivityType({
                  description: item.description,
                  client_id: item.clientId,
                });
                const config = getActivityConfig(actType);
                const Icon = config.icon;

                return (
                  <button
                    key={item.id}
                    onClick={() =>
                      handleStart(item.description, item.clientId, item.taskId, item.projectId)
                    }
                    disabled={loading}
                    className="flex items-center gap-3 w-full rounded-lg px-2.5 py-2.5 hover:bg-background-secondary transition-colors text-left active:scale-[0.98] disabled:opacity-50"
                  >
                    <div
                      className="h-7 w-7 rounded-full flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: item.clientId
                          ? `${getClientColor(item.clientName || "")}20`
                          : `${config.color}20`,
                      }}
                    >
                      {item.clientId ? (
                        <span
                          className="text-[10px] font-bold"
                          style={{ color: getClientColor(item.clientName || "") }}
                        >
                          {(item.clientName || "?").slice(0, 2).toUpperCase()}
                        </span>
                      ) : (
                        <Icon className="h-3.5 w-3.5" style={{ color: config.color }} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-foreground truncate">
                        {item.taskTitle || item.description || config.label}
                      </p>
                      {(item.clientName || item.description) && (
                        <p className="text-[11px] text-foreground-secondary truncate">
                          {item.clientName || item.description}
                        </p>
                      )}
                    </div>
                    <Clock className="h-3.5 w-3.5 text-foreground-muted shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
