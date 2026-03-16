import type { EntryInfo } from "../types";

const LOCAL_USER_ID = "local-demo-user";

/**
 * Generates realistic mock data for "Solo explorar" mode.
 * Includes: deep work, meetings, breaks, meals, gaps, and one unclassified block.
 */
export function generateExploreEntries(): EntryInfo[] {
  const now = new Date();
  const today = new Date(now);

  const makeEntry = (
    hourStart: number, minStart: number,
    hourEnd: number, minEnd: number,
    desc: string,
    clientName?: string,
    taskTitle?: string,
  ): EntryInfo => {
    const start = new Date(today);
    start.setHours(hourStart, minStart, 0, 0);
    const end = new Date(today);
    end.setHours(hourEnd, minEnd, 0, 0);
    const durMin = Math.round((end.getTime() - start.getTime()) / 60000);
    return {
      id: `explore-${hourStart}${minStart}-${Math.random().toString(36).slice(2, 6)}`,
      description: desc,
      client_id: clientName ? `mock-client-${clientName.toLowerCase().replace(/\s/g, "")}` : null,
      task_id: taskTitle ? `mock-task-${Math.random().toString(36).slice(2, 6)}` : null,
      project_id: null,
      user_id: LOCAL_USER_ID,
      started_at: start.toISOString(),
      ended_at: end.toISOString(),
      duration_min: durMin,
      clients: clientName ? { name: clientName } : null,
      tasks: taskTitle ? { title: taskTitle } : null,
    };
  };

  const currentHour = now.getHours();

  // Realistic day with variety:
  // 9:00–9:15  → Correos (warm-up, no client)
  // 9:15–10:30 → Deep work with client
  // 10:30–10:45 → Break ☕
  // 10:45–12:00 → Deep work continues
  // GAP 12:00–12:15 → intentional gap (no entry)
  // 12:15–12:45 → Meeting
  // 12:45–13:45 → Lunch
  // 13:45–14:00 → Unclassified block (no context, teaches enrichment)
  // 14:00–15:30 → Client work
  // 15:30–15:45 → Quick call
  // 15:45–16:45 → Corrections
  // 16:45–17:00 → Day close
  const allEntries = [
    makeEntry(9, 0, 9, 15, "Revisión de correos y Slack"),
    makeEntry(9, 15, 10, 30, "Diseño de landing page — wireframes y estructura", "7H Studios", "Rediseño web"),
    makeEntry(10, 30, 10, 45, "Break ☕"),
    makeEntry(10, 45, 12, 0, "Desarrollo de componentes React", "7H Studios", "Rediseño web"),
    // GAP: 12:00 to 12:15 — no entry on purpose
    makeEntry(12, 15, 12, 45, "Reunión de seguimiento con equipo"),
    makeEntry(12, 45, 13, 45, "Comida 🍽️"),
    // Unclassified block — no client, no task, vague description
    makeEntry(13, 45, 14, 0, "Cosas varias"),
    makeEntry(14, 0, 15, 30, "Propuesta de proyecto nuevo", "Amura Digital", "Propuesta Q2"),
    makeEntry(15, 30, 15, 45, "Llamada rápida con Carla"),
    makeEntry(15, 45, 16, 45, "Correcciones de copy y assets", "7H Studios", "Rediseño web"),
    makeEntry(16, 45, 17, 0, "Revisión de pendientes y cierre del día"),
  ];

  return allEntries.filter((e) => {
    const endH = new Date(e.ended_at!).getHours();
    const endM = new Date(e.ended_at!).getMinutes();
    return endH < currentHour || (endH === currentHour && endM <= now.getMinutes());
  });
}
