import { useState } from "react";
import { useBitacora } from "./BitacoraContext";
import { getClientColor } from "@/lib/timer-utils";
import { Plus, X, FolderOpen } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

/**
 * Inline context chips for active session — reads from abstract BitacoraContext.
 */
export function BitacoraInlineChips() {
  const { activeEntry, projects, clients, updateActiveEntry } = useBitacora();

  const [projectPopoverOpen, setProjectPopoverOpen] = useState(false);
  const [clientPopoverOpen, setClientPopoverOpen] = useState(false);

  if (!activeEntry) return null;

  const currentProject = projects.find((p) => p.id === activeEntry.projectId);
  const currentClient = clients.find((c) => c.id === activeEntry.clientId);

  const handleSelectProject = async (project: (typeof projects)[0]) => {
    await updateActiveEntry({ projectId: project.id, clientId: project.clientId });
    setProjectPopoverOpen(false);
  };

  const handleSelectClient = async (client: (typeof clients)[0]) => {
    await updateActiveEntry({ clientId: client.id });
    setClientPopoverOpen(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 mt-2">
      {/* Project chip */}
      {currentProject ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-foreground/10 pl-2 pr-1 py-0.5 text-[11px] font-medium text-foreground-secondary">
          <FolderOpen className="h-3 w-3 text-foreground-muted" />
          {currentProject.name}
          <button
            onClick={() => updateActiveEntry({ projectId: null })}
            className="ml-0.5 h-4 w-4 rounded-full flex items-center justify-center hover:bg-foreground/10 transition-colors"
          >
            <X className="h-2.5 w-2.5" />
          </button>
        </span>
      ) : projects.length > 0 ? (
        <Popover open={projectPopoverOpen} onOpenChange={setProjectPopoverOpen}>
          <PopoverTrigger asChild>
            <button className="inline-flex items-center gap-1 rounded-full border border-dashed border-foreground/20 px-2 py-0.5 text-[10px] font-medium text-foreground-muted hover:text-foreground-secondary hover:border-foreground/30 transition-colors">
              <Plus className="h-2.5 w-2.5" />
              Proyecto
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-52 p-1.5" align="start" side="bottom">
            <div className="max-h-48 overflow-y-auto space-y-0.5">
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
      ) : null}

      {/* Client chip */}
      {currentClient ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-foreground/10 pl-2 pr-1 py-0.5 text-[11px] font-medium text-foreground-secondary">
          <span
            className="h-2 w-2 rounded-full shrink-0"
            style={{ backgroundColor: getClientColor(currentClient.name) }}
          />
          {currentClient.name}
          <button
            onClick={() => updateActiveEntry({ clientId: null })}
            className="ml-0.5 h-4 w-4 rounded-full flex items-center justify-center hover:bg-foreground/10 transition-colors"
          >
            <X className="h-2.5 w-2.5" />
          </button>
        </span>
      ) : clients.length > 0 ? (
        <Popover open={clientPopoverOpen} onOpenChange={setClientPopoverOpen}>
          <PopoverTrigger asChild>
            <button className="inline-flex items-center gap-1 rounded-full border border-dashed border-foreground/20 px-2 py-0.5 text-[10px] font-medium text-foreground-muted hover:text-foreground-secondary hover:border-foreground/30 transition-colors">
              <Plus className="h-2.5 w-2.5" />
              Cliente
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-1.5" align="start" side="bottom">
            <div className="max-h-48 overflow-y-auto space-y-0.5">
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
      ) : null}
    </div>
  );
}
