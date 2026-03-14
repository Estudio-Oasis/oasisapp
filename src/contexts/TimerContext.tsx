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

type TimeEntry = Tables<"time_entries">;
type Client = Tables<"clients">;
type Task = Tables<"tasks">;

interface TimerState {
  isRunning: boolean;
  isStopping: boolean;
  activeEntry: TimeEntry | null;
  elapsedSeconds: number;
  activeClient: Client | null;
  activeTask: Task | null;
}

interface TimerContextType extends TimerState {
  startTimer: (
    clientId: string,
    taskId?: string | null,
    projectId?: string | null,
    description?: string | null
  ) => Promise<void>;
  stopTimer: () => Promise<boolean>;
  switchTask: (
    clientId: string,
    taskId?: string | null,
    projectId?: string | null,
    description?: string | null
  ) => Promise<void>;
  startBreakTimer: (breakType?: string) => Promise<void>;
  setManualStatus: (status: string) => Promise<void>;
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

  // Calculate elapsed from started_at
  const calcElapsed = useCallback((startedAt: string) => {
    return Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
  }, []);

  // Start interval
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
    // Check if there's an open entry with "Offline" description
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

      // Clear local timer state if it matches
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

  // === ALWAYS-ON PRESENCE: heartbeat every 30s while user is logged in ===
  useEffect(() => {
    if (!userId) return;

    // Initial presence upsert — mark as online immediately
    // Only set "online" if there's no active timer (timer sets "working")
    const initPresence = async () => {
      const { data } = await supabase
        .from("member_presence")
        .select("status")
        .eq("user_id", userId)
        .maybeSingle();

      // If no row exists or status is offline, set to online and stop offline timer
      if (!data || data.status === "offline") {
        await stopOfflineTimerIfRunning();
        await upsertPresence(userId, "online");
      } else {
        // Just update last_seen_at to keep alive
        await supabase.from("member_presence").upsert({
          user_id: userId,
          status: data.status,
          last_seen_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });
      }
    };

    initPresence();

    // Heartbeat every 30s
    const heartbeat = setInterval(async () => {
      const { data } = await supabase
        .from("member_presence")
        .select("status, current_client, current_task")
        .eq("user_id", userId)
        .maybeSingle();

      if (data) {
        await supabase.from("member_presence").upsert({
          user_id: userId,
          status: data.status === "offline" ? "online" : data.status,
          current_client: data.current_client,
          current_task: data.current_task,
          last_seen_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });
      }
    }, 30000);

    // On page unload, try to set offline
    const handleBeforeUnload = () => {
      // Use sendBeacon for reliability
      const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/member_presence?user_id=eq.${userId}`;
      const body = JSON.stringify({
        status: "offline",
        current_client: null,
        current_task: null,
        last_seen_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      navigator.sendBeacon?.(url); // Best effort
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

      // Update presence to working
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

  const startTimer = useCallback(
    async (
      clientId: string,
      taskId?: string | null,
      projectId?: string | null,
      description?: string | null
    ) => {
      if (!userId) return;

      const startedAt = new Date().toISOString();
      const { data: entry, error } = await supabase
        .from("time_entries")
        .insert({
          user_id: userId,
          client_id: clientId,
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

      console.log("[timer] started entry", entry.id);

      let client: Client | null = null;
      let task: Task | null = null;

      const { data: clientData } = await supabase
        .from("clients")
        .select("*")
        .eq("id", clientId)
        .maybeSingle();
      client = clientData;

      if (taskId) {
        const { data: taskData } = await supabase
          .from("tasks")
          .select("*")
          .eq("id", taskId)
          .maybeSingle();
        task = taskData;
      }

      persistActiveEntry(entry);

      // Upsert presence as working
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

  const stopTimer = useCallback(async () => {
    if (!state.activeEntry || state.isStopping) {
      return false;
    }

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

    // Update presence to online (not working anymore but still here)
    if (userId) {
      await upsertPresence(userId, "online");
    }

    resetTimerState();
    return true;
  }, [resetTimerState, state.activeEntry, state.isStopping, userId]);

  const switchTask = useCallback(
    async (
      clientId: string,
      taskId?: string | null,
      projectId?: string | null,
      description?: string | null
    ) => {
      const stopped = await stopTimer();
      if (!stopped) return;
      await startTimer(clientId, taskId, projectId, description);
    },
    [stopTimer, startTimer]
  );

  // Start a break timer (no client, no task)
  const startBreakTimer = useCallback(async (breakType?: string) => {
    if (!userId) return;

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

  // Manual status change (for break, eating, etc.)
  const setManualStatus = useCallback(async (status: string) => {
    if (!userId) return;
    await upsertPresence(userId, status);

    // Non-blocking Slack notification for status change
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
      }}
    >
      {children}
    </TimerContext.Provider>
  );
}
