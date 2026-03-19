import { useState, useRef, useEffect, useCallback } from "react";
import { useBitacora } from "./BitacoraContext";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Play,
  Clock,
  Video,
  Coffee,
  Utensils,
  ListTodo,
  ChevronDown,
  ChevronUp,
  Mic,
  MicOff,
  Plus,
  DollarSign,
  FileText,
} from "lucide-react";
import { getClientColor } from "@/lib/timer-utils";
import { getNormalizedActivityType, getActivityConfig } from "@/components/timer/ActivityConstants";
import { toast } from "sonner";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { AiRefineButton } from "@/components/timer/AiRefineButton";
import { trackEvent } from "@/lib/analytics";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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

const ACTIVITY_TYPES = [
  { key: "trabajo", label: "Trabajo" },
  { key: "reunion", label: "Reunión" },
  { key: "revision", label: "Revisión" },
  { key: "planeacion", label: "Planeación" },
  { key: "administracion", label: "Admin" },
  { key: "break", label: "Descanso" },
  { key: "comida", label: "Comida" },
  { key: "pendientes", label: "Pendientes" },
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
  const [showContext, setShowContext] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedActivityType, setSelectedActivityType] = useState<string | null>(null);
  const [isBillable, setIsBillable] = useState(true);
  const [notes, setNotes] = useState("");
  const [newClientName, setNewClientName] = useState("");
  const [showNewClient, setShowNewClient] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [showNewProject, setShowNewProject] = useState(false);
  const [creatingClient, setCreatingClient] = useState(false);
  const [creatingProject, setCreatingProject] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setText("");
      setShowContext(false);
      setSelectedClientId(null);
      setSelectedProjectId(null);
      setSelectedActivityType(null);
      setIsBillable(true);
      setNotes("");
      setNewClientName("");
      setShowNewClient(false);
      setNewProjectName("");
      setShowNewProject(false);
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

  // Auto-set billable based on activity type
  useEffect(() => {
    if (selectedActivityType === "break" || selectedActivityType === "comida") {
      setIsBillable(false);
    } else if (selectedActivityType === "trabajo" || selectedActivityType === "reunion") {
      setIsBillable(true);
    }
  }, [selectedActivityType]);

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

  const handleProjectSelect = (projectId: string) => {
    setSelectedProjectId(projectId);
    const project = bita.projects.find((p) => p.id === projectId);
    if (project) setSelectedClientId(project.clientId);
  };

  const toggleMic = () => {
    if (speech.isListening) {
      speech.stopListening();
    } else {
      trackEvent("dictation_used", { source: "quick_sheet" });
      speech.startListening();
    }
  };

  const handleCreateClient = async () => {
    if (!newClientName.trim() || !user) return;
    setCreatingClient(true);
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("agency_id")
        .eq("id", user.id)
        .single();

      if (!profile?.agency_id) throw new Error("No agency");

      const { data: newClient, error } = await supabase
        .from("clients")
        .insert({ name: newClientName.trim(), agency_id: profile.agency_id })
        .select("id, name")
        .single();

      if (error) throw error;
      if (newClient) {
        setSelectedClientId(newClient.id);
        setNewClientName("");
        setShowNewClient(false);
        toast.success(`Cliente "${newClient.name}" creado`);
      }
    } catch {
      toast.error("No se pudo crear el cliente");
    } finally {
      setCreatingClient(false);
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim() || !selectedClientId) return;
    setCreatingProject(true);
    try {
      const { data: newProj, error } = await supabase
        .from("projects")
        .insert({ name: newProjectName.trim(), client_id: selectedClientId })
        .select("id, name")
        .single();

      if (error) throw error;
      if (newProj) {
        setSelectedProjectId(newProj.id);
        setNewProjectName("");
        setShowNewProject(false);
        toast.success(`Proyecto "${newProj.name}" creado`);
      }
    } catch {
      toast.error("No se pudo crear el proyecto");
    } finally {
      setCreatingProject(false);
    }
  };

  const { projects, clients, recents } = bita;

  // Filter projects by selected client
  const filteredProjects = selectedClientId
    ? projects.filter((p) => p.clientId === selectedClientId)
    : projects;

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

        {/* Quick Actions */}
        <div className="flex gap-1.5 mt-3">
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

        {/* Añadir detalles */}
        <button
          onClick={() => setShowContext(!showContext)}
          className="flex items-center gap-1 mt-3 px-1 text-[11px] font-medium text-foreground-muted hover:text-foreground-secondary transition-colors"
        >
          {showContext ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          Añadir detalles
          {(selectedProjectId || selectedClientId) && <span className="text-accent ml-1">·</span>}
          {selectedProjectId && (
            <span className="text-accent text-[10px]">
              {projects.find((p) => p.id === selectedProjectId)?.name}
            </span>
          )}
        </button>

        {showContext && (
          <div className="mt-2 space-y-4 px-1 animate-in fade-in-0 slide-in-from-top-2 duration-200">
            {/* Section 1: Cliente y Proyecto */}
            <div className="space-y-3">
              <p className="text-[10px] font-semibold text-foreground-muted uppercase tracking-wider">
                Cliente y proyecto
              </p>

              {/* Clients */}
              <div>
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                  {clients.map((c) => (
                    <button
                      key={c.id}
                      onClick={() =>
                        setSelectedClientId(selectedClientId === c.id ? null : c.id)
                      }
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors shrink-0 ${
                        selectedClientId === c.id
                          ? "border-accent bg-accent/15 text-accent"
                          : "border-border text-foreground-secondary hover:text-foreground hover:border-foreground/30"
                      }`}
                    >
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: getClientColor(c.name) }}
                      />
                      {c.name}
                      {selectedClientId === c.id && <span className="text-accent/60 ml-0.5">×</span>}
                    </button>
                  ))}
                  {/* + Nuevo cliente */}
                  {!showNewClient ? (
                    <button
                      onClick={() => setShowNewClient(true)}
                      className="inline-flex items-center gap-1 rounded-full border border-dashed border-border px-2.5 py-1 text-[11px] font-medium text-foreground-muted hover:text-foreground hover:border-foreground/30 transition-colors shrink-0"
                    >
                      <Plus className="h-3 w-3" />
                      Nuevo cliente
                    </button>
                  ) : (
                    <div className="inline-flex items-center gap-1 shrink-0">
                      <Input
                        value={newClientName}
                        onChange={(e) => setNewClientName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleCreateClient()}
                        placeholder="Nombre del cliente"
                        className="h-7 w-32 text-[11px] border-accent/30"
                        autoFocus
                        disabled={creatingClient}
                      />
                      <button
                        onClick={handleCreateClient}
                        disabled={!newClientName.trim() || creatingClient}
                        className="h-7 px-2 rounded-md bg-accent/15 text-[11px] text-accent hover:bg-accent/25 disabled:opacity-40 transition-colors"
                      >
                        {creatingClient ? "…" : "Crear"}
                      </button>
                      <button
                        onClick={() => { setShowNewClient(false); setNewClientName(""); }}
                        className="h-7 px-1.5 text-foreground-muted hover:text-foreground text-[11px]"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Projects (only if client selected) */}
              {selectedClientId && (
                <div className="animate-in fade-in-0 slide-in-from-top-1 duration-150">
                  <p className="text-[10px] text-foreground-muted mb-1.5">Proyecto</p>
                  <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                    {filteredProjects.map((p) => (
                      <button
                        key={p.id}
                        onClick={() =>
                          selectedProjectId === p.id
                            ? (setSelectedProjectId(null))
                            : handleProjectSelect(p.id)
                        }
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors shrink-0 ${
                          selectedProjectId === p.id
                            ? "border-accent bg-accent/15 text-accent"
                            : "border-border text-foreground-secondary hover:text-foreground hover:border-foreground/30"
                        }`}
                      >
                        {p.name}
                        {selectedProjectId === p.id && <span className="text-accent/60">×</span>}
                      </button>
                    ))}
                    {/* + Nuevo proyecto */}
                    {!showNewProject ? (
                      <button
                        onClick={() => setShowNewProject(true)}
                        className="inline-flex items-center gap-1 rounded-full border border-dashed border-border px-2.5 py-1 text-[11px] font-medium text-foreground-muted hover:text-foreground hover:border-foreground/30 transition-colors shrink-0"
                      >
                        <Plus className="h-3 w-3" />
                        Nuevo proyecto
                      </button>
                    ) : (
                      <div className="inline-flex items-center gap-1 shrink-0">
                        <Input
                          value={newProjectName}
                          onChange={(e) => setNewProjectName(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleCreateProject()}
                          placeholder="Nombre del proyecto"
                          className="h-7 w-32 text-[11px] border-accent/30"
                          autoFocus
                          disabled={creatingProject}
                        />
                        <button
                          onClick={handleCreateProject}
                          disabled={!newProjectName.trim() || creatingProject}
                          className="h-7 px-2 rounded-md bg-accent/15 text-[11px] text-accent hover:bg-accent/25 disabled:opacity-40 transition-colors"
                        >
                          {creatingProject ? "…" : "Crear"}
                        </button>
                        <button
                          onClick={() => { setShowNewProject(false); setNewProjectName(""); }}
                          className="h-7 px-1.5 text-foreground-muted hover:text-foreground text-[11px]"
                        >
                          ×
                        </button>
                      </div>
                    )}
                    {filteredProjects.length === 0 && !showNewProject && (
                      <span className="text-[11px] text-foreground-muted py-1">Sin proyectos para este cliente</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Section 2: Clasificación */}
            <div className="space-y-3">
              <p className="text-[10px] font-semibold text-foreground-muted uppercase tracking-wider">
                Clasificación
              </p>

              {/* Activity type */}
              <div className="flex gap-1 flex-wrap">
                {ACTIVITY_TYPES.map((at) => (
                  <button
                    key={at.key}
                    onClick={() =>
                      setSelectedActivityType(selectedActivityType === at.key ? null : at.key)
                    }
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                      selectedActivityType === at.key
                        ? "border-accent bg-accent/15 text-accent"
                        : "border-border text-foreground-secondary hover:text-foreground hover:border-foreground/30"
                    }`}
                  >
                    {at.label}
                  </button>
                ))}
              </div>

              {/* Billable toggle */}
              <div className="flex items-center justify-between rounded-lg bg-background-secondary px-3 py-2">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-3.5 w-3.5 text-foreground-muted" />
                  <span className="text-[12px] font-medium text-foreground-secondary">Facturable</span>
                </div>
                <Switch
                  checked={isBillable}
                  onCheckedChange={setIsBillable}
                  className="scale-90"
                />
              </div>
            </div>

            {/* Section 3: Notas */}
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold text-foreground-muted uppercase tracking-wider flex items-center gap-1">
                <FileText className="h-3 w-3" />
                Notas
              </p>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notas, contexto, enlaces..."
                className="min-h-[60px] text-[12px] bg-background-secondary border-0 rounded-lg resize-none placeholder:text-foreground-muted/60"
              />
            </div>
          </div>
        )}

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
                      handleStart(
                        item.description,
                        item.clientId,
                        item.taskId,
                        item.projectId
                      )
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
                        <Icon
                          className="h-3.5 w-3.5"
                          style={{ color: config.color }}
                        />
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
