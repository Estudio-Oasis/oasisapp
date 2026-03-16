import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Zap, ChevronRight, Plus, ArrowRight, X } from "lucide-react";
import { getClientColor, formatDuration } from "@/lib/timer-utils";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

// ─── MOCK DATA ───
const MOCK_CLIENTS = [
  { id: "c1", name: "Vertex Studio", color: "#5B8DEF" },
  { id: "c2", name: "Helios Labs", color: "#F59E0B" },
  { id: "c3", name: "Nova Digital", color: "#10B981" },
];

const now = new Date();
const today = new Date(now);
const workStart = new Date(today); workStart.setHours(9, 0, 0, 0);
const workEnd = new Date(today); workEnd.setHours(18, 0, 0, 0);

function makeEntry(clientIdx: number, startH: number, startM: number, endH: number, endM: number, desc: string) {
  const s = new Date(today); s.setHours(startH, startM, 0, 0);
  const e = new Date(today); e.setHours(endH, endM, 0, 0);
  const dur = Math.round((e.getTime() - s.getTime()) / 60000);
  return {
    id: `${clientIdx}-${startH}${startM}`,
    client: MOCK_CLIENTS[clientIdx],
    startedAt: s,
    endedAt: e,
    durationMin: dur,
    description: desc,
  };
}

const MOCK_ENTRIES = [
  makeEntry(0, 9, 0, 10, 30, "Diseño de propuesta comercial"),
  makeEntry(1, 10, 45, 12, 15, "Sprint review + ajustes al dashboard"),
  makeEntry(2, 13, 0, 14, 30, "QA del módulo de reportes"),
  makeEntry(0, 14, 45, 16, 0, "Iteración de wireframes v2"),
  makeEntry(1, 16, 15, 17, 30, "Revisión de copy con el equipo"),
];

const TOTAL_MINUTES = MOCK_ENTRIES.reduce((s, e) => s + e.durationMin, 0);

// ─── DEMO TIMELINE ───
function DemoTimeline() {
  const totalMs = workEnd.getTime() - workStart.getTime();

  const hourMarkers: { label: string; pct: number }[] = [];
  for (let h = 9; h <= 18; h++) {
    const t = new Date(today); t.setHours(h, 0, 0, 0);
    const pct = ((t.getTime() - workStart.getTime()) / totalMs) * 100;
    hourMarkers.push({ label: String(h).padStart(2, "0"), pct });
  }

  const nowPct = Math.min(100, Math.max(0, ((now.getTime() - workStart.getTime()) / totalMs) * 100));
  const showNow = now >= workStart && now <= workEnd;

  return (
    <div className="space-y-0">
      <div className="relative">
        <div className="flex h-8 rounded-lg overflow-hidden bg-[hsl(var(--background-tertiary))] gap-px">
          {MOCK_ENTRIES.map((entry, i) => {
            const startPct = ((entry.startedAt.getTime() - workStart.getTime()) / totalMs) * 100;
            const widthPct = ((entry.endedAt.getTime() - entry.startedAt.getTime()) / totalMs) * 100;
            return (
              <Tooltip key={i}>
                <TooltipTrigger asChild>
                  <div
                    className="absolute h-full rounded-sm hover:opacity-80 transition-opacity"
                    style={{
                      left: `${startPct}%`,
                      width: `${widthPct}%`,
                      backgroundColor: entry.client.color,
                      minWidth: "4px",
                    }}
                  />
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  {entry.client.name} — {entry.durationMin}m
                </TooltipContent>
              </Tooltip>
            );
          })}
          {showNow && (
            <div className="absolute top-0 h-full w-0.5 bg-[hsl(var(--accent))] z-10" style={{ left: `${nowPct}%` }}>
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 h-2 w-2 rounded-full bg-[hsl(var(--accent))]" />
            </div>
          )}
        </div>
      </div>
      <div className="relative h-4 mt-0.5">
        {hourMarkers.filter((_, i) => i % 2 === 0 || i === hourMarkers.length - 1).map((m) => (
          <span
            key={m.label}
            className="absolute text-[9px] text-[hsl(var(--foreground-muted))]/60 tabular-nums font-medium -translate-x-1/2"
            style={{ left: `${m.pct}%` }}
          >
            {m.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── DEMO ENTRY ROW ───
function DemoEntryRow({ entry }: { entry: typeof MOCK_ENTRIES[0] }) {
  const fmt = (d: Date) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: entry.client.color }} />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-[hsl(var(--foreground))] truncate">{entry.description}</p>
        <p className="text-[11px] text-[hsl(var(--foreground-muted))]">
          {entry.client.name} · {fmt(entry.startedAt)}–{fmt(entry.endedAt)}
        </p>
      </div>
      <span className="text-[12px] font-semibold text-[hsl(var(--foreground))] tabular-nums shrink-0">
        {formatDuration(entry.durationMin)}
      </span>
    </div>
  );
}

// ─── INSIGHTS BAR ───
function DemoInsights() {
  const clients = [...new Set(MOCK_ENTRIES.map(e => e.client.name))];
  return (
    <div className="flex items-center gap-4 text-[11px] text-[hsl(var(--foreground-muted))]">
      <span><strong className="text-[hsl(var(--foreground))]">{MOCK_ENTRIES.length}</strong> registros</span>
      <span><strong className="text-[hsl(var(--foreground))]">{clients.length}</strong> clientes</span>
      <span><strong className="text-[hsl(var(--foreground))]">0</strong> gaps</span>
    </div>
  );
}

// ─── MAIN DEMO PAGE ───
export default function BitacoraDemo() {
  const [showCTA, setShowCTA] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowCTA(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  const dateStr = today.toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-[hsl(var(--background))]">
        {/* Demo header */}
        <header className="sticky top-0 z-50 bg-[hsl(var(--background))]/90 backdrop-blur-xl border-b border-[hsl(var(--border))]">
          <div className="max-w-2xl mx-auto px-4 h-12 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-md bg-[hsl(var(--foreground))] flex items-center justify-center">
                <span className="text-[8px] font-bold tracking-widest text-[hsl(var(--background))]">OS</span>
              </div>
              <span className="text-[13px] font-semibold text-[hsl(var(--foreground))]">Bitácora</span>
              <span className="text-[10px] font-medium text-[hsl(var(--accent))] bg-[hsl(var(--accent))]/10 px-1.5 py-0.5 rounded-full">Demo</span>
            </div>
            <Link
              to="/signup"
              className="h-8 px-4 rounded-full bg-[hsl(var(--foreground))] text-[hsl(var(--background))] text-[12px] font-semibold flex items-center gap-1.5 hover:opacity-90 transition-opacity"
            >
              Probar gratis <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-3 py-4 space-y-2.5">
          {/* ── CONTROL SURFACE ── */}
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden">
            {/* Launcher */}
            <div className="p-3 pb-0">
              <button
                className="flex w-full items-center gap-3 rounded-xl bg-[hsl(var(--foreground))] px-4 py-3.5 transition-all hover:opacity-90 active:scale-[0.985] group text-left"
                onClick={() => setShowCTA(true)}
              >
                <div className="relative h-10 w-10 rounded-lg bg-[hsl(var(--accent))] flex items-center justify-center shrink-0">
                  <Zap className="h-[18px] w-[18px] text-[hsl(var(--accent-foreground))]" />
                  <span className="absolute inset-0 rounded-lg bg-[hsl(var(--accent))]/30 animate-ping" style={{ animationDuration: '3s' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[14px] font-semibold text-[hsl(var(--primary-foreground))]/90 block leading-tight">
                    ¿En qué estás trabajando?
                  </span>
                  <span className="text-[11px] text-[hsl(var(--primary-foreground))]/40 mt-0.5 block leading-tight">
                    {formatDuration(TOTAL_MINUTES)} registradas hoy
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 text-[hsl(var(--primary-foreground))]/30 shrink-0" />
              </button>
            </div>

            {/* Day context */}
            <div className="px-3 pt-2.5 pb-2">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-medium text-[hsl(var(--foreground-muted))] uppercase tracking-wider">
                  {dateStr}
                </span>
                <span className="text-[11px] font-bold text-[hsl(var(--foreground))] tabular-nums">
                  {formatDuration(TOTAL_MINUTES)}
                </span>
              </div>
              <DemoTimeline />
            </div>

            {/* Insights */}
            <div className="border-t border-[hsl(var(--border))] px-3 py-2">
              <DemoInsights />
            </div>
          </div>

          {/* ── FILTERS ── */}
          <div className="flex items-center gap-3">
            <div className="inline-flex rounded-lg bg-[hsl(var(--background-tertiary))] p-0.5 gap-0.5">
              <span className="px-3 py-1 rounded-md text-[11px] font-medium bg-[hsl(var(--foreground))] text-[hsl(var(--background))]">Hoy</span>
              <span className="px-3 py-1 rounded-md text-[11px] font-medium text-[hsl(var(--foreground-secondary))]">Semana</span>
            </div>
            <div className="inline-flex rounded-lg bg-[hsl(var(--background-tertiary))] p-0.5 gap-0.5">
              <span className="px-3 py-1 rounded-md text-[11px] font-medium bg-[hsl(var(--foreground))] text-[hsl(var(--background))]">Mis registros</span>
              <span className="px-3 py-1 rounded-md text-[11px] font-medium text-[hsl(var(--foreground-secondary))]">Todos</span>
            </div>
            <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-medium text-[hsl(var(--foreground-muted))]">
              <Plus className="h-3 w-3" /> Manual
            </span>
          </div>

          {/* ── FEED ── */}
          <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden">
            <div className="divide-y divide-[hsl(var(--border))]">
              {MOCK_ENTRIES.map((entry) => (
                <div key={entry.id} className="px-3">
                  <DemoEntryRow entry={entry} />
                </div>
              ))}
            </div>
          </div>

          {/* Value proposition */}
          <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background-secondary))] p-5 text-center space-y-3 mt-4">
            <p className="text-[13px] font-semibold text-[hsl(var(--foreground))]">
              Bitácora convierte actividad en visibilidad operativa
            </p>
            <p className="text-[12px] text-[hsl(var(--foreground-muted))] max-w-sm mx-auto leading-relaxed">
              Registra el trabajo de tu equipo en tiempo real. Entiende en qué se va el día, detecta gaps y genera datos que alimentan todo el sistema.
            </p>
            <div className="flex flex-wrap justify-center gap-2 pt-1">
              {["Registro contextual", "Timeline visual", "Insights del día", "Detección de gaps", "Vista de equipo"].map((f) => (
                <span key={f} className="text-[10px] font-medium text-[hsl(var(--foreground-secondary))] bg-[hsl(var(--background-tertiary))] px-2.5 py-1 rounded-full">
                  {f}
                </span>
              ))}
            </div>
            <Link
              to="/signup"
              className="inline-flex h-10 px-6 rounded-full bg-[hsl(var(--foreground))] text-[hsl(var(--background))] text-[13px] font-semibold items-center gap-2 hover:opacity-90 transition-opacity mt-2"
            >
              Empezar gratis <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </main>

        {/* Sticky bottom CTA — appears after delay */}
        {showCTA && (
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-[hsl(var(--foreground))] text-[hsl(var(--background))] px-4 py-3 flex items-center justify-between md:hidden animate-in slide-in-from-bottom duration-300">
            <div className="min-w-0">
              <p className="text-[12px] font-semibold">¿Listo para tu equipo?</p>
              <p className="text-[10px] opacity-60">Prueba Bitácora gratis</p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/signup"
                className="h-8 px-4 rounded-full bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] text-[11px] font-bold flex items-center gap-1"
              >
                Probar <ArrowRight className="h-3 w-3" />
              </Link>
              <button onClick={() => setShowCTA(false)} className="text-[hsl(var(--background))]/50 p-1">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
