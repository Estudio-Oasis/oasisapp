import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  DollarSign,
  FileText,
  X,
} from "lucide-react";
import { getClientColor } from "@/lib/timer-utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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

interface ClientOption {
  id: string;
  name: string;
}

interface ProjectOption {
  id: string;
  name: string;
  clientId: string;
}

interface TaskOption {
  id: string;
  title: string;
  projectId: string | null;
  clientId: string | null;
}

interface ActivityDetailsPanelProps {
  clients: ClientOption[];
  projects: ProjectOption[];
  tasks?: TaskOption[];
  selectedClientId: string | null;
  selectedProjectId: string | null;
  selectedTaskId?: string | null;
  selectedActivityType?: string | null;
  isBillable?: boolean;
  notes?: string;
  onClientChange: (id: string | null) => void;
  onProjectChange: (id: string | null) => void;
  onTaskChange?: (id: string | null) => void;
  onActivityTypeChange?: (type: string | null) => void;
  onBillableChange?: (billable: boolean) => void;
  onNotesChange?: (notes: string) => void;
  onClientCreated?: (client: ClientOption) => void;
  onProjectCreated?: (project: ProjectOption) => void;
  onTaskCreated?: (task: TaskOption) => void;
  showActivityType?: boolean;
  showBillable?: boolean;
  showNotes?: boolean;
}

export function ActivityDetailsPanel({
  clients,
  projects,
  tasks = [],
  selectedClientId,
  selectedProjectId,
  selectedTaskId = null,
  selectedActivityType = null,
  isBillable = true,
  notes = "",
  onClientChange,
  onProjectChange,
  onTaskChange,
  onActivityTypeChange,
  onBillableChange,
  onNotesChange,
  onClientCreated,
  onProjectCreated,
  onTaskCreated,
  showActivityType = true,
  showBillable = true,
  showNotes = true,
}: ActivityDetailsPanelProps) {
  const { user } = useAuth();
  const [showNewClient, setShowNewClient] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [creatingClient, setCreatingClient] = useState(false);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [creatingProject, setCreatingProject] = useState(false);
  const [showNewTask, setShowNewTask] = useState(false);
  const [newTaskName, setNewTaskName] = useState("");
  const [creatingTask, setCreatingTask] = useState(false);

  useEffect(() => {
    if (!onBillableChange) return;
    if (selectedActivityType === "break" || selectedActivityType === "comida") {
      onBillableChange(false);
    } else if (selectedActivityType === "trabajo" || selectedActivityType === "reunion") {
      onBillableChange(true);
    }
  }, [selectedActivityType]);

  const filteredProjects = selectedClientId
    ? projects.filter((p) => p.clientId === selectedClientId)
    : projects;

  const filteredTasks = selectedProjectId
    ? tasks.filter((t) => t.projectId === selectedProjectId)
    : selectedClientId
      ? tasks.filter((t) => t.clientId === selectedClientId)
      : tasks;

  const uniqueTasks = filteredTasks.filter(
    (t, i, arr) => arr.findIndex((x) => x.id === t.id) === i
  );

  const handleCreateClient = async () => {
    if (!newClientName.trim() || !user) return;
    const trimmedName = newClientName.trim();

    // Duplicate prevention: check local list first
    const existingLocal = clients.find(
      (c) => c.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (existingLocal) {
      onClientChange(existingLocal.id);
      toast.info(`"${existingLocal.name}" ya existe. Seleccionado.`);
      setNewClientName("");
      setShowNewClient(false);
      return;
    }

    setCreatingClient(true);
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("agency_id")
        .eq("id", user.id)
        .single();
      if (!profile?.agency_id) throw new Error("No agency");

      // Server-side duplicate check
      const { data: existing } = await supabase
        .from("clients")
        .select("id, name")
        .eq("agency_id", profile.agency_id)
        .ilike("name", trimmedName);
      if (existing && existing.length > 0) {
        onClientChange(existing[0].id);
        onClientCreated?.({ id: existing[0].id, name: existing[0].name });
        toast.info(`"${existing[0].name}" ya existe. Seleccionado.`);
        setNewClientName("");
        setShowNewClient(false);
        return;
      }

      const { data: newClient, error } = await supabase
        .from("clients")
        .insert({ name: trimmedName, agency_id: profile.agency_id })
        .select("id, name")
        .single();
      if (error) throw error;
      if (newClient) {
        onClientChange(newClient.id);
        onClientCreated?.({ id: newClient.id, name: newClient.name });
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
    const trimmedName = newProjectName.trim();

    // Duplicate prevention
    const existingLocal = projects.find(
      (p) => p.clientId === selectedClientId && p.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (existingLocal) {
      onProjectChange(existingLocal.id);
      toast.info(`"${existingLocal.name}" ya existe. Seleccionado.`);
      setNewProjectName("");
      setShowNewProject(false);
      return;
    }

    setCreatingProject(true);
    try {
      const { data: newProj, error } = await supabase
        .from("projects")
        .insert({ name: trimmedName, client_id: selectedClientId })
        .select("id, name, client_id")
        .single();
      if (error) throw error;
      if (newProj) {
        onProjectChange(newProj.id);
        onProjectCreated?.({ id: newProj.id, name: newProj.name, clientId: newProj.client_id });
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

  const handleCreateTask = async () => {
    if (!newTaskName.trim() || !selectedProjectId) return;
    setCreatingTask(true);
    try {
      const { data: newTask, error } = await supabase
        .from("tasks")
        .insert({
          title: newTaskName.trim(),
          project_id: selectedProjectId,
          client_id: selectedClientId,
        })
        .select("id, title, project_id, client_id")
        .single();
      if (error) throw error;
      if (newTask) {
        onTaskChange?.(newTask.id);
        onTaskCreated?.({
          id: newTask.id,
          title: newTask.title,
          projectId: newTask.project_id,
          clientId: newTask.client_id,
        });
        setNewTaskName("");
        setShowNewTask(false);
        toast.success(`Tarea "${newTask.title}" creada`);
      }
    } catch {
      toast.error("No se pudo crear la tarea");
    } finally {
      setCreatingTask(false);
    }
  };

  const handleProjectSelect = (projectId: string) => {
    onProjectChange(projectId);
    const project = projects.find((p) => p.id === projectId);
    if (project) onClientChange(project.clientId);
  };

  const handleTaskSelect = (taskId: string) => {
    onTaskChange?.(taskId);
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      if (task.projectId) {
        onProjectChange(task.projectId);
        const proj = projects.find((p) => p.id === task.projectId);
        if (proj) onClientChange(proj.clientId);
      } else if (task.clientId) {
        onClientChange(task.clientId);
      }
    }
  };

  const renderInlineCreate = (
    show: boolean,
    setShow: (v: boolean) => void,
    value: string,
    setValue: (v: string) => void,
    creating: boolean,
    onCreate: () => void,
    label: string,
    placeholder: string,
  ) => {
    if (!show) {
      return (
        <button
          onClick={() => setShow(true)}
          className="inline-flex items-center gap-1 rounded-full border border-dashed border-accent/40 px-2.5 py-1 text-[11px] font-medium text-accent hover:bg-accent/10 hover:border-accent/60 transition-colors"
        >
          <Plus className="h-3 w-3" />
          {label}
        </button>
      );
    }
    return (
      <div className="inline-flex items-center gap-1">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onCreate()}
          placeholder={placeholder}
          className="h-7 w-32 text-[11px] border-accent/30"
          autoFocus
          disabled={creating}
        />
        <button
          onClick={onCreate}
          disabled={!value.trim() || creating}
          className="h-7 px-2 rounded-md bg-accent/15 text-[11px] text-accent hover:bg-accent/25 disabled:opacity-40 transition-colors"
        >
          {creating ? "…" : "Crear"}
        </button>
        <button
          onClick={() => { setShow(false); setValue(""); }}
          className="h-7 px-1.5 text-foreground-muted hover:text-foreground text-[11px]"
        >
          ×
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-4 animate-in fade-in-0 slide-in-from-top-2 duration-200">
      {/* Section 1: Cliente y Proyecto */}
      <div className="space-y-3">
        <p className="text-[10px] font-semibold text-foreground-muted uppercase tracking-wider">
          Cliente y proyecto
        </p>

        {/* Clients — wrap layout, create-first */}
        <div className="flex flex-wrap gap-1.5">
          {renderInlineCreate(showNewClient, setShowNewClient, newClientName, setNewClientName, creatingClient, handleCreateClient, "Nuevo cliente", "Nombre del cliente")}
          {clients.map((c) => (
            <button
              key={c.id}
              onClick={() => onClientChange(selectedClientId === c.id ? null : c.id)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
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
        </div>

        {/* Projects (only if client selected) */}
        {selectedClientId && (
          <div className="animate-in fade-in-0 slide-in-from-top-1 duration-150">
            <p className="text-[10px] text-foreground-muted mb-1.5">Proyecto</p>
            <div className="flex flex-wrap gap-1.5">
              {renderInlineCreate(showNewProject, setShowNewProject, newProjectName, setNewProjectName, creatingProject, handleCreateProject, "Nuevo proyecto", "Nombre del proyecto")}
              {filteredProjects.map((p) => (
                <button
                  key={p.id}
                  onClick={() =>
                    selectedProjectId === p.id
                      ? onProjectChange(null)
                      : handleProjectSelect(p.id)
                  }
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                    selectedProjectId === p.id
                      ? "border-accent bg-accent/15 text-accent"
                      : "border-border text-foreground-secondary hover:text-foreground hover:border-foreground/30"
                  }`}
                >
                  {p.name}
                  {selectedProjectId === p.id && <span className="text-accent/60">×</span>}
                </button>
              ))}
              {filteredProjects.length === 0 && !showNewProject && (
                <span className="text-[11px] text-foreground-muted py-1">Sin proyectos para este cliente</span>
              )}
            </div>
          </div>
        )}

        {/* Tasks (only if project selected) */}
        {selectedProjectId && onTaskChange && (
          <div className="animate-in fade-in-0 slide-in-from-top-1 duration-150">
            <p className="text-[10px] text-foreground-muted mb-1.5">Tarea</p>
            <div className="flex flex-wrap gap-1.5">
              {renderInlineCreate(showNewTask, setShowNewTask, newTaskName, setNewTaskName, creatingTask, handleCreateTask, "Nueva tarea", "Nombre de la tarea")}
              {uniqueTasks.map((t) => (
                <button
                  key={t.id}
                  onClick={() =>
                    selectedTaskId === t.id
                      ? onTaskChange(null)
                      : handleTaskSelect(t.id)
                  }
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                    selectedTaskId === t.id
                      ? "border-accent bg-accent/15 text-accent"
                      : "border-border text-foreground-secondary hover:text-foreground hover:border-foreground/30"
                  }`}
                >
                  {t.title}
                  {selectedTaskId === t.id && <span className="text-accent/60">×</span>}
                </button>
              ))}
              {uniqueTasks.length === 0 && !showNewTask && (
                <span className="text-[11px] text-foreground-muted py-1">Sin tareas para este proyecto</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Section 2: Clasificación */}
      {(showActivityType || showBillable) && (
        <div className="space-y-3">
          <p className="text-[10px] font-semibold text-foreground-muted uppercase tracking-wider">
            Clasificación
          </p>

          {showActivityType && onActivityTypeChange && (
            <div className="flex gap-1 flex-wrap">
              {ACTIVITY_TYPES.map((at) => (
                <button
                  key={at.key}
                  onClick={() =>
                    onActivityTypeChange(selectedActivityType === at.key ? null : at.key)
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
          )}

          {showBillable && onBillableChange && (
            <div className="flex items-center justify-between rounded-lg bg-background-secondary px-3 py-2">
              <div className="flex items-center gap-2">
                <DollarSign className="h-3.5 w-3.5 text-foreground-muted" />
                <span className="text-[12px] font-medium text-foreground-secondary">Facturable</span>
              </div>
              <Switch
                checked={isBillable}
                onCheckedChange={onBillableChange}
                className="scale-90"
              />
            </div>
          )}
        </div>
      )}

      {/* Section 3: Notas */}
      {showNotes && onNotesChange && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold text-foreground-muted uppercase tracking-wider flex items-center gap-1">
            <FileText className="h-3 w-3" />
            Notas
          </p>
          <Textarea
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Notas, contexto, enlaces..."
            className="min-h-[60px] text-[12px] bg-background-secondary border-0 rounded-lg resize-none placeholder:text-foreground-muted/60"
          />
        </div>
      )}
    </div>
  );
}
