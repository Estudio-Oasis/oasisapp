import { useState, useEffect, useMemo } from "react";
import { useBitacora, useBitacoraVM } from "@/modules/bitacora/BitacoraContext";
import { formatDuration, getClientColor } from "@/lib/timer-utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Play, Clock, TrendingUp, Briefcase } from "lucide-react";
import { BitacoraQuickSheet } from "@/modules/bitacora/BitacoraQuickSheet";

/**
 * Right sidebar for Bitácora — day stats, weekly streak, pending tasks.
 * Only visible on lg+ screens.
 */
export function BitacoraSidebar() {
  const bita = useBitacora();
  const vm = useBitacoraVM();
  const { user } = useAuth();
  const [pendingTasks, setPendingTasks] = useState<{ id: string; title: string; client_name: string | null }[]>([]);
  const [quickSheetOpen, setQuickSheetOpen] = useState(false);
  const [preselectedTaskId, setPreselectedTaskId] = useState<string | null>(null);

  // Load pending tasks
  useEffect(() => {
    if (!user) return;
    supabase
      .from("tasks")
      .select("id, title, clients(name)")
      .eq("assignee_id", user.id)
      .eq("status", "in_progress")
      .limit(5)
      .order("updated_at", { ascending: false })
      .then(({ data }) => {
        setPendingTasks(
          (data || []).map((t: any) => ({
            id: t.id,
            title: t.title,
            client_name: t.clients?.name || null,
          }))
        );
      });
  }, [user]);

  // Stats
  const stats = useMemo(() => {
    let totalMin = 0;
    let productiveMin = 0;
    const clientMinutes: Record<string, number> = {};

    vm.entries.forEach((e: any) => {
      const dur = Number(e.duration_min) || 0;
      totalMin += dur;
      if (e.client_id) productiveMin += dur;
      const cName = e.clients?.name;
      if (cName) clientMinutes[cName] = (clientMinutes[cName] || 0) + dur;
    });

    const topClient = Object.entries(clientMinutes).sort((a, b) => b[1] - a[1])[0];
    const productivePct = totalMin > 0 ? Math.round((productiveMin / totalMin) * 100) : 0;

    return { totalMin, productiveMin, productivePct, topClient };
  }, [vm.entries]);

  // Weekly streak — compute which days of the week have logged hours
  const [weekStreak, setWeekStreak] = useState<number[]>([]);
  useEffect(() => {
    if (!user) return;
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 7);

    supabase
      .from("time_entries")
      .select("started_at, duration_min")
      .eq("user_id", user.id)
      .gte("started_at", monday.toISOString())
      .lt("started_at", sunday.toISOString())
      .not("ended_at", "is", null)
      .then(({ data }) => {
        const dayMins = [0, 0, 0, 0, 0, 0, 0]; // Mon-Sun
        (data || []).forEach((e: any) => {
          const d = new Date(e.started_at);
          const dayIdx = (d.getDay() + 6) % 7; // Mon=0
          dayMins[dayIdx] += Number(e.duration_min) || 0;
        });
        setWeekStreak(dayMins);
      });
  }, [user, vm.entries.length]);

  const dayLabels = ["L", "M", "X", "J", "V", "S", "D"];
  const todayIdx = (new Date().getDay() + 6) % 7;

  const handleStartTask = (taskId: string) => {
    setPreselectedTaskId(taskId);
    setQuickSheetOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Day summary */}
      <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm space-y-3">
        <h3 className="text-[10px] font-semibold uppercase tracking-widest text-foreground-muted">
          Resumen hoy
        </h3>
        <div className="text-center py-2">
          <p className="text-3xl font-bold text-foreground tabular-nums tracking-tight">
            {formatDuration(stats.totalMin)}
          </p>
          <p className="text-[11px] text-foreground-muted mt-1">registradas hoy</p>
        </div>

        {/* Billable bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px]">
            <span className="text-foreground-muted">Facturable</span>
            <span className="font-semibold text-foreground tabular-nums">{stats.productivePct}%</span>
          </div>
          <div className="h-2 rounded-full bg-background-tertiary overflow-hidden">
            <div
              className="h-full rounded-full bg-accent transition-all duration-500"
              style={{ width: `${stats.productivePct}%` }}
            />
          </div>
        </div>

        {/* Top client */}
        {stats.topClient && (
          <div className="flex items-center gap-2 pt-1">
            <div
              className="h-2.5 w-2.5 rounded-full shrink-0"
              style={{ backgroundColor: getClientColor(stats.topClient[0]) }}
            />
            <span className="text-[11px] text-foreground-secondary truncate">
              {stats.topClient[0]}
            </span>
            <span className="text-[11px] font-semibold text-foreground tabular-nums ml-auto">
              {formatDuration(stats.topClient[1])}
            </span>
          </div>
        )}
      </div>

      {/* Weekly streak */}
      <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm space-y-3">
        <h3 className="text-[10px] font-semibold uppercase tracking-widest text-foreground-muted">
          Esta semana
        </h3>
        <div className="flex items-center justify-between gap-1">
          {dayLabels.map((label, i) => {
            const mins = weekStreak[i] || 0;
            const isToday = i === todayIdx;
            let color = "bg-background-tertiary"; // no data
            if (mins > 0 && mins < 360) color = "bg-accent/60"; // 1-6h = amber
            if (mins >= 360) color = "bg-success"; // 6h+ = green

            return (
              <div key={i} className="flex flex-col items-center gap-1">
                <div
                  className={`h-7 w-7 rounded-full flex items-center justify-center text-[9px] font-bold transition-colors ${color} ${
                    isToday ? "ring-2 ring-accent/40" : ""
                  }`}
                  title={`${label}: ${formatDuration(mins)}`}
                >
                  <span className={mins > 0 ? "text-white" : "text-foreground-muted"}>{label}</span>
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-[10px] text-center text-foreground-muted">
          {weekStreak.filter((m) => m > 0).length} de 7 días registrados
        </p>
      </div>

      {/* Pending tasks */}
      {pendingTasks.length > 0 && (
        <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm space-y-3">
          <h3 className="text-[10px] font-semibold uppercase tracking-widest text-foreground-muted">
            Tareas en progreso
          </h3>
          <div className="space-y-2">
            {pendingTasks.slice(0, 3).map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-2 group"
              >
                <button
                  onClick={() => handleStartTask(task.id)}
                  className="h-7 w-7 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 hover:bg-accent/20 transition-colors"
                >
                  <Play className="h-3 w-3 text-accent ml-0.5" />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium text-foreground truncate">{task.title}</p>
                  {task.client_name && (
                    <p className="text-[10px] text-foreground-muted truncate">{task.client_name}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* QuickSheet for task start */}
      <BitacoraQuickSheet
        open={quickSheetOpen}
        onOpenChange={(open) => {
          setQuickSheetOpen(open);
          if (!open) {
            setPreselectedTaskId(null);
            vm.refresh();
          }
        }}
        mode="start"
      />
    </div>
  );
}
