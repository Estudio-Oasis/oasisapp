import { useState } from "react";
import { ActiveSessionCard } from "@/components/timer/ActiveSessionCard";
import { TimerControls } from "@/components/timer/TimerControls";
import { TimeEntryRow } from "@/components/timer/TimeEntryRow";
import { GapAlert } from "@/components/timer/GapAlert";
import { DayInsights } from "@/components/timer/DayInsights";
import { EmptyState } from "@/components/timer/EmptyState";
import { QuickLogInput } from "@/components/timer/QuickLogInput";
import { RecentsPanel, type RecentItem } from "@/components/timer/RecentsPanel";
import { ContextBadge } from "@/components/timer/ContextBadge";
import { ActivityTypeSelector } from "@/components/timer/ActivityTypeSelector";
import { UI_COPY } from "@/components/timer/ActivityConstants";
import { formatDateLong, formatDuration } from "@/lib/timer-utils";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";

// ── Mock Data ─────────────────────────────────────────────────────

const NOW = new Date();
const today = (h: number, m: number) => {
  const d = new Date(NOW);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
};

type Variant = "full" | "no_context" | "internal" | "pause" | "empty";

const MOCK_ENTRIES = [
  {
    id: "e1",
    description: null,
    client_id: "c1",
    clientName: "Estudio Oasis",
    taskTitle: "Rediseño homepage",
    started_at: today(9, 0),
    ended_at: today(10, 30),
    duration_min: 90,
    user_id: "u1",
  },
  {
    id: "e2",
    description: "Break",
    client_id: null,
    clientName: null,
    taskTitle: null,
    started_at: today(10, 30),
    ended_at: today(10, 45),
    duration_min: 15,
    user_id: "u1",
  },
  {
    id: "e3",
    description: null,
    client_id: "c2",
    clientName: "MuchosLeads",
    taskTitle: "Campaña Q2",
    started_at: today(10, 45),
    ended_at: today(12, 15),
    duration_min: 90,
    user_id: "u1",
  },
  {
    id: "e4",
    description: "Comiendo",
    client_id: null,
    clientName: null,
    taskTitle: null,
    started_at: today(12, 15),
    ended_at: today(13, 0),
    duration_min: 45,
    user_id: "u1",
  },
  {
    id: "e5",
    description: "Reunión",
    client_id: "c1",
    clientName: "Estudio Oasis",
    taskTitle: "Kick-off nuevo proyecto",
    started_at: today(13, 0),
    ended_at: today(13, 45),
    duration_min: 45,
    user_id: "u1",
  },
  {
    id: "e6",
    description: null,
    client_id: "c3",
    clientName: "Acme Corp",
    taskTitle: "Branding guidelines",
    started_at: today(14, 15),
    ended_at: today(15, 30),
    duration_min: 75,
    user_id: "u1",
  },
  {
    id: "e7",
    description: "Administración",
    client_id: null,
    clientName: null,
    taskTitle: null,
    started_at: today(15, 30),
    ended_at: today(16, 0),
    duration_min: 30,
    user_id: "u1",
  },
  {
    id: "e8",
    description: null,
    client_id: "c1",
    clientName: "Estudio Oasis",
    taskTitle: "Revisión de copy",
    started_at: today(16, 0),
    ended_at: today(17, 0),
    duration_min: 60,
    user_id: "u1",
  },
];

const MOCK_GAPS = [
  {
    startTime: new Date(today(13, 45)),
    endTime: new Date(today(14, 15)),
    durationMin: 30,
  },
];

const MOCK_RECENTS: RecentItem[] = [
  { id: "r1", clientName: "Estudio Oasis", taskTitle: "Rediseño homepage", clientId: "c1" },
  { id: "r2", clientName: "MuchosLeads", taskTitle: "Campaña Q2", clientId: "c2" },
  { id: "r3", clientName: null, taskTitle: null, description: "Reunión", clientId: null },
  { id: "r4", clientName: "Acme Corp", taskTitle: "Branding guidelines", clientId: "c3" },
  { id: "r5", clientName: null, taskTitle: null, description: "Administración", clientId: null },
];

const MOCK_ACTIVE_SESSION = {
  full: {
    clientName: "Estudio Oasis",
    taskTitle: "Landing de producto",
    description: null,
    clientId: "c1",
  },
  no_context: {
    clientName: null,
    taskTitle: null,
    description: "Trabajo general",
    clientId: null,
  },
  internal: {
    clientName: null,
    taskTitle: null,
    description: "Administración",
    clientId: null,
  },
  pause: {
    clientName: null,
    taskTitle: null,
    description: "Break",
    clientId: null,
  },
  empty: null,
};

// ── Playground Page ───────────────────────────────────────────────

const VARIANTS: { key: Variant; label: string }[] = [
  { key: "full", label: "Con contexto" },
  { key: "no_context", label: "Sin contexto" },
  { key: "internal", label: "Actividad interna" },
  { key: "pause", label: "En pausa" },
  { key: "empty", label: "Estado vacío" },
];

export default function PlaygroundActivityEngine() {
  const [variant, setVariant] = useState<Variant>("full");
  const [elapsed, setElapsed] = useState(2538); // 42:18
  const [showRecents, setShowRecents] = useState(false);

  const session = MOCK_ACTIVE_SESSION[variant];
  const isEmpty = variant === "empty";
  const totalMin = MOCK_ENTRIES.reduce((s, e) => s + (e.duration_min || 0), 0);

  // Insights-compatible format
  const insightEntries = MOCK_ENTRIES.map((e) => ({
    description: e.description,
    client_id: e.client_id,
    duration_min: e.duration_min,
    clients: e.clientName ? { name: e.clientName } : null,
  }));

  return (
    <div className="min-h-screen bg-background">
      {/* Variant Selector */}
      <div className="sticky top-0 z-30 bg-background border-b border-border px-4 py-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          <span className="text-micro text-foreground-muted shrink-0">Variante:</span>
          {VARIANTS.map((v) => (
            <button
              key={v.key}
              onClick={() => { setVariant(v.key); setShowRecents(false); }}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                variant === v.key
                  ? "bg-foreground text-background"
                  : "bg-background-secondary text-foreground-secondary hover:text-foreground"
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-6 space-y-6 max-w-lg mx-auto">
        {/* Page Title */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-h1 text-foreground">{UI_COPY.pageTitle}</h1>
            <p className="text-sm text-foreground-secondary mt-0.5">
              {formatDateLong(NOW)}
            </p>
          </div>
          {!isEmpty && (
            <div className="rounded-lg border border-border bg-background-secondary px-3 py-1.5">
              <span className="text-sm font-semibold text-foreground">
                {formatDuration(totalMin)} hoy
              </span>
            </div>
          )}
        </div>

        {/* Active Session Card */}
        {session && (
          <ActiveSessionCard
            variant="expanded"
            clientName={session.clientName}
            taskTitle={session.taskTitle}
            description={session.description}
            clientId={session.clientId}
            elapsedSeconds={elapsed}
          >
            <TimerControls
              onSwitch={() => toast("Cambiar actividad (demo)")}
              onPause={(type) => toast(`Registrar pausa: ${type} (demo)`)}
              onFinish={() => toast("Finalizar registro (demo)")}
              layout="row"
            />
          </ActiveSessionCard>
        )}

        {/* Context Badge (only for full variant) */}
        {variant === "full" && (
          <ContextBadge
            clientName="Estudio Oasis"
            projectName="Website"
            taskTitle="Landing de producto"
            onEdit={() => toast("Editar contexto (demo)")}
          />
        )}

        {/* Day Insights */}
        {!isEmpty && <DayInsights entries={insightEntries} gapCount={MOCK_GAPS.length} />}

        {/* Quick Log Input */}
        <QuickLogInput onClick={() => setShowRecents(!showRecents)} />

        {/* Recents Panel */}
        {showRecents && (
          <div className="rounded-xl border border-border bg-card p-3">
            <RecentsPanel
              items={MOCK_RECENTS}
              onSelect={(item) => {
                toast(`Seleccionaste: ${item.taskTitle || item.description} (demo)`);
                setShowRecents(false);
              }}
            />
          </div>
        )}

        {/* Empty State or Timeline */}
        {isEmpty ? (
          <EmptyState context="no_entries" />
        ) : (
          <div>
            <p className="text-micro text-foreground-secondary mb-3">Timeline del día</p>
            {MOCK_ENTRIES.map((entry, i) => {
              // Insert gap before entry at 14:15
              const showGap = entry.id === "e6";
              return (
                <div key={entry.id}>
                  {showGap && (
                    <GapAlert
                      startTime={MOCK_GAPS[0].startTime}
                      endTime={MOCK_GAPS[0].endTime}
                      durationMin={MOCK_GAPS[0].durationMin}
                      onFill={() => toast("Llenar gap (demo)")}
                    />
                  )}
                  <TimeEntryRow
                    id={entry.id}
                    description={entry.description}
                    clientId={entry.client_id}
                    clientName={entry.clientName}
                    taskTitle={entry.taskTitle}
                    startedAt={entry.started_at}
                    endedAt={entry.ended_at}
                    durationMin={entry.duration_min}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* Manual Entry Button */}
        {!isEmpty && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => toast("Agregar entrada manual (demo)")}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            {UI_COPY.btnManualEntry}
          </Button>
        )}

        {/* ── Mobile FAB Pill Preview ── */}
        <div className="mt-8 border-t border-border pt-6">
          <p className="text-micro text-foreground-secondary mb-4">Vista previa del FAB móvil</p>
          <div className="relative h-20 rounded-xl bg-background-secondary border border-border flex items-end justify-end p-4">
            {session ? (
              <div className="flex items-center gap-2 rounded-pill bg-accent px-4 py-2.5 shadow-md">
                <div className="h-2 w-2 rounded-full bg-foreground animate-pulse" />
                <span className="text-xs font-bold text-foreground tabular-nums">
                  {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-pill bg-foreground px-4 py-2.5 shadow-md">
                <span className="text-xs font-semibold text-background">
                  {UI_COPY.launcherIdleMobile}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Compact Variant Preview (Sidebar) ── */}
        <div className="mt-4">
          <p className="text-micro text-foreground-secondary mb-4">
            Vista previa del Widget sidebar
          </p>
          <div className="max-w-[240px] border border-border rounded-xl p-3 bg-sidebar">
            {session ? (
              <ActiveSessionCard
                variant="compact"
                clientName={session.clientName}
                taskTitle={session.taskTitle}
                description={session.description}
                clientId={session.clientId}
                elapsedSeconds={elapsed}
              >
                <div className="flex gap-2">
                  <button className="flex-1 h-7 rounded-md border border-border bg-background text-xs font-semibold text-foreground hover:bg-background-tertiary transition-colors">
                    {UI_COPY.btnSwitch}
                  </button>
                  <button className="flex-1 h-7 rounded-md bg-destructive text-xs font-semibold text-destructive-foreground hover:opacity-90 transition-opacity">
                    {UI_COPY.btnFinish}
                  </button>
                </div>
              </ActiveSessionCard>
            ) : (
              <button className="flex w-full items-center gap-2 rounded-lg border border-border bg-background-secondary px-3 py-2.5 transition-colors hover:border-foreground hover:text-foreground group">
                <span className="text-small text-foreground-secondary group-hover:text-foreground transition-colors">
                  {UI_COPY.launcherIdle}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* ── Mobile Drawer Preview ── */}
        <div className="mt-4">
          <p className="text-micro text-foreground-secondary mb-4">
            Vista previa del Drawer móvil
          </p>
          <div className="border border-border rounded-xl p-6 bg-card">
            <div className="mx-auto mb-6 h-1 w-8 rounded-full bg-border" />
            {session ? (
              <ActiveSessionCard
                variant="mobile"
                clientName={session.clientName}
                taskTitle={session.taskTitle}
                description={session.description}
                clientId={session.clientId}
                elapsedSeconds={elapsed}
              >
                <div className="mt-6">
                  <TimerControls
                    onSwitch={() => toast("Cambiar (demo)")}
                    onPause={(type) => toast(`Pausa: ${type} (demo)`)}
                    onFinish={() => toast("Finalizar (demo)")}
                    layout="stack"
                  />
                </div>
              </ActiveSessionCard>
            ) : (
              <EmptyState context="no_session" />
            )}
          </div>
        </div>

        {/* ── Empty States Gallery ── */}
        <div className="mt-4">
          <p className="text-micro text-foreground-secondary mb-4">
            Galería de estados vacíos
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {(["no_session", "no_entries", "no_tasks", "no_team"] as const).map(
              (ctx) => (
                <div key={ctx} className="border border-border rounded-xl overflow-hidden">
                  <EmptyState context={ctx} />
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
