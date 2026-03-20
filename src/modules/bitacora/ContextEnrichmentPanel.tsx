import { useState, useEffect, useMemo } from "react";
import { useBitacora } from "./BitacoraContext";
import { getClientColor } from "@/lib/timer-utils";
import {
  FolderOpen,
  Building2,
  CheckSquare,
  X,
  ChevronUp,
  Plus,
  Sparkles,
} from "lucide-react";
import { ActivityDetailsPanel } from "@/components/ActivityDetailsPanel";

interface TaskOption {
  id: string;
  title: string;
  projectId: string | null;
  clientId: string | null;
}

/**
 * Real context enrichment panel for the active session.
 * Now uses the shared ActivityDetailsPanel component.
 */
export function ContextEnrichmentPanel() {
  const { activeEntry, projects, clients, updateActiveEntry, config, refreshClients, refreshProjects } = useBitacora();
  const [isOpen, setIsOpen] = useState(false);
  const [tasks, setTasks] = useState<TaskOption[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);

  // Load tasks for oasis mode
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
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border bg-accent/5 text-[12px] font-semibold text-accent hover:bg-accent/10 transition-colors"
          >
            {hasAnyContext ? (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                Editar detalles
              </>
            ) : (
              <>
                <Plus className="h-3.5 w-3.5" />
                Añadir detalles
              </>
            )}
          </button>
        </div>
      )}

      {/* Expanded: ActivityDetailsPanel */}
      {isOpen && (
        <div className="rounded-lg border border-border bg-background p-2.5 space-y-2 animate-in fade-in-0 slide-in-from-top-1 duration-200">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-foreground-secondary uppercase tracking-wider">
              Detalles de actividad
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="h-5 w-5 rounded-full flex items-center justify-center text-foreground-muted hover:text-foreground hover:bg-foreground/10 transition-colors"
            >
              <ChevronUp className="h-3 w-3" />
            </button>
          </div>

          <ActivityDetailsPanel
            clients={clients}
            projects={projects}
            tasks={tasks}
            selectedClientId={activeEntry.clientId}
            selectedProjectId={activeEntry.projectId}
            selectedTaskId={activeEntry.taskId}
            onClientChange={(id) => {
              const updates: Record<string, string | null> = { clientId: id };
              if (currentProject && id && currentProject.clientId !== id) {
                updates.projectId = null;
              }
              updateActiveEntry(updates as any);
            }}
            onProjectChange={(id) => {
              if (id) {
                const proj = projects.find((p) => p.id === id);
                updateActiveEntry({ projectId: id, clientId: proj?.clientId || activeEntry.clientId } as any);
              } else {
                updateActiveEntry({ projectId: null } as any);
              }
            }}
            onTaskChange={(id) => {
              if (id) {
                const task = tasks.find((t) => t.id === id);
                const updates: Record<string, string | null> = { taskId: id };
                if (task?.projectId && !activeEntry.projectId) {
                  updates.projectId = task.projectId;
                  const proj = projects.find((p) => p.id === task.projectId);
                  if (proj && !activeEntry.clientId) updates.clientId = proj.clientId;
                } else if (task?.clientId && !activeEntry.clientId) {
                  updates.clientId = task.clientId;
                }
                updateActiveEntry(updates as any);
              } else {
                updateActiveEntry({ taskId: null } as any);
              }
            }}
            showActivityType={false}
            showBillable={false}
            showNotes={false}
          />
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
