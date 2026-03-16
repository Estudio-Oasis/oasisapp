import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTimer } from "@/contexts/TimerContext";
import { getClientColor } from "@/lib/timer-utils";
import { Plus, X, FolderOpen, Building2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ContextOption {
  id: string;
  name: string;
}

/**
 * Inline context chips for the active session.
 * Allows adding/changing project and client without stopping the timer.
 */
export function InlineContextChips() {
  const { activeEntry, activeClient, updateActiveEntry } = useTimer();

  const [projects, setProjects] = useState<(ContextOption & { clientId: string })[]>([]);
  const [clients, setClients] = useState<ContextOption[]>([]);
  const [projectPopoverOpen, setProjectPopoverOpen] = useState(false);
  const [clientPopoverOpen, setClientPopoverOpen] = useState(false);

  // Load options once
  useEffect(() => {
    supabase
      .from("projects")
      .select("id, name, client_id")
      .eq("status", "active")
      .order("name")
      .then(({ data }) =>
        setProjects((data || []).map((p) => ({ id: p.id, name: p.name, clientId: p.client_id })))
      );
    supabase
      .from("clients")
      .select("id, name")
      .eq("status", "active")
      .order("name")
      .then(({ data }) => setClients(data || []));
  }, []);

  if (!activeEntry) return null;

  const currentProjectId = activeEntry.project_id;
  const currentClientId = activeEntry.client_id;
  const currentProject = projects.find((p) => p.id === currentProjectId);
  const currentClient = activeClient || clients.find((c) => c.id === currentClientId);

  const handleSelectProject = async (project: (typeof projects)[0]) => {
    await updateActiveEntry({
      projectId: project.id,
      clientId: project.clientId, // auto-set client from project
    });
    setProjectPopoverOpen(false);
  };

  const handleClearProject = async () => {
    await updateActiveEntry({ projectId: null });
  };

  const handleSelectClient = async (client: ContextOption) => {
    await updateActiveEntry({ clientId: client.id });
    setClientPopoverOpen(false);
  };

  const handleClearClient = async () => {
    await updateActiveEntry({ clientId: null });
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 mt-2">
      {/* ── Project chip ── */}
      {currentProject ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-foreground/10 pl-2 pr-1 py-0.5 text-[11px] font-medium text-foreground-secondary">
          <FolderOpen className="h-3 w-3 text-foreground-muted" />
          {currentProject.name}
          <button
            onClick={handleClearProject}
            className="ml-0.5 h-4 w-4 rounded-full flex items-center justify-center hover:bg-foreground/10 transition-colors"
          >
            <X className="h-2.5 w-2.5" />
          </button>
        </span>
      ) : (
        <Popover open={projectPopoverOpen} onOpenChange={setProjectPopoverOpen}>
          <PopoverTrigger asChild>
            <button className="inline-flex items-center gap-1 rounded-full border border-dashed border-foreground/20 px-2 py-0.5 text-[10px] font-medium text-foreground-muted hover:text-foreground-secondary hover:border-foreground/30 transition-colors">
              <Plus className="h-2.5 w-2.5" />
              Proyecto
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-52 p-1.5" align="start" side="bottom">
            <div className="max-h-48 overflow-y-auto space-y-0.5">
              {projects.length === 0 && (
                <p className="text-[11px] text-foreground-muted px-2 py-2">Sin proyectos</p>
              )}
              {projects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSelectProject(p)}
                  className="flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-[12px] text-foreground hover:bg-background-secondary transition-colors text-left"
                >
                  <FolderOpen className="h-3 w-3 text-foreground-muted shrink-0" />
                  <span className="truncate">{p.name}</span>
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}

      {/* ── Client chip ── */}
      {currentClient ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-foreground/10 pl-2 pr-1 py-0.5 text-[11px] font-medium text-foreground-secondary">
          <span
            className="h-2 w-2 rounded-full shrink-0"
            style={{ backgroundColor: getClientColor(currentClient.name || "") }}
          />
          {currentClient.name}
          <button
            onClick={handleClearClient}
            className="ml-0.5 h-4 w-4 rounded-full flex items-center justify-center hover:bg-foreground/10 transition-colors"
          >
            <X className="h-2.5 w-2.5" />
          </button>
        </span>
      ) : (
        <Popover open={clientPopoverOpen} onOpenChange={setClientPopoverOpen}>
          <PopoverTrigger asChild>
            <button className="inline-flex items-center gap-1 rounded-full border border-dashed border-foreground/20 px-2 py-0.5 text-[10px] font-medium text-foreground-muted hover:text-foreground-secondary hover:border-foreground/30 transition-colors">
              <Plus className="h-2.5 w-2.5" />
              Cliente
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-1.5" align="start" side="bottom">
            <div className="max-h-48 overflow-y-auto space-y-0.5">
              {clients.length === 0 && (
                <p className="text-[11px] text-foreground-muted px-2 py-2">Sin clientes</p>
              )}
              {clients.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleSelectClient(c)}
                  className="flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-[12px] text-foreground hover:bg-background-secondary transition-colors text-left"
                >
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: getClientColor(c.name) }}
                  />
                  <span className="truncate">{c.name}</span>
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
