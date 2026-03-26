import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatDuration, getClientColor, startOfDay } from "@/lib/timer-utils";
import { getNormalizedActivityType, getActivityConfig } from "@/components/timer/ActivityConstants";
import { Sun, AlertTriangle, Users, ChevronRight, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface MorningBriefingProps {
  onStartDay: () => void;
  onFillGaps?: () => void;
}

interface YesterdaySummary {
  totalMin: number;
  productiveMin: number;
  topClient: { name: string; minutes: number } | null;
  gapCount: number;
  gapMinutes: number;
  isNewUser: boolean;
  referenceDay: Date;
  isWeekSummary: boolean;
}

interface TeamMember {
  name: string;
  status: string;
  activity: string | null;
  avatarUrl: string | null;
}

export function MorningBriefing({ onStartDay, onFillGaps }: MorningBriefingProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [summary, setSummary] = useState<YesterdaySummary | null>(null);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadSummary();
    loadTeam();
  }, [user]);

  async function loadSummary() {
    if (!user) return;
    
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon...
    
    // Find reference day: yesterday, or last Friday if Monday, or find last day with data
    let refDay = new Date(today);
    let isWeekSummary = false;
    
    if (dayOfWeek === 1) {
      // Monday: check last week
      isWeekSummary = true;
      refDay.setDate(refDay.getDate() - 3); // Friday
    } else if (dayOfWeek === 0) {
      refDay.setDate(refDay.getDate() - 2); // Friday
    } else {
      refDay.setDate(refDay.getDate() - 1); // Yesterday
    }

    const rangeStart = isWeekSummary
      ? new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7)
      : startOfDay(refDay);
    const rangeEnd = isWeekSummary
      ? startOfDay(today)
      : new Date(startOfDay(refDay).getTime() + 86400000);

    const { data: entries } = await supabase
      .from("time_entries")
      .select("description, client_id, duration_min, started_at, ended_at, clients(name)")
      .eq("user_id", user.id)
      .not("ended_at", "is", null)
      .gte("started_at", rangeStart.toISOString())
      .lt("started_at", rangeEnd.toISOString())
      .order("started_at", { ascending: true });

    if (!entries || entries.length === 0) {
      // Check if new user (no entries at all)
      const { count } = await supabase
        .from("time_entries")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);
      
      setSummary({
        totalMin: 0,
        productiveMin: 0,
        topClient: null,
        gapCount: 0,
        gapMinutes: 0,
        isNewUser: (count || 0) === 0,
        referenceDay: refDay,
        isWeekSummary,
      });
      setLoading(false);
      return;
    }

    let totalMin = 0;
    let productiveMin = 0;
    const clientMinutes: Record<string, number> = {};

    entries.forEach((e: any) => {
      const dur = Number(e.duration_min) || 0;
      totalMin += dur;
      const type = getNormalizedActivityType(e);
      const config = getActivityConfig(type);
      if (config.productive) productiveMin += dur;
      const cName = (e.clients as any)?.name;
      if (cName) {
        clientMinutes[cName] = (clientMinutes[cName] || 0) + dur;
      }
    });

    // Detect gaps (simplified: for yesterday only)
    let gapCount = 0;
    let gapMinutes = 0;
    if (!isWeekSummary) {
      const sorted = [...entries].sort(
        (a: any, b: any) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime()
      );
      for (let i = 0; i < sorted.length - 1; i++) {
        const currEnd = new Date((sorted[i] as any).ended_at);
        const nextStart = new Date((sorted[i + 1] as any).started_at);
        const gapMin = Math.round((nextStart.getTime() - currEnd.getTime()) / 60000);
        if (gapMin > 30) {
          gapCount++;
          gapMinutes += gapMin;
        }
      }
    }

    const topClientEntry = Object.entries(clientMinutes).sort((a, b) => b[1] - a[1])[0];

    setSummary({
      totalMin,
      productiveMin,
      topClient: topClientEntry ? { name: topClientEntry[0], minutes: topClientEntry[1] } : null,
      gapCount,
      gapMinutes,
      isNewUser: false,
      referenceDay: refDay,
      isWeekSummary,
    });
    setLoading(false);
  }

  async function loadTeam() {
    if (!user) return;
    const { data: presence } = await supabase
      .from("member_presence")
      .select("user_id, status, current_task")
      .neq("user_id", user.id)
      .neq("status", "offline")
      .limit(3);

    if (!presence || presence.length === 0) {
      setTeam([]);
      return;
    }

    const userIds = presence.map((p) => p.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, name, avatar_url")
      .in("id", userIds);

    const members: TeamMember[] = presence.map((p) => {
      const prof = profiles?.find((pr) => pr.id === p.user_id);
      return {
        name: prof?.name || "?",
        status: p.status,
        activity: p.current_task,
        avatarUrl: prof?.avatar_url || null,
      };
    });
    setTeam(members);
    setLoading(false);
  }

  if (loading && !summary) return null;

  // New user: welcome card
  if (summary?.isNewUser) {
    return (
      <div className="rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/10 via-card to-card p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-accent/20 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">
              {t("briefing.welcomeTitle" as any) || "Bienvenido a Bitacora"}
            </h3>
            <p className="text-xs text-foreground-secondary">
              {t("briefing.welcomeSubtitle" as any) || "Registra tu primera actividad para empezar a ver tu operacion."}
            </p>
          </div>
        </div>
        <button
          onClick={onStartDay}
          className="w-full h-11 rounded-xl bg-accent text-accent-foreground text-sm font-semibold hover:bg-accent/90 transition-colors"
        >
          {t("briefing.firstActivity" as any) || "Registrar mi primera actividad"}
        </button>
      </div>
    );
  }

  if (!summary) return null;

  const productivePct = summary.totalMin > 0
    ? Math.round((summary.productiveMin / summary.totalMin) * 100)
    : 0;

  const refLabel = summary.isWeekSummary
    ? (t("briefing.lastWeek" as any) || "La semana pasada")
    : (t("briefing.yesterday" as any) || "Ayer");

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Header with big number */}
      <div className="px-5 pt-5 pb-3 space-y-3">
        <div className="flex items-center gap-2">
          <Sun className="h-4 w-4 text-accent" />
          <span className="text-xs font-semibold text-accent uppercase tracking-wider">
            {t("briefing.title" as any) || "Tu briefing"}
          </span>
        </div>

        {summary.totalMin > 0 ? (
          <>
            {/* Main stat */}
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black text-foreground tabular-nums tracking-tight">
                {formatDuration(summary.totalMin)}
              </span>
              <span className="text-sm text-foreground-secondary">
                {refLabel} · {productivePct}% {t("briefing.billable" as any) || "facturable"}
              </span>
            </div>

            {/* Top client */}
            {summary.topClient && (
              <div className="flex items-center gap-2">
                <div
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: getClientColor(summary.topClient.name) }}
                />
                <span className="text-xs text-foreground-secondary">
                  {t("briefing.topClient" as any) || "Cliente principal"}: <span className="font-semibold text-foreground">{summary.topClient.name}</span>
                  {" "}({formatDuration(summary.topClient.minutes)})
                </span>
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-foreground-secondary">
            {t("briefing.noDataYesterday" as any) || "Sin registros del dia anterior. Empieza tu dia registrando tu actividad."}
          </p>
        )}

        {/* Gaps warning */}
        {summary.gapCount > 0 && (
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
            <span className="text-xs text-amber-200/90">
              {summary.gapCount} {summary.gapCount === 1 ? "hueco" : "huecos"} sin registrar ({formatDuration(summary.gapMinutes)} potencial no facturado)
            </span>
          </div>
        )}

        {/* Team status */}
        {team.length > 0 && (
          <div className="flex items-center gap-2 pt-1">
            <Users className="h-3.5 w-3.5 text-foreground-muted shrink-0" />
            <div className="flex items-center gap-1.5">
              {team.map((m, i) => (
                <div key={i} className="flex items-center gap-1" title={`${m.name}: ${m.activity || m.status}`}>
                  <Avatar className="h-5 w-5">
                    <AvatarFallback className="text-[9px] bg-background-tertiary">
                      {(m.name || "?").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-[10px] text-foreground-secondary truncate max-w-[80px]">
                    {m.name?.split(" ")[0]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CTAs */}
      <div className="px-5 pb-4 pt-1 flex gap-2">
        <button
          onClick={onStartDay}
          className="flex-1 h-11 rounded-xl bg-accent text-accent-foreground text-sm font-semibold hover:bg-accent/90 transition-colors flex items-center justify-center gap-2"
        >
          {t("briefing.startDay" as any) || "Empezar mi dia"}
          <ChevronRight className="h-4 w-4" />
        </button>
        {summary.gapCount > 0 && onFillGaps && (
          <button
            onClick={onFillGaps}
            className="h-11 px-4 rounded-xl border border-amber-500/30 text-amber-400 text-xs font-medium hover:bg-amber-500/10 transition-colors"
          >
            {t("briefing.fillGaps" as any) || "Completar huecos"}
          </button>
        )}
      </div>
    </div>
  );
}
