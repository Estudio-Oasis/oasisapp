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
});

export const useTimer = () => useContext(TimerContext);

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
      const clientName = client?.name || null;
      const taskName = task?.title || null;
      await supabase.from("member_presence").upsert({
        user_id: userId,
        status: "working",
        current_client: clientName,
        current_task: taskName,
        last_seen_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

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

    // Update presence to break
    if (userId) {
      await supabase.from("member_presence").upsert({
        user_id: userId,
        status: "break",
        current_client: null,
        current_task: null,
        last_seen_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
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

  return (
    <TimerContext.Provider
      value={{
        ...state,
        startTimer,
        stopTimer,
        switchTask,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
}
