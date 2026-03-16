import type { EntryInfo } from "../types";

const LOCAL_USER_ID = "local-demo-user";

/**
 * Generates realistic mock data for "Solo explorar" mode.
 * Creates entries for today with varied activities.
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
  
  // Only generate entries up to the current hour
  const allEntries = [
    makeEntry(9, 0, 9, 15, "Revisión de correos y Slack", undefined, undefined),
    makeEntry(9, 15, 10, 30, "Diseño de landing page", "7H Studios", "Rediseño web"),
    makeEntry(10, 30, 10, 45, "Break ☕"),
    makeEntry(10, 45, 12, 0, "Desarrollo de componentes React", "7H Studios", "Rediseño web"),
    makeEntry(12, 0, 12, 30, "Reunión de seguimiento con equipo"),
    makeEntry(12, 30, 13, 30, "Comida 🍽️"),
    makeEntry(13, 30, 15, 0, "Propuesta de proyecto nuevo", "Amura Digital", "Propuesta Q2"),
    makeEntry(15, 0, 15, 15, "Llamada rápida con Carla"),
    makeEntry(15, 15, 16, 30, "Correcciones de copy y assets", "7H Studios", "Rediseño web"),
    makeEntry(16, 30, 17, 0, "Revisión de pendientes y cierre del día"),
  ];

  return allEntries.filter((e) => {
    const endH = new Date(e.ended_at!).getHours();
    return endH <= currentHour;
  });
}
