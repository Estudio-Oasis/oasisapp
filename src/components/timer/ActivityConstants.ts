import {
  Briefcase,
  Video,
  Eye,
  CalendarClock,
  Settings,
  Coffee,
  Utensils,
  Bath,
  Moon,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";

// ── Activity Type System ──────────────────────────────────────────
// Single source of truth for the entire Activity Registration Engine.
// All UI reads from here — never from raw description strings.

export type ActivityType =
  | "trabajo"
  | "reunion"
  | "revision"
  | "planeacion"
  | "administracion"
  | "break"
  | "comida"
  | "ausente"
  | "offline"
  | "sin_clasificar";

export interface ActivityTypeConfig {
  key: ActivityType;
  label: string;
  icon: LucideIcon;
  /** HSL string for color-bar / badge — uses design-system tokens where possible */
  color: string;
  productive: boolean;
  /** Used in pause-type selector only */
  isPause: boolean;
}

export const ACTIVITY_TYPES: Record<ActivityType, ActivityTypeConfig> = {
  trabajo: {
    key: "trabajo",
    label: "Trabajo",
    icon: Briefcase,
    color: "hsl(220, 60%, 50%)",
    productive: true,
    isPause: false,
  },
  reunion: {
    key: "reunion",
    label: "Reunión",
    icon: Video,
    color: "hsl(270, 55%, 50%)",
    productive: true,
    isPause: false,
  },
  revision: {
    key: "revision",
    label: "Revisión",
    icon: Eye,
    color: "hsl(180, 50%, 45%)",
    productive: true,
    isPause: false,
  },
  planeacion: {
    key: "planeacion",
    label: "Planeación",
    icon: CalendarClock,
    color: "hsl(200, 50%, 50%)",
    productive: true,
    isPause: false,
  },
  administracion: {
    key: "administracion",
    label: "Administración",
    icon: Settings,
    color: "hsl(30, 40%, 50%)",
    productive: true,
    isPause: false,
  },
  break: {
    key: "break",
    label: "Descanso",
    icon: Coffee,
    color: "hsl(0, 0%, 65%)",
    productive: false,
    isPause: true,
  },
  comida: {
    key: "comida",
    label: "Comida",
    icon: Utensils,
    color: "hsl(40, 60%, 50%)",
    productive: false,
    isPause: true,
  },
  ausente: {
    key: "ausente",
    label: "Ausente",
    icon: Bath,
    color: "hsl(0, 0%, 55%)",
    productive: false,
    isPause: true,
  },
  offline: {
    key: "offline",
    label: "Fuera de línea",
    icon: Moon,
    color: "hsl(0, 0%, 45%)",
    productive: false,
    isPause: true,
  },
  sin_clasificar: {
    key: "sin_clasificar",
    label: "Actividad libre",
    icon: HelpCircle,
    color: "hsl(0, 0%, 70%)",
    productive: false,
    isPause: false,
  },
};

// ── Normalizer ────────────────────────────────────────────────────
// Maps legacy description strings to a canonical ActivityType.
// When ambiguous, returns "sin_clasificar" instead of silently defaulting to "trabajo".

const DESCRIPTION_MAP: Record<string, ActivityType> = {
  // Legacy break labels (from old TimerContext)
  Break: "break",
  Comiendo: "comida",
  AFK: "ausente",
  Reunión: "reunion",
  Offline: "offline",
  // Spanish labels
  Descanso: "break",
  Comida: "comida",
  Ausente: "ausente",
  "Fuera de línea": "offline",
  Trabajo: "trabajo",
  Revisión: "revision",
  Planeación: "planeacion",
  Administración: "administracion",
};

export function getNormalizedActivityType(entry: {
  description?: string | null;
  client_id?: string | null;
}): ActivityType {
  const desc = entry.description?.trim() ?? "";

  // Direct match from known labels
  if (desc && DESCRIPTION_MAP[desc]) {
    return DESCRIPTION_MAP[desc];
  }

  // If has client_id → productive work
  if (entry.client_id) {
    return "trabajo";
  }

  // No client, no known label → sin_clasificar (detectable for later review)
  if (desc) {
    return "sin_clasificar";
  }

  return "sin_clasificar";
}

export function getActivityConfig(type: ActivityType): ActivityTypeConfig {
  return ACTIVITY_TYPES[type];
}

// ── Pause types (for "Registrar pausa" selector) ──────────────────
export const PAUSE_TYPES = Object.values(ACTIVITY_TYPES).filter((t) => t.isPause);

// ── Productive types (for "Cambiar actividad" suggestions) ────────
export const PRODUCTIVE_TYPES = Object.values(ACTIVITY_TYPES).filter(
  (t) => t.productive && t.key !== "trabajo"
);

// ── UI Copy Constants ─────────────────────────────────────────────
export const UI_COPY = {
  // Placeholder & launcher
  placeholder: "¿En qué estás trabajando?",
  launcherIdle: "Registrar actividad",
  launcherIdleMobile: "¿Qué estás haciendo?",

  // Primary actions
  btnStart: "Registrar actividad",
  btnSwitch: "Cambiar",
  btnPause: "Registrar pausa",
  btnFinish: "Finalizar",
  btnSaving: "Guardando…",
  btnManualEntry: "Agregar entrada manual",

  // Active session
  sessionActive: "Sesión activa",
  sessionNoTask: "Sin tarea específica",
  sessionNoClient: "Actividad interna",

  // Context badge
  contextDetected: "Contexto detectado",
  contextEdit: "Editar",

  // Recents
  recentsTitle: "Recientes",
  recentsEmpty: "Sin actividades recientes",

  // Empty states
  emptyNoSession: "Registra en qué estás trabajando para que tu equipo tenga visibilidad operativa.",
  emptyNoEntries: "Comienza a registrar tu trabajo y genera visibilidad sobre tu día.",
  emptyNoTasks: "Conecta una tarea para dar contexto a tu registro.",
  emptyNoTeam: "Cuando tu equipo registre actividad, la verás aquí.",

  // Day insights
  insightTotalLabel: "Registrado hoy",
  insightProductiveLabel: "Productivo",
  insightTopClientLabel: "Cliente principal",
  insightTopActivityLabel: "Actividad principal",
  insightFocusLabel: "Enfoque del día",
  insightGapsLabel: "Gaps pendientes",

  // Misc
  pageTitle: "Registro de actividad",
  todayTab: "Hoy",
  weekTab: "Esta semana",
  myEntries: "Mis registros",
  allEntries: "Todos",
  gapLabel: "Tiempo sin registrar",
  gapAction: "¿Qué pasó aquí?",
} as const;

// ── Truncation rules ──────────────────────────────────────────────
export const TRUNCATION = {
  activityName: 28,
  clientName: 20,
  taskName: 24,
} as const;
