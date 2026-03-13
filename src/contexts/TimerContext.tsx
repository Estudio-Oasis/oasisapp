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
import type { Tables } from "@/integrations/supabase/types";

type TimeEntry = Tables<"time_entries">;
type Client = Tables<"clients">;
type Task = Tables<"tasks">;

interface TimerState {
  isRunning: boolean;
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
  stopTimer: () => Promise<void>;
  switchTask: (
    clientId: string,
    taskId?: string | null,
    projectId?: string | null,
    description?: string | null
  ) => Promise<void>;
}

const TimerContext = createContext<TimerContextType>({
  isRunning: false,
  activeEntry: null,
  elapsedSeconds: 0,
  activeClient: null,
  activeTask: null,
  startTimer: async () => {},
  stopTimer: async () => {},
  switchTask: async () => {},
});

export const useTimer = () => useContext(TimerContext);

export function TimerProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [state, setState] = useState<TimerState>({
    isRunning: false,
    activeEntry: null,
    elapsedSeconds: 0,
    activeClient: null,
    activeTask: null,
  });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
    if (!user) {
      setState({
        isRunning: false,
        activeEntry: null,
        elapsedSeconds: 0,
        activeClient: null,
        activeTask: null,
      });
      return;
    }

    const restore = async () => {
      const { data: entry } = await supabase
        .from("time_entries")
        .select("*")
        .eq("user_id", user.id)
        .is("ended_at", null)
        .limit(1)
        .maybeSingle();

      if (!entry) return;

      let client: Client | null = null;
      let task: Task | null = null;

      if (entry.client_id) {
        const { data } = await supabase
          .from("clients")
          .select("*")
          .eq("id", entry.client_id)
          .single();
        client = data;
      }

      if (entry.task_id) {
        const { data } = await supabase
          .from("tasks")
          .select("*")
          .eq("id", entry.task_id)
          .single();
        task = data;
      }

      setState({
        isRunning: true,
        activeEntry: entry,
        elapsedSeconds: calcElapsed(entry.started_at),
        activeClient: client,
        activeTask: task,
      });

      startInterval(entry.started_at);
    };

    restore();

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [user, calcElapsed, startInterval]);

  const startTimer = useCallback(
    async (
      clientId: string,
      taskId?: string | null,
      projectId?: string | null,
      description?: string | null
    ) => {
      if (!user) return;

      const { data: entry, error } = await supabase
        .from("time_entries")
        .insert({
          user_id: user.id,
          client_id: clientId,
          task_id: taskId || null,
          project_id: projectId || null,
          description: description || null,
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error || !entry) {
        console.error("Failed to start timer:", error);
        return;
      }

      let client: Client | null = null;
      let task: Task | null = null;

      const { data: clientData } = await supabase
        .from("clients")
        .select("*")
        .eq("id", clientId)
        .single();
      client = clientData;

      if (taskId) {
        const { data: taskData } = await supabase
          .from("tasks")
          .select("*")
          .eq("id", taskId)
          .single();
        task = taskData;
      }

      setState({
        isRunning: true,
        activeEntry: entry,
        elapsedSeconds: 0,
        activeClient: client,
        activeTask: task,
      });

      startInterval(entry.started_at);
    },
    [user, startInterval]
  );

  const stopTimer = useCallback(async () => {
    if (!state.activeEntry) {
      console.warn("stopTimer called but no active entry");
      return;
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const entryId = state.activeEntry.id;
    const endedAt = new Date().toISOString();
    const startedAt = new Date(state.activeEntry.started_at);
    const endedAtDate = new Date(endedAt);
    const durationMin = Math.max(1, Math.round(
      (endedAtDate.getTime() - startedAt.getTime()) / 60000
    ));

    // Reset state first so UI updates immediately
    setState({
      isRunning: false,
      activeEntry: null,
      elapsedSeconds: 0,
      activeClient: null,
      activeTask: null,
    });

    // Then persist to DB
    const { error } = await supabase
      .from("time_entries")
      .update({ ended_at: endedAt, duration_min: durationMin })
      .eq("id", entryId);

    if (error) {
      console.error("Failed to save time entry:", error);
    }
  }, [state.activeEntry]);

  const switchTask = useCallback(
    async (
      clientId: string,
      taskId?: string | null,
      projectId?: string | null,
      description?: string | null
    ) => {
      await stopTimer();
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
