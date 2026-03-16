import type { ActivityType } from "@/components/timer/ActivityConstants";

/* ── Shared data shapes (no Supabase dependency) ── */

export interface ActiveEntryInfo {
  id: string;
  description: string | null;
  clientId: string | null;
  clientName: string | null;
  taskId: string | null;
  taskTitle: string | null;
  projectId: string | null;
  startedAt: string;
}

export interface EntryInfo {
  id: string;
  description: string | null;
  client_id: string | null;
  task_id: string | null;
  project_id: string | null;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  duration_min: number | null;
  clients: { name: string } | null;
  tasks: { title: string } | null;
}

export interface GapInfo {
  startTime: Date;
  endTime: Date;
  durationMin: number;
}

export interface ProjectOption {
  id: string;
  name: string;
  clientId: string;
}

export interface ClientOption {
  id: string;
  name: string;
}

export interface RecentEntry {
  id: string;
  description: string | null;
  clientId: string | null;
  clientName: string | null;
  taskId: string | null;
  taskTitle: string | null;
  projectId: string | null;
}

export interface WorkSchedule {
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
}

export interface StartActivityInput {
  description?: string | null;
  projectId?: string | null;
  taskId?: string | null;
  clientId?: string | null;
  activityType?: ActivityType;
}

/* ── Config for BitacoraCore ── */

export interface BitacoraConfig {
  mode: "oasis" | "standalone";
  features: {
    showTeam?: boolean;
    showCTAs?: boolean;
    showOnboarding?: boolean;
    allowManualEntry?: boolean;
    allowFilterAll?: boolean;
  };
}

/* ── Full provider contract ── */

export interface BitacoraProviderValue {
  // Session
  isRunning: boolean;
  isStopping: boolean;
  activeEntry: ActiveEntryInfo | null;
  elapsedSeconds: number;

  // Actions
  startActivity(input: StartActivityInput): Promise<void>;
  switchActivity(input: StartActivityInput): Promise<void>;
  stopActivity(): Promise<void>;
  startQuickAction(actionKey: string): Promise<void>;
  updateActiveEntry(updates: Partial<StartActivityInput>): Promise<void>;

  // Catalog
  projects: ProjectOption[];
  clients: ClientOption[];
  recents: RecentEntry[];

  // Config
  config: BitacoraConfig;
}

/* ── View model (computed from entries) ── */

export interface BitacoraViewModel {
  entries: EntryInfo[];
  gaps: GapInfo[];
  totalMinutes: number;
  groupedByDay: Record<string, EntryInfo[]>;
  sortedDays: string[];
  profileMap: Record<string, { id: string; name: string | null }>;
  workSchedule: WorkSchedule;

  view: "today" | "week";
  setView(v: "today" | "week"): void;
  entryFilter: "mine" | "all";
  setEntryFilter(f: "mine" | "all"): void;
  isAdmin: boolean;

  refresh(): void;

  // Timeline-ready entries (today only, ended)
  timelineEntries: {
    startedAt: string;
    endedAt: string;
    clientName?: string | null;
    clientId?: string | null;
    description?: string | null;
    durationMin?: number | null;
  }[];

  todaySummaryText: string;
  hasData: boolean;
}
