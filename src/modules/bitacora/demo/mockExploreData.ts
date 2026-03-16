import type { EntryInfo } from "../types";

const LOCAL_USER_ID = "local-demo-user";

/**
 * Generates a 100% fictional day for "Solo explorar" mode.
 * No real names, no real clients. A relatable, aspirational narrative.
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

  // A fictional freelancer/agency day — relatable and aspirational
  const allEntries = [
    makeEntry(7, 0, 7, 35, "Salió a correr 🏃"),
    makeEntry(7, 40, 8, 10, "Desayuno y café ☕"),
    makeEntry(8, 15, 8, 30, "Revisión de mensajes y emails"),
    makeEntry(8, 30, 9, 30, "Junta de arranque con equipo"),
    makeEntry(9, 30, 11, 0, "Diseño de propuesta comercial", "Café Montaña", "Propuesta branding"),
    makeEntry(11, 0, 11, 15, "Break rápido ☕"),
    makeEntry(11, 15, 12, 30, "Desarrollo de landing page", "Luna Studio", "Rediseño web Q2"),
    // GAP: 12:30 to 13:00 — intentional gap (no entry)
    makeEntry(13, 0, 13, 50, "Comida 🍽️"),
    // Unclassified block — vague, teaches enrichment
    makeEntry(13, 50, 14, 10, "Cosas varias"),
    makeEntry(14, 10, 15, 30, "Correcciones de copy y assets", "Luna Studio", "Rediseño web Q2"),
    makeEntry(15, 30, 15, 50, "Llamada con Valeria — revisión de avances"),
    makeEntry(15, 50, 16, 0, "Break y estiramiento"),
    makeEntry(16, 0, 17, 0, "Avance en estrategia de contenido", "Café Montaña", "Plan de contenido"),
    makeEntry(17, 0, 17, 20, "Revisión de pendientes y cierre del día 📋"),
  ];

  // Only show entries that have ended by now
  return allEntries.filter((e) => {
    const endH = new Date(e.ended_at!).getHours();
    const endM = new Date(e.ended_at!).getMinutes();
    return endH < currentHour || (endH === currentHour && endM <= now.getMinutes());
  });
}
