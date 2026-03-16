import { supabase } from "@/integrations/supabase/client";

const LS_ENTRIES = "bitacora_local_entries";
const LS_ACTIVE = "bitacora_local_active";
const LS_RECENTS = "bitacora_local_recents";
const LS_ONBOARDED = "bitacora_demo_onboarded";
const LS_DEMO_MODE = "bitacora_demo_mode";
const LS_DEMO_TODOS = "bitacora_demo_todos";

interface LocalEntry {
  id: string;
  description: string | null;
  client_id: string | null;
  task_id: string | null;
  project_id: string | null;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  duration_min: number | null;
  clients?: { name: string } | null;
  tasks?: { title: string } | null;
}

/**
 * Check if there are demo entries worth migrating.
 */
export function hasDemoEntries(): boolean {
  try {
    const raw = localStorage.getItem(LS_ENTRIES);
    if (!raw) return false;
    const entries = JSON.parse(raw) as LocalEntry[];
    return entries.filter((e) => e.ended_at).length > 0;
  } catch {
    return false;
  }
}

/**
 * Migrate demo localStorage entries to real time_entries for the given user.
 * Returns count of migrated entries.
 */
export async function migrateDemoEntries(userId: string): Promise<number> {
  try {
    const raw = localStorage.getItem(LS_ENTRIES);
    if (!raw) return 0;

    const entries = JSON.parse(raw) as LocalEntry[];
    const completed = entries.filter((e) => e.ended_at);

    if (completed.length === 0) return 0;

    const rows = completed.map((e) => ({
      user_id: userId,
      description: e.description,
      started_at: e.started_at,
      ended_at: e.ended_at,
      // Don't include duration_min — it's a generated column
      // Don't include client_id/task_id/project_id — they reference local IDs
    }));

    const { error } = await supabase.from("time_entries").insert(rows);

    if (error) {
      console.error("Demo migration error:", error);
      return 0;
    }

    // Clear demo data after successful migration
    clearDemoData();
    return completed.length;
  } catch (err) {
    console.error("Demo migration failed:", err);
    return 0;
  }
}

/**
 * Clear all demo localStorage keys.
 */
export function clearDemoData() {
  [LS_ENTRIES, LS_ACTIVE, LS_RECENTS, LS_ONBOARDED, LS_DEMO_MODE, LS_DEMO_TODOS].forEach(
    (k) => localStorage.removeItem(k)
  );
}
