import { useMemo } from "react";
import { formatDuration, getClientColor } from "@/lib/timer-utils";
import { getNormalizedActivityType, getActivityConfig, type ActivityType } from "@/components/timer/ActivityConstants";
import { ClipboardCopy, ChevronDown, ChevronUp, BarChart3, Clock, TrendingUp, Users, AlertTriangle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { useState } from "react";

interface EntryLike {
  description?: string | null;
  client_id?: string | null;
  duration_min?: number | null;
  clients?: { name: string } | null;
  started_at: string;
  ended_at?: string | null;
}

interface DailyDigestProps {
  entries: EntryLike[];
  gapCount: number;
  gapMinutes?: number;
  date?: Date;
  onFillGaps?: () => void;
}

export function DailyDigest({ entries, gapCount, gapMinutes = 0, date, onFillGaps }: DailyDigestProps) {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);

  const stats = useMemo(() => {
    let totalMin = 0;
    let productiveMin = 0;
    const clientMinutes: Record<string, number> = {};
    const clientSet = new Set<string>();

    entries.forEach((e) => {
      const dur = Number(e.duration_min) || 0;
      totalMin += dur;
      const type = getNormalizedActivityType(e);
      const config = getActivityConfig(type);
      if (config.productive) productiveMin += dur;
      const cName = e.clients?.name;
      if (cName) {
        clientSet.add(cName);
        clientMinutes[cName] = (clientMinutes[cName] || 0) + dur;
      }
    });

    const productivePct = totalMin > 0 ? Math.round((productiveMin / totalMin) * 100) : 0;
    const sortedClients = Object.entries(clientMinutes).sort((a, b) => b[1] - a[1]);
    const maxClientMin = sortedClients[0]?.[1] || 1;

    // Insight
    let insight = "";
    const adminTypes: ActivityType[] = ["administracion", "reunion"];
    let adminMin = 0;
    entries.forEach((e) => {
      const type = getNormalizedActivityType(e);
      if (adminTypes.includes(type)) adminMin += Number(e.duration_min) || 0;
    });
    const adminPct = totalMin > 0 ? Math.round((adminMin / totalMin) * 100) : 0;

    if (productivePct >= 80) {
      insight = t("digest.insightGreatDay" as any) || "Gran dia productivo. 🎯";
    } else if (adminPct > 30) {
      insight = t("digest.insightTooMuchAdmin" as any) || `Mas del ${adminPct}% de tu dia fue administracion. ¿Puedes delegar algo?`;
    } else if (gapCount > 2) {
      insight = t("digest.insightGaps" as any) || `Tuviste ${gapCount} huecos sin registrar. Completarlos mejora tu facturacion.`;
    } else if (sortedClients[0] && totalMin > 0) {
      const topPct = Math.round((sortedClients[0][1] / totalMin) * 100);
      if (topPct > 60) {
        insight = `${sortedClients[0][0]} consumio la mayor parte de tu dia (${topPct}%).`;
      }
    }

    return { totalMin, productiveMin, productivePct, clientCount: clientSet.size, sortedClients, maxClientMin, insight };
  }, [entries, gapCount, t]);

  if (entries.length === 0) return null;

  const displayDate = date || new Date();
  const dateStr = displayDate.toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const handleShare = () => {
    let text = `📋 Mi dia - ${dateStr}\n`;
    text += `Total: ${formatDuration(stats.totalMin)} · Facturable: ${formatDuration(stats.productiveMin)} (${stats.productivePct}%)\n`;
    stats.sortedClients.forEach(([name, min]) => {
      text += `  ${name}: ${formatDuration(min)}\n`;
    });
    if (gapCount > 0) text += `⚠️ ${gapCount} huecos sin registrar\n`;
    if (stats.insight) text += `💡 ${stats.insight}\n`;
    navigator.clipboard.writeText(text);
    toast.success(t("digest.copied" as any) || "Resumen copiado al portapapeles");
  };

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-background-secondary/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-accent" />
          <span className="text-xs font-semibold text-accent uppercase tracking-wider">
            {t("digest.title" as any) || "Resumen del dia"}
          </span>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-foreground-muted" /> : <ChevronDown className="h-4 w-4 text-foreground-muted" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
          {/* Date */}
          <p className="text-xs text-foreground-secondary capitalize">{dateStr}</p>

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { icon: Clock, label: t("digest.totalLogged" as any) || "Total", value: formatDuration(stats.totalMin) },
              { icon: TrendingUp, label: t("digest.billable" as any) || "Facturable", value: `${formatDuration(stats.productiveMin)} (${stats.productivePct}%)` },
              { icon: Users, label: t("digest.clients" as any) || "Clientes", value: String(stats.clientCount) },
              { icon: AlertTriangle, label: "Gaps", value: gapCount > 0 ? `${gapCount} (${formatDuration(gapMinutes)})` : "0" },
            ].map((s, i) => {
              const SIcon = s.icon;
              return (
                <div key={i} className="space-y-0.5">
                  <div className="flex items-center gap-1">
                    <SIcon className="h-3 w-3 text-foreground-muted" />
                    <span className="text-[10px] text-foreground-muted">{s.label}</span>
                  </div>
                  <p className="text-xs font-bold text-foreground tabular-nums">{s.value}</p>
                </div>
              );
            })}
          </div>

          {/* Client breakdown bars */}
          {stats.sortedClients.length > 0 && (
            <div className="space-y-1.5">
              {stats.sortedClients.map(([name, min]) => {
                const pct = Math.round((min / stats.maxClientMin) * 100);
                return (
                  <div key={name} className="flex items-center gap-2">
                    <span className="text-[11px] text-foreground-secondary w-28 truncate text-right">{name}</span>
                    <div className="flex-1 h-4 bg-background-tertiary rounded-sm overflow-hidden">
                      <div
                        className="h-full rounded-sm transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: getClientColor(name),
                          minWidth: "4px",
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-foreground-muted tabular-nums w-14 text-right">
                      {formatDuration(min)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Insight */}
          {stats.insight && (
            <div className="bg-accent/5 border border-accent/20 rounded-lg px-3 py-2">
              <p className="text-xs text-foreground-secondary">💡 {stats.insight}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            {gapCount > 0 && onFillGaps && (
              <button
                onClick={onFillGaps}
                className="flex-1 h-8 rounded-lg border border-amber-500/30 text-amber-400 text-[11px] font-medium hover:bg-amber-500/10 transition-colors"
              >
                {t("briefing.fillGaps" as any) || "Completar huecos"}
              </button>
            )}
            <button
              onClick={handleShare}
              className="h-8 px-3 rounded-lg border border-border text-foreground-secondary text-[11px] font-medium hover:bg-background-secondary transition-colors flex items-center gap-1.5"
            >
              <ClipboardCopy className="h-3 w-3" />
              {t("digest.share" as any) || "Compartir"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
