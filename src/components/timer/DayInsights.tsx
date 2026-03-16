import { formatDuration } from "@/lib/timer-utils";
import {
  getNormalizedActivityType,
  getActivityConfig,
  UI_COPY,
  type ActivityType,
} from "./ActivityConstants";
import { Clock, TrendingUp, Briefcase, AlertTriangle } from "lucide-react";

interface EntryLike {
  description?: string | null;
  client_id?: string | null;
  duration_min?: number | null;
  clients?: { name: string } | null;
}

interface DayInsightsProps {
  entries: EntryLike[];
  gapCount: number;
}

export function DayInsights({ entries, gapCount }: DayInsightsProps) {
  if (entries.length === 0) return null;

  const totalMin = entries.reduce((s, e) => s + (Number(e.duration_min) || 0), 0);

  let productiveMin = 0;
  const clientMinutes: Record<string, number> = {};
  const typeMinutes: Record<string, number> = {};

  entries.forEach((e) => {
    const type = getNormalizedActivityType(e);
    const config = getActivityConfig(type);
    const dur = Number(e.duration_min) || 0;

    if (config.productive) productiveMin += dur;

    const cName = e.clients?.name || "Interno";
    clientMinutes[cName] = (clientMinutes[cName] || 0) + dur;

    typeMinutes[type] = (typeMinutes[type] || 0) + dur;
  });

  const productivePct = totalMin > 0 ? Math.round((productiveMin / totalMin) * 100) : 0;
  const topClient = Object.entries(clientMinutes).sort((a, b) => b[1] - a[1])[0];
  const topType = Object.entries(typeMinutes).sort((a, b) => b[1] - a[1])[0];
  const hasClientDominance = topClient && topClient[0] !== "Interno";

  const insights: { icon: typeof Clock; label: string; value: string }[] = [
    { icon: Clock, label: UI_COPY.insightTotalLabel, value: formatDuration(totalMin) },
    { icon: TrendingUp, label: UI_COPY.insightProductiveLabel, value: `${productivePct}%` },
    hasClientDominance
      ? {
          icon: Briefcase,
          label: UI_COPY.insightTopClientLabel,
          value: topClient[0].length > 12 ? topClient[0].slice(0, 12) + "…" : topClient[0],
        }
      : {
          icon: Briefcase,
          label: UI_COPY.insightTopActivityLabel,
          value: topType ? getActivityConfig(topType[0] as ActivityType).label : "—",
        },
  ];

  if (gapCount > 0) {
    insights.push({ icon: AlertTriangle, label: UI_COPY.insightGapsLabel, value: String(gapCount) });
  }

  return (
    <div className="flex items-center gap-4 flex-wrap">
      {insights.map((item, i) => {
        const IIcon = item.icon;
        return (
          <div key={i} className="flex items-center gap-1.5">
            <IIcon className="h-3 w-3 text-foreground-muted shrink-0" />
            <span className="text-[11px] text-foreground-secondary">
              {item.label}
            </span>
            <span className="text-[11px] font-semibold text-foreground tabular-nums">
              {item.value}
            </span>
          </div>
        );
      })}
    </div>
  );
}
