export type DemoMode = "track_day" | "plan_tasks" | "explore";

export interface DemoTodo {
  id: string;
  text: string;
  done: boolean;
  inProgress: boolean;
  registeredMin?: number | null;
}

export const LS_DEMO_MODE = "bitacora_demo_mode";
export const LS_DEMO_TODOS = "bitacora_demo_todos";
