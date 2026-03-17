import { useState, useEffect, useCallback, useRef, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTimer } from "@/contexts/TimerContext";
import { useRole } from "@/hooks/useRole";
import { useTimeEntries } from "@/hooks/useTimeEntries";
import { BitacoraCtx, ViewModelCtx } from "./BitacoraContext";
import { formatDuration } from "@/lib/timer-utils";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics";
import type {
  BitacoraProviderValue,
  BitacoraViewModel,
  BitacoraConfig,
  ProjectOption,
  ClientOption,
  RecentEntry,
  ActiveEntryInfo,
  StartActivityInput,
  FillGapInput,
  UpdateEntryInput,
} from "./types";

const OASIS_CONFIG: BitacoraConfig = {
  mode: "oasis",
  features: {
    showTeam: true,
    showCTAs: false,
    showOnboarding: false,
    allowManualEntry: true,
    allowFilterAll: true,
  },
};

export function OasisBitacoraProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { isAdmin } = useRole();
  const timer = useTimer();
  const firstEntryTracked = useRef(false);

  const [view, setView] = useState<"today" | "week">("today");
  const [entryFilter, setEntryFilter] = useState<"mine" | "all">(isAdmin ? "all" : "mine");

  const {
    entries,
    profileMap,
    gaps,
    totalMinutes,
    groupedByDay,
    sortedDays,
    fetchEntries,
    workSchedule,
  } = useTimeEntries({ view, entryFilter, refreshTrigger: timer.isRunning });

  // Track first entry for new accounts
  useEffect(() => {
    if (!firstEntryTracked.current && entries.length === 1 && entries[0].ended_at) {
      firstEntryTracked.current = true;
      trackEvent("first_entry_account");
    }
  }, [entries]);

  // Catalog
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [recents, setRecents] = useState<RecentEntry[]>([]);

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

  // Load recents
  const loadRecents = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("time_entries")
      .select("id, description, client_id, task_id, project_id, clients(name), tasks(title)")
      .eq("user_id", user.id)
      .not("ended_at", "is", null)
      .order("started_at", { ascending: false })
      .limit(30);

    if (!data) return;
    const seen = new Set<string>();
    const unique: RecentEntry[] = [];
    for (const e of data) {
      const key = `${e.description || ""}::${e.client_id || ""}::${e.task_id || ""}`;
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push({
        id: e.id,
        description: e.description,
        clientId: e.client_id,
        clientName: (e.clients as any)?.name || null,
        taskId: e.task_id,
        taskTitle: (e.tasks as any)?.title || null,
        projectId: e.project_id,
      });
      if (unique.length >= 6) break;
    }
    setRecents(unique);
  }, [user]);

  useEffect(() => {
    loadRecents();
  }, [loadRecents]);

  // Map active entry
  const activeEntry: ActiveEntryInfo | null = timer.activeEntry
    ? {
        id: timer.activeEntry.id,
        description: timer.activeEntry.description,
        clientId: timer.activeEntry.client_id,
        clientName: timer.activeClient?.name || null,
        taskId: timer.activeEntry.task_id,
        taskTitle: timer.activeTask?.title || null,
        projectId: timer.activeEntry.project_id,
        startedAt: timer.activeEntry.started_at,
      }
    : null;

  // Actions
  const startActivity = useCallback(
    async (input: StartActivityInput) => {
      await timer.startTimer(input);
    },
    [timer]
  );

  const switchActivity = useCallback(
    async (input: StartActivityInput) => {
      await timer.switchTask(input);
    },
    [timer]
  );

  const stopActivity = useCallback(async () => {
    await timer.stopTimer();
  }, [timer]);

  const startQuickAction = useCallback(
    async (actionKey: string) => {
      const breakMap: Record<string, string> = { break: "break", comida: "eating" };
      if (breakMap[actionKey]) {
        await timer.startBreakTimer(breakMap[actionKey]);
      } else {
        const descMap: Record<string, string> = {
          reunion: "Reunión",
          pendientes: "Pendientes del día",
        };
        await timer.startTimer({ description: descMap[actionKey] || actionKey });
      }
    },
    [timer]
  );

  const updateActiveEntry = useCallback(
    async (updates: Partial<StartActivityInput>) => {
      await timer.updateActiveEntry(updates);
    },
    [timer]
  );

  // Fill a gap with a completed entry
  const fillGap = useCallback(
    async (input: FillGapInput) => {
      if (!user) return;
      const { error } = await supabase.from("time_entries").insert({
        user_id: user.id,
        description: input.description,
        started_at: input.startedAt,
        ended_at: input.endedAt,
      });
      if (error) {
        toast.error("No se pudo guardar el registro");
        return;
      }
      toast.success("Hueco completado");
      fetchEntries();
    },
    [user, fetchEntries]
  );

  // Update an existing entry
  const updateEntry = useCallback(
    async (id: string, updates: UpdateEntryInput) => {
      // Strict validation: end must be after start
      if (updates.started_at && updates.ended_at) {
        if (new Date(updates.ended_at) <= new Date(updates.started_at)) {
          toast.error("La hora de fin debe ser posterior al inicio");
          return;
        }
      }
      const { error } = await supabase
        .from("time_entries")
        .update(updates)
        .eq("id", id);
      if (error) {
        toast.error("No se pudo actualizar la entrada");
        return;
      }
      toast.success("Entrada actualizada");
      fetchEntries();
    },
    [fetchEntries]
  );

  // Delete an entry
  const deleteEntry = useCallback(
    async (id: string) => {
      const { error } = await supabase
        .from("time_entries")
        .delete()
        .eq("id", id);
      if (error) {
        toast.error("No se pudo eliminar la entrada");
        return;
      }
      toast.success("Entrada eliminada");
      fetchEntries();
    },
    [fetchEntries]
  );

  const providerValue: BitacoraProviderValue = {
    isRunning: timer.isRunning,
    isStopping: timer.isStopping,
    activeEntry,
    elapsedSeconds: timer.elapsedSeconds,
    startActivity,
    switchActivity,
    stopActivity,
    startQuickAction,
    updateActiveEntry,
    fillGap,
    updateEntry,
    deleteEntry,
    projects,
    clients,
    recents,
    config: OASIS_CONFIG,
  };

  // View model
  const timelineEntries =
    view === "today"
      ? entries
          .filter((e) => e.ended_at)
          .map((e) => ({
            startedAt: e.started_at,
            endedAt: e.ended_at!,
            clientName: e.clients?.name,
            clientId: e.client_id,
            description: e.description,
            durationMin: e.duration_min,
          }))
      : [];

  const todaySummaryText =
    totalMinutes > 0
      ? `${formatDuration(totalMinutes)} registradas`
      : "Tu día empieza aquí";

  const hasData = entries.length > 0 || gaps.length > 0;

  const viewModel: BitacoraViewModel = {
    entries,
    gaps,
    totalMinutes,
    groupedByDay,
    sortedDays,
    profileMap,
    workSchedule,
    view,
    setView,
    entryFilter,
    setEntryFilter,
    isAdmin,
    refresh: fetchEntries,
    timelineEntries,
    todaySummaryText,
    hasData,
  };

  return (
    <BitacoraCtx.Provider value={providerValue}>
      <ViewModelCtx.Provider value={viewModel}>{children}</ViewModelCtx.Provider>
    </BitacoraCtx.Provider>
  );
}
