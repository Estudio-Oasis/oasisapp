import { useState, useEffect, useCallback, useRef, ReactNode } from "react";
import { toast } from "sonner";
import { BitacoraCtx, ViewModelCtx } from "./BitacoraContext";
import { formatDuration, isSameDay, startOfDay, startOfWeek } from "@/lib/timer-utils";
import type {
  BitacoraProviderValue,
  BitacoraViewModel,
  BitacoraConfig,
  EntryInfo,
  GapInfo,
  ActiveEntryInfo,
  RecentEntry,
  StartActivityInput,
  FillGapInput,
  UpdateEntryInput,
  WorkSchedule,
} from "./types";

const LS_ENTRIES = "bitacora_local_entries";
const LS_ACTIVE = "bitacora_local_active";
const LS_RECENTS = "bitacora_local_recents";

const STANDALONE_CONFIG: BitacoraConfig = {
  mode: "standalone",
  features: {
    showTeam: false,
    showCTAs: true,
    showOnboarding: true,
    allowManualEntry: false,
    allowFilterAll: false,
  },
};

const DEFAULT_SCHEDULE: WorkSchedule = {
  startHour: 9,
  startMinute: 0,
  endHour: 18,
  endMinute: 0,
};

const LOCAL_USER_ID = "local-demo-user";

/* ── helpers ── */
function loadLS<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function saveLS(key: string, val: unknown) {
  localStorage.setItem(key, JSON.stringify(val));
}

function makeId() {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/* ── Provider ── */

export function LocalBitacoraProvider({
  children,
  initialEntries,
}: {
  children: ReactNode;
  initialEntries?: EntryInfo[];
}) {
  const [entries, setEntries] = useState<EntryInfo[]>(() => {
    if (initialEntries && initialEntries.length > 0) {
      // Only seed if localStorage is empty (first load of explore mode)
      const existing = loadLS<EntryInfo[]>(LS_ENTRIES, []);
      if (existing.length === 0) {
        saveLS(LS_ENTRIES, initialEntries);
        return initialEntries;
      }
      return existing;
    }
    return loadLS(LS_ENTRIES, []);
  });
  const [active, setActive] = useState<ActiveEntryInfo | null>(() => loadLS(LS_ACTIVE, null));
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [recents, setRecents] = useState<RecentEntry[]>(() => loadLS(LS_RECENTS, []));
  const [view, setView] = useState<"today" | "week">("today");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Persist
  useEffect(() => saveLS(LS_ENTRIES, entries), [entries]);
  useEffect(() => saveLS(LS_ACTIVE, active), [active]);
  useEffect(() => saveLS(LS_RECENTS, recents), [recents]);

  // Elapsed timer
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (!active) {
      setElapsedSeconds(0);
      return;
    }
    const calc = () => Math.floor((Date.now() - new Date(active.startedAt).getTime()) / 1000);
    setElapsedSeconds(calc());
    intervalRef.current = setInterval(() => setElapsedSeconds(calc()), 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [active?.startedAt]);

  // Add to recents
  const pushRecent = useCallback((entry: ActiveEntryInfo) => {
    setRecents((prev) => {
      const key = `${entry.description || ""}::${entry.clientId || ""}`;
      const filtered = prev.filter(
        (r) => `${r.description || ""}::${r.clientId || ""}` !== key
      );
      return [
        {
          id: entry.id,
          description: entry.description,
          clientId: entry.clientId,
          clientName: entry.clientName,
          taskId: entry.taskId,
          taskTitle: entry.taskTitle,
          projectId: entry.projectId,
        },
        ...filtered,
      ].slice(0, 6);
    });
  }, []);

  const stopCurrent = useCallback(() => {
    if (!active) return;
    const endedAt = new Date().toISOString();
    const elapsedSec = (new Date(endedAt).getTime() - new Date(active.startedAt).getTime()) / 1000;

    // Discard entries shorter than 30 seconds
    if (elapsedSec < 30) {
      setActive(null);
      toast("Registro muy corto. No se guardó.", { duration: 3000 });
      return;
    }

    const durMin = elapsedSec < 60 ? 1 : Math.round(elapsedSec / 60);

    const newEntry: EntryInfo = {
      id: active.id,
      description: active.description,
      client_id: active.clientId,
      task_id: active.taskId,
      project_id: active.projectId,
      user_id: LOCAL_USER_ID,
      started_at: active.startedAt,
      ended_at: endedAt,
      duration_min: durMin,
      clients: active.clientName ? { name: active.clientName } : null,
      tasks: active.taskTitle ? { title: active.taskTitle } : null,
    };
    setEntries((prev) => [newEntry, ...prev]);
    pushRecent(active);
    setActive(null);
  }, [active, pushRecent]);

  const startActivity = useCallback(
    async (input: StartActivityInput) => {
      if (active) stopCurrent();
      const entry: ActiveEntryInfo = {
        id: makeId(),
        description: input.description || null,
        clientId: input.clientId || null,
        clientName: null,
        taskId: input.taskId || null,
        taskTitle: null,
        projectId: input.projectId || null,
        startedAt: new Date().toISOString(),
      };
      setActive(entry);
    },
    [active, stopCurrent]
  );

  const switchActivity = useCallback(
    async (input: StartActivityInput) => {
      stopCurrent();
      await startActivity(input);
    },
    [stopCurrent, startActivity]
  );

  const stopActivity = useCallback(async () => {
    stopCurrent();
  }, [stopCurrent]);

  const startQuickAction = useCallback(
    async (actionKey: string) => {
      const descMap: Record<string, string> = {
        reunion: "Reunión",
        break: "Break",
        comida: "Comiendo",
        pendientes: "Pendientes del día",
      };
      await startActivity({ description: descMap[actionKey] || actionKey });
    },
    [startActivity]
  );

  const updateActiveEntry = useCallback(async (updates: Partial<StartActivityInput>) => {
    setActive((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        ...(updates.description !== undefined && { description: updates.description || null }),
        ...(updates.projectId !== undefined && { projectId: updates.projectId || null }),
        ...(updates.clientId !== undefined && { clientId: updates.clientId || null }),
        ...(updates.taskId !== undefined && { taskId: updates.taskId || null }),
      };
    });
  }, []);

  // Fill a gap with a completed entry
  const fillGap = useCallback(async (input: FillGapInput) => {
    const durMin = Math.round(
      (new Date(input.endedAt).getTime() - new Date(input.startedAt).getTime()) / 60000
    );
    const newEntry: EntryInfo = {
      id: makeId(),
      description: input.description,
      client_id: null,
      task_id: null,
      project_id: null,
      user_id: LOCAL_USER_ID,
      started_at: input.startedAt,
      ended_at: input.endedAt,
      duration_min: durMin,
      clients: null,
      tasks: null,
    };
    setEntries((prev) => [newEntry, ...prev]);
  }, []);

  // Update an existing completed entry
  const updateEntry = useCallback(async (id: string, updates: UpdateEntryInput) => {
    setEntries((prev) =>
      prev.map((e) => {
        if (e.id !== id) return e;
        const newStarted = updates.started_at || e.started_at;
        const newEnded = updates.ended_at || e.ended_at;
        const durMin = newEnded
          ? Math.round((new Date(newEnded).getTime() - new Date(newStarted).getTime()) / 60000)
          : e.duration_min;
        return {
          ...e,
          ...(updates.description !== undefined && { description: updates.description }),
          ...(updates.started_at !== undefined && { started_at: updates.started_at }),
          ...(updates.ended_at !== undefined && { ended_at: updates.ended_at }),
          duration_min: durMin,
        };
      })
    );
  }, []);

  // Delete an entry
  const deleteEntry = useCallback(async (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  // Compute gaps
  const now = new Date();
  const todayEntries = entries.filter(
    (e) => e.ended_at && isSameDay(new Date(e.started_at), now)
  );

  const gaps: GapInfo[] = [];
  const sorted = [...todayEntries].sort(
    (a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime()
  );
  const ws = DEFAULT_SCHEDULE;
  const wStart = new Date(now);
  wStart.setHours(ws.startHour, ws.startMinute, 0, 0);
  const wEnd = new Date(now);
  wEnd.setHours(ws.endHour, ws.endMinute, 0, 0);
  const cap = Math.min(Date.now(), wEnd.getTime());

  if (now.getTime() >= wStart.getTime() && cap > wStart.getTime()) {
    if (sorted.length === 0) {
      const gapMin = Math.round((cap - wStart.getTime()) / 60000);
      if (gapMin > 30) gaps.push({ startTime: wStart, endTime: new Date(cap), durationMin: gapMin });
    } else {
      const first = new Date(sorted[0].started_at);
      const gapMin = Math.round((first.getTime() - wStart.getTime()) / 60000);
      if (gapMin > 30) gaps.push({ startTime: wStart, endTime: first, durationMin: gapMin });
    }
  }
  for (let i = 0; i < sorted.length - 1; i++) {
    const cEnd = new Date(sorted[i].ended_at!);
    const nStart = new Date(sorted[i + 1].started_at);
    const gapMin = Math.round((nStart.getTime() - cEnd.getTime()) / 60000);
    if (gapMin > 30) gaps.push({ startTime: cEnd, endTime: nStart, durationMin: gapMin });
  }

  // Filter by view
  const rangeStart = view === "today" ? startOfDay(now) : startOfWeek(now);
  const filteredEntries = entries.filter(
    (e) => e.ended_at && new Date(e.started_at) >= rangeStart
  );

  const totalMinutes = filteredEntries.reduce((s, e) => s + (Number(e.duration_min) || 0), 0);

  const groupedByDay = filteredEntries.reduce<Record<string, EntryInfo[]>>((acc, entry) => {
    const dayKey = startOfDay(new Date(entry.started_at)).toISOString();
    if (!acc[dayKey]) acc[dayKey] = [];
    acc[dayKey].push(entry);
    return acc;
  }, {});

  const sortedDays = Object.keys(groupedByDay).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  const timelineEntries =
    view === "today"
      ? filteredEntries
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

  const hasData = filteredEntries.length > 0 || gaps.length > 0;

  const providerValue: BitacoraProviderValue = {
    isRunning: !!active,
    isStopping: false,
    activeEntry: active,
    elapsedSeconds,
    startActivity,
    switchActivity,
    stopActivity,
    startQuickAction,
    updateActiveEntry,
    fillGap,
    updateEntry,
    deleteEntry,
    projects: [],
    clients: [],
    recents,
    config: STANDALONE_CONFIG,
  };

  const viewModel: BitacoraViewModel = {
    entries: filteredEntries,
    gaps,
    totalMinutes,
    groupedByDay,
    sortedDays,
    profileMap: {},
    workSchedule: DEFAULT_SCHEDULE,
    view,
    setView,
    entryFilter: "mine",
    setEntryFilter: () => {},
    isAdmin: false,
    refresh: () => {},
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
