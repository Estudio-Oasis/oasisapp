import { createContext, useContext } from "react";
import type { BitacoraProviderValue, BitacoraViewModel } from "./types";

const defaultConfig = { mode: "oasis" as const, features: {} };

const BitacoraCtx = createContext<BitacoraProviderValue>({
  isRunning: false,
  isStopping: false,
  activeEntry: null,
  elapsedSeconds: 0,
  startActivity: async () => {},
  switchActivity: async () => {},
  stopActivity: async () => {},
  startQuickAction: async () => {},
  updateActiveEntry: async () => {},
  fillGap: async () => {},
  updateEntry: async () => {},
  deleteEntry: async () => {},
  projects: [],
  clients: [],
  recents: [],
  refreshClients: () => {},
  refreshProjects: () => {},
  config: defaultConfig,
});

const ViewModelCtx = createContext<BitacoraViewModel>({
  entries: [],
  gaps: [],
  totalMinutes: 0,
  groupedByDay: {},
  sortedDays: [],
  profileMap: {},
  workSchedule: { startHour: 9, startMinute: 0, endHour: 18, endMinute: 0 },
  view: "today",
  setView: () => {},
  entryFilter: "mine",
  setEntryFilter: () => {},
  isAdmin: false,
  refresh: () => {},
  timelineEntries: [],
  todaySummaryText: "Tu día empieza aquí",
  hasData: false,
});

export const useBitacora = () => useContext(BitacoraCtx);
export const useBitacoraVM = () => useContext(ViewModelCtx);

export { BitacoraCtx, ViewModelCtx };
