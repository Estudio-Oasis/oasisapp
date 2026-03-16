import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
  ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";
import type { ActivityType } from "@/components/timer/ActivityConstants";

type TimeEntry = Tables<"time_entries">;
type Client = Tables<"clients">;
type Task = Tables<"tasks">;

/* ── Input types ───────────────────────────────────────────── */

export interface StartActivityInput {
  description?: string | null;
  projectId?: string | null;
  taskId?: string | null;
  clientId?: string | null;
  activityType?: ActivityType;
}

/* ── State ─────────────────────────────────────────────────── */

interface TimerState {
  isRunning: boolean;
  isStopping: boolean;
  activeEntry: TimeEntry | null;
  elapsedSeconds: number;
  activeClient: Client | null;
  activeTask: Task | null;
}

interface TimerContextType extends TimerState {
  startTimer: (input: StartActivityInput) => Promise<void>;
  stopTimer: () => Promise<boolean>;
  switchTask: (input: StartActivityInput) => Promise<void>;
  startBreakTimer: (breakType?: string) => Promise<void>;
  setManualStatus: (status: string) => Promise<void>;
  /** Update context on the active entry without stopping */
  updateActiveEntry: (updates: Partial<StartActivityInput>) => Promise<void>;
}

const ACTIVE_TIMER_STORAGE_KEY = "oasis_active_entry";

interface PersistedActiveEntry {
  entryId: string;
  clientId: string | null;
  taskId: string | null;
  projectId: string | null;
  startedAt: string;
}

const getPersistedActiveEntry = (): PersistedActiveEntry | null => {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(ACTIVE_TIMER_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PersistedActiveEntry;
  } catch {
    localStorage.removeItem(ACTIVE_TIMER_STORAGE_KEY);
    return null;
  }
};

const clearPersistedActiveEntry = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACTIVE_TIMER_STORAGE_KEY);
};

const persistActiveEntry = (entry: TimeEntry) => {
  if (typeof window === "undefined") return;
  const payload: PersistedActiveEntry = {
    entryId: entry.id,
    clientId: entry.client_id,
    taskId: entry.task_id,
    projectId: entry.project_id,
    startedAt: entry.started_at,
  };
  localStorage.setItem(ACTIVE_TIMER_STORAGE_KEY, JSON.stringify(payload));
};

const initialTimerState: TimerState = {
  isRunning: false,
  isStopping: false,
  activeEntry: null,
  elapsedSeconds: 0,
  activeClient: null,
  activeTask: null,
};

const TimerContext = createContext<TimerContextType>({
  ...initialTimerState,
  startTimer: async () => {},
  stopTimer: async () => false,
  switchTask: async () => {},
  startBreakTimer: async () => {},
  setManualStatus: async () => {},
  updateActiveEntry: async () => {},
});

export const useTimer = () => useContext(TimerContext);

// Helper to upsert presence
async function upsertPresence(userId: string, status: string, clientName?: string | null, taskName?: string | null) {
  await supabase.from("member_presence").upsert({
    user_id: userId,
    status,
    current_client: clientName || null,
    current_task: taskName || null,
    last_seen_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });
}

export function TimerProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [state, setState] = useState<TimerState>(initialTimerState);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const userId = user?.id ?? null;

  const resetTimerState = useCallback(() => {
    setState(initialTimerState);
  }, []);

  const calcElapsed = useCallback((startedAt: string) => {
    return Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
  }, []);

  const startInterval = useCallback(
    (startedAt: string) => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        setState((prev) => ({
          ...prev,
          elapsedSeconds: calcElapsed(startedAt),
        }));
      }, 1000);
    },
    [calcElapsed]
  );

  // Helper to stop an offline/break timer if one is running
  const stopOfflineTimerIfRunning = useCallback(async () => {
    if (!userId) return;
    const { data: offlineEntry } = await supabase
      .from("time_entries")
      .select("id")
      .eq("user_id", userId)
      .is("ended_at", null)
      .eq("description", "Offline")
      .maybeSingle();

    if (offlineEntry) {
      const endedAt = new Date().toISOString();
      await supabase
        .from("time_entries")
        .update({ ended_at: endedAt })
        .eq("id", offlineEntry.id)
        .is("ended_at", null);

      if (state.activeEntry?.id === offlineEntry.id) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        clearPersistedActiveEntry();
        resetTimerState();
      }
    }
  }, [userId, state.activeEntry?.id, resetTimerState]);

  // === ALWAYS-ON PRESENCE: heartbeat every 30s ===
  useEffect(() => {
    if (!userId) return;

    const initPresence = async () => {
      const { data } = await supabase
        .from("member_presence")
        .select("status")
        .eq("user_id", userId)
        .maybeSingle();

      if (!data || data.status === "offline") {
        await stopOfflineTimerIfRunning();
        await upsertPresence(userId, "online");
      } else {
        await supabase.from("member_presence").upsert({
          user_id: userId,
          status: data.status,
          last_seen_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });
      }
    };

    initPresence();

    const heartbeat = setInterval(async () => {
      const { data } = await supabase
        .from("member_presence")
        .select("status, current_client, current_task")
        .eq("user_id", userId)
        .maybeSingle();

      if (data) {
        const wasOffline = data.status === "offline";
        if (wasOffline) {
          await stopOfflineTimerIfRunning();
        }
        await supabase.from("member_presence").upsert({
          user_id: userId,
          status: wasOffline ? "online" : data.status,
          current_client: data.current_client,
          current_task: data.current_task,
          last_seen_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });
      }
    }, 30000);

    const handleBeforeUnload = () => {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/member_presence?user_id=eq.${userId}`;
      navigator.sendBeacon?.(url);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      clearInterval(heartbeat);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [userId]);

  // Restore active entry on mount / user change
  useEffect(() => {
    if (!userId) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      clearPersistedActiveEntry();
      resetTimerState();
      return;
    }

    let isCancelled = false;

    const restore = async () => {
      let entry: TimeEntry | null = null;

      const persisted = getPersistedActiveEntry();
      if (persisted?.entryId) {
        const { data: persistedEntry } = await supabase
          .from("time_entries")
          .select("*")
          .eq("id", persisted.entryId)
          .eq("user_id", userId)
          .is("ended_at", null)
          .maybeSingle();

        if (persistedEntry) {
          entry = persistedEntry;
        } else {
          clearPersistedActiveEntry();
        }
      }

      if (!entry) {
        const { data: openEntry } = await supabase
          .from("time_entries")
          .select("*")
          .eq("user_id", userId)
          .is("ended_at", null)
          .limit(1)
          .maybeSingle();

        if (openEntry) {
          entry = openEntry;
          persistActiveEntry(openEntry);
        }
      }

      if (!entry) {
        if (!isCancelled) resetTimerState();
        return;
      }

      if (isCancelled) return;

      let client: Client | null = null;
      let task: Task | null = null;

      if (entry.client_id) {
        const { data } = await supabase
          .from("clients")
          .select("*")
          .eq("id", entry.client_id)
          .maybeSingle();
        client = data;
      }

      if (entry.task_id) {
        const { data } = await supabase
          .from("tasks")
          .select("*")
          .eq("id", entry.task_id)
          .maybeSingle();
        task = data;
      }

      if (isCancelled) return;

      setState({
        isRunning: true,
        isStopping: false,
        activeEntry: entry,
        elapsedSeconds: calcElapsed(entry.started_at),
        activeClient: client,
        activeTask: task,
      });

      startInterval(entry.started_at);
      await upsertPresence(userId, "working", client?.name, task?.title);
    };

    void restore();

    return () => {
      isCancelled = true;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [userId, calcElapsed, resetTimerState, startInterval]);

  /* ── startTimer ──────────────────────────────────────────── */

  const startTimer = useCallback(
    async (input: StartActivityInput) => {
      if (!userId) return;

      // Stop any active session before starting a new one
      if (state.activeEntry && !state.isStopping) {
        const stopped = await stopTimer();
        if (!stopped) return;
      }

      const { description, projectId, taskId, clientId } = input;
      const startedAt = new Date().toISOString();
      const { data: entry, error } = await supabase
        .from("time_entries")
        .insert({
          user_id: userId,
          client_id: clientId || null,
          task_id: taskId || null,
          project_id: projectId || null,
          description: description || null,
          started_at: startedAt,
          ended_at: null,
        })
        .select("*")
        .single();

      if (error || !entry) {
        console.error("Failed to start timer:", error);
        toast.error("No se pudo iniciar el timer. Intenta de nuevo.");
        return;
      }

      let client: Client | null = null;
      let task: Task | null = null;

      if (clientId) {
        const { data: clientData } = await supabase
          .from("clients")
          .select("*")
          .eq("id", clientId)
          .maybeSingle();
        client = clientData;
      }

      if (taskId) {
        const { data: taskData } = await supabase
          .from("tasks")
          .select("*")
          .eq("id", taskId)
          .maybeSingle();
        task = taskData;
      }

      persistActiveEntry(entry);
      await upsertPresence(userId, "working", client?.name, task?.title);

      setState({
        isRunning: true,
        isStopping: false,
        activeEntry: entry,
        elapsedSeconds: 0,
        activeClient: client,
        activeTask: task,
      });

      startInterval(entry.started_at);
    },
    [userId, startInterval]
  );

  /* ── stopTimer ───────────────────────────────────────────── */

  const stopTimer = useCallback(async () => {
    if (!state.activeEntry || state.isStopping) return false;

    const entryId = state.activeEntry.id;
    const endedAt = new Date().toISOString();

    setState((prev) => ({ ...prev, isStopping: true }));

    const { data: updatedEntry, error } = await supabase
      .from("time_entries")
      .update({ ended_at: endedAt })
      .eq("id", entryId)
      .is("ended_at", null)
      .select("id")
      .maybeSingle();

    if (error) {
      console.error("stopTimer failed:", error);
      toast.error("Could not save time entry. Try again.");
      setState((prev) => ({ ...prev, isStopping: false }));
      return false;
    }

    if (!updatedEntry) {
      const { data: existingEntry, error: existingEntryError } = await supabase
        .from("time_entries")
        .select("id, ended_at")
        .eq("id", entryId)
        .maybeSingle();

      if (existingEntryError || !existingEntry?.ended_at) {
        toast.error("Could not save time entry. Try again.");
        setState((prev) => ({ ...prev, isStopping: false }));
        return false;
      }
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    clearPersistedActiveEntry();

    if (userId) {
      await upsertPresence(userId, "online");
    }

    resetTimerState();
    return true;
  }, [resetTimerState, state.activeEntry, state.isStopping, userId]);

  /* ── switchTask ──────────────────────────────────────────── */

  const switchTask = useCallback(
    async (input: StartActivityInput) => {
      const stopped = await stopTimer();
      if (!stopped) return;
      await startTimer(input);
    },
    [stopTimer, startTimer]
  );

  /* ── updateActiveEntry ───────────────────────────────────── */

  const updateActiveEntry = useCallback(async (updates: Partial<StartActivityInput>) => {
    if (!state.activeEntry) return;

    const patch: Record<string, unknown> = {};
    if (updates.description !== undefined) patch.description = updates.description || null;
    if (updates.projectId !== undefined) patch.project_id = updates.projectId || null;
    if (updates.taskId !== undefined) patch.task_id = updates.taskId || null;
    if (updates.clientId !== undefined) patch.client_id = updates.clientId || null;

    if (Object.keys(patch).length === 0) return;

    const { error } = await supabase
      .from("time_entries")
      .update(patch)
      .eq("id", state.activeEntry.id);

    if (error) {
      toast.error("No se pudo actualizar la entrada.");
      return;
    }

    // Update local state
    setState((prev) => ({
      ...prev,
      activeEntry: prev.activeEntry ? { ...prev.activeEntry, ...patch } as TimeEntry : null,
    }));

    toast.success("Contexto actualizado");
  }, [state.activeEntry]);

  /* ── startBreakTimer ─────────────────────────────────────── */

  const startBreakTimer = useCallback(async (breakType?: string) => {
    if (!userId) return;

    // Stop any active session before starting a break
    if (state.activeEntry && !state.isStopping) {
      const stopped = await stopTimer();
      if (!stopped) return;
    }

    const label = breakType === "eating" ? "Comiendo" : breakType === "bathroom" ? "AFK" : breakType === "meeting" ? "Reunión" : breakType === "offline" ? "Offline" : "Break";
    const startedAt = new Date().toISOString();
    const { data: entry, error } = await supabase
      .from("time_entries")
      .insert({
        user_id: userId,
        client_id: null,
        task_id: null,
        project_id: null,
        description: label,
        started_at: startedAt,
        ended_at: null,
      })
      .select("*")
      .single();

    if (error || !entry) {
      console.error("Failed to start break timer:", error);
      toast.error("No se pudo iniciar el timer de break.");
      return;
    }

    const toastMessages: Record<string, string> = {
      break: "☕ Comenzaste un break",
      eating: "🍽️ Comenzaste un break para comer",
      bathroom: "🚿 Te marcaste como AFK",
      meeting: "📹 Entraste a una reunión",
      offline: "🌙 Te marcaste como offline",
    };
    const toastMsg = toastMessages[breakType || "break"] || "☕ Comenzaste un break";
    toast(toastMsg, { duration: 3000 });

    persistActiveEntry(entry);
    await upsertPresence(userId, breakType || "break", null, label);

    setState({
      isRunning: true,
      isStopping: false,
      activeEntry: entry,
      elapsedSeconds: 0,
      activeClient: null,
      activeTask: null,
    });

    startInterval(entry.started_at);
  }, [userId, startInterval]);

  /* ── setManualStatus ─────────────────────────────────────── */

  const setManualStatus = useCallback(async (status: string) => {
    if (!userId) return;
    await upsertPresence(userId, status);

    try {
      const { data: profile } = await supabase.from("profiles").select("name, email").eq("id", userId).maybeSingle();
      const userName = profile?.name || profile?.email?.split("@")[0] || "Un miembro";
      supabase.functions.invoke("slack-notify", {
        body: { event_type: "status_change", data: { user_name: userName, new_status: status } },
      });
    } catch (e) {
      console.warn("Slack status notify failed:", e);
    }
  }, [userId]);

  return (
    <TimerContext.Provider
      value={{
        ...state,
        startTimer,
        stopTimer,
        switchTask,
        startBreakTimer,
        setManualStatus,
        updateActiveEntry,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
}
