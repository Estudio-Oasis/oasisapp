import { useState, useEffect, useMemo } from "react";
import { useBitacora } from "./BitacoraContext";
import { getClientColor } from "@/lib/timer-utils";
import {
  FolderOpen,
  Building2,
  CheckSquare,
  X,
  ChevronDown,
  ChevronUp,
  Plus,
  Sparkles,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface TaskOption {
  id: string;
  title: string;
  projectId: string | null;
  clientId: string | null;
}

/**
 * Real context enrichment panel for the active session.
 * Supports Project → Client → Task with cascading logic.
 */
export function ContextEnrichmentPanel() {
  const { activeEntry, projects, clients, updateActiveEntry, config } = useBitacora();
  const [isOpen, setIsOpen] = useState(false);
  const [tasks, setTasks] = useState<TaskOption[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);

  // Load tasks — for oasis mode, fetch from Supabase; for standalone, empty
  useEffect(() => {
    if (config.mode !== "oasis") return;
    setLoadingTasks(true);
    import("@/integrations/supabase/client").then(({ supabase }) => {
      supabase
        .from("tasks")
        .select("id, title, project_id, client_id")
        .in("status", ["todo", "in_progress"])
        .order("updated_at", { ascending: false })
        .limit(50)
        .then(({ data }) => {
          setTasks(
            (data || []).map((t) => ({
              id: t.id,
              title: t.title,
              projectId: t.project_id,
              clientId: t.client_id,
            }))
          );
          setLoadingTasks(false);
        });
    });
  }, [config.mode]);

  if (!activeEntry) return null;

  const currentProject = projects.find((p) => p.id === activeEntry.projectId);
  const currentClient = clients.find((c) => c.id === activeEntry.clientId);
  const currentTask = tasks.find((t) => t.id === activeEntry.taskId);

  const hasAnyContext = currentProject || currentClient || currentTask;

  // Cascading: filter projects by selected client
  const filteredProjects = activeEntry.clientId
    ? projects.filter((p) => p.clientId === activeEntry.clientId)
    : projects;

  // Cascading: filter tasks by selected project or client
  const filteredTasks = useMemo(() => {
    if (activeEntry.projectId) return tasks.filter((t) => t.projectId === activeEntry.projectId);
    if (activeEntry.clientId) return tasks.filter((t) => t.clientId === activeEntry.clientId);
    return tasks;
  }, [tasks, activeEntry.projectId, activeEntry.clientId]);

  const handleSelectProject = async (project: typeof projects[0]) => {
    await updateActiveEntry({
      projectId: project.id,
      clientId: project.clientId, // auto-fill client
    });
  };

  const handleSelectClient = async (client: typeof clients[0]) => {
    // If current project doesn't belong to this client, clear it
    const updates: Record<string, string | null> = { clientId: client.id };
    if (currentProject && currentProject.clientId !== client.id) {
      updates.projectId = null;
    }
    await updateActiveEntry(updates as any);
  };

  const handleSelectTask = async (task: TaskOption) => {
    const updates: Record<string, string | null> = { taskId: task.id };
    // Auto-fill project and client from task
    if (task.projectId && !activeEntry.projectId) {
      updates.projectId = task.projectId;
      const proj = projects.find((p) => p.id === task.projectId);
      if (proj && !activeEntry.clientId) {
        updates.clientId = proj.clientId;
      }
    } else if (task.clientId && !activeEntry.clientId) {
      updates.clientId = task.clientId;
    }
    await updateActiveEntry(updates as any);
  };

  return (
    <div className="mt-2">
      {/* Collapsed: show chips if context exists, or the add button */}
      {!isOpen && (
        <div className="flex flex-wrap items-center gap-1.5">
          {currentProject && (
            <ContextChip
              icon={<FolderOpen className="h-3 w-3" />}
              label={currentProject.name}
              onClear={() => updateActiveEntry({ projectId: null })}
            />
          )}
          {currentClient && (
            <ContextChip
              icon={
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: getClientColor(currentClient.name) }}
                />
              }
              label={currentClient.name}
              onClear={() => updateActiveEntry({ clientId: null })}
            />
          )}
          {currentTask && (
            <ContextChip
              icon={<CheckSquare className="h-3 w-3" />}
              label={currentTask.title}
              onClear={() => updateActiveEntry({ taskId: null })}
            />
          )}
          <button
            onClick={() => setIsOpen(true)}
            className="inline-flex items-center gap-1 rounded-full border border-dashed border-foreground/20 px-2 py-0.5 text-[10px] font-medium text-foreground-muted hover:text-foreground-secondary hover:border-foreground/30 transition-colors"
          >
            {hasAnyContext ? (
              <>
                <Sparkles className="h-2.5 w-2.5" />
                Editar contexto
              </>
            ) : (
              <>
                <Plus className="h-2.5 w-2.5" />
                Añadir contexto
              </>
            )}
          </button>
        </div>
      )}

      {/* Expanded: real enrichment panel */}
      {isOpen && (
        <div className="rounded-lg border border-border bg-background p-2.5 space-y-2 animate-in fade-in-0 slide-in-from-top-1 duration-200">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-foreground-secondary uppercase tracking-wider">
              Contexto de actividad
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="h-5 w-5 rounded-full flex items-center justify-center text-foreground-muted hover:text-foreground hover:bg-foreground/10 transition-colors"
            >
              <ChevronUp className="h-3 w-3" />
            </button>
          </div>

          {/* Project section */}
          <ContextSection
            icon={<FolderOpen className="h-3.5 w-3.5 text-foreground-muted" />}
            label="Proyecto"
            current={currentProject?.name}
            onClear={() => updateActiveEntry({ projectId: null })}
            options={filteredProjects.map((p) => ({ id: p.id, label: p.name }))}
            emptyLabel="Sin proyectos"
            onSelect={(id) => {
              const p = projects.find((x) => x.id === id);
              if (p) handleSelectProject(p);
            }}
          />

          {/* Client section */}
          <ContextSection
            icon={
              currentClient ? (
                <span
                  className="h-3 w-3 rounded-full shrink-0"
                  style={{ backgroundColor: getClientColor(currentClient.name) }}
                />
              ) : (
                <Building2 className="h-3.5 w-3.5 text-foreground-muted" />
              )
            }
            label="Cliente"
            current={currentClient?.name}
            onClear={() => updateActiveEntry({ clientId: null })}
            options={clients.map((c) => ({
              id: c.id,
              label: c.name,
              dot: getClientColor(c.name),
            }))}
            emptyLabel="Sin clientes"
            onSelect={(id) => {
              const c = clients.find((x) => x.id === id);
              if (c) handleSelectClient(c);
            }}
          />

          {/* Task section */}
          {(config.mode === "oasis" || tasks.length > 0) && (
            <ContextSection
              icon={<CheckSquare className="h-3.5 w-3.5 text-foreground-muted" />}
              label="Tarea"
              current={currentTask?.title}
              onClear={() => updateActiveEntry({ taskId: null })}
              options={filteredTasks.map((t) => ({ id: t.id, label: t.title }))}
              emptyLabel={loadingTasks ? "Cargando…" : "Sin tareas"}
              onSelect={(id) => {
                const t = tasks.find((x) => x.id === id);
                if (t) handleSelectTask(t);
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}

/* ── Small reusable pieces ── */

function ContextChip({
  icon,
  label,
  onClear,
}: {
  icon: React.ReactNode;
  label: string;
  onClear: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-foreground/10 pl-2 pr-1 py-0.5 text-[11px] font-medium text-foreground-secondary">
      {icon}
      <span className="truncate max-w-[120px]">{label}</span>
      <button
        onClick={onClear}
        className="ml-0.5 h-4 w-4 rounded-full flex items-center justify-center hover:bg-foreground/10 transition-colors"
      >
        <X className="h-2.5 w-2.5" />
      </button>
    </span>
  );
}

function ContextSection({
  icon,
  label,
  current,
  onClear,
  options,
  emptyLabel,
  onSelect,
}: {
  icon: React.ReactNode;
  label: string;
  current?: string | null;
  onClear: () => void;
  options: { id: string; label: string; dot?: string }[];
  emptyLabel: string;
  onSelect: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-md border border-border/60 bg-background-secondary/50">
      <button
        onClick={() => {
          if (current) return; // if already selected, don't expand — just show chip
          setExpanded(!expanded);
        }}
        className="flex items-center gap-2 w-full px-2.5 py-1.5 text-left"
      >
        {icon}
        {current ? (
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <span className="text-[12px] font-medium text-foreground truncate">{current}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              className="h-4 w-4 rounded-full flex items-center justify-center hover:bg-foreground/10 transition-colors shrink-0"
            >
              <X className="h-2.5 w-2.5 text-foreground-muted" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between flex-1">
            <span className="text-[12px] text-foreground-muted">{label}</span>
            {expanded ? (
              <ChevronUp className="h-3 w-3 text-foreground-muted" />
            ) : (
              <ChevronDown className="h-3 w-3 text-foreground-muted" />
            )}
          </div>
        )}
      </button>

      {expanded && !current && (
        <div className="border-t border-border/40 max-h-36 overflow-y-auto">
          {options.length === 0 ? (
            <p className="text-[11px] text-foreground-muted px-2.5 py-2">{emptyLabel}</p>
          ) : (
            options.map((opt) => (
              <button
                key={opt.id}
                onClick={() => {
                  onSelect(opt.id);
                  setExpanded(false);
                }}
                className="flex items-center gap-2 w-full px-2.5 py-1.5 text-[12px] text-foreground hover:bg-background-secondary transition-colors text-left"
              >
                {opt.dot && (
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: opt.dot }}
                  />
                )}
                <span className="truncate">{opt.label}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
