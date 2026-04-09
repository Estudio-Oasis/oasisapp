import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { WidgetCard } from "@/components/ui/widget-card";
import { Clock, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Gap {
  start: string;
  end: string;
  minutes: number;
}

export function GapsWidget() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [gaps, setGaps] = useState<Gap[]>([]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const { data: entries } = await supabase
        .from("time_entries")
        .select("started_at, ended_at")
        .eq("user_id", user.id)
        .gte("started_at", todayStart.toISOString())
        .lte("started_at", todayEnd.toISOString())
        .not("ended_at", "is", null)
        .order("started_at", { ascending: true });

      if (!entries || entries.length < 2) { setGaps([]); return; }

      const found: Gap[] = [];
      for (let i = 1; i < entries.length; i++) {
        const prevEnd = new Date(entries[i - 1].ended_at!);
        const currStart = new Date(entries[i].started_at);
        const diffMin = (currStart.getTime() - prevEnd.getTime()) / 60000;
        if (diffMin >= 15) {
          found.push({
            start: prevEnd.toISOString(),
            end: currStart.toISOString(),
            minutes: Math.round(diffMin),
          });
        }
      }
      setGaps(found);
    };
    load();
  }, [user?.id]);

  if (gaps.length === 0) return null;

  const totalMinutes = gaps.reduce((s, g) => s + g.minutes, 0);

  return (
    <WidgetCard title="Huecos sin registrar" icon={AlertTriangle} accent="red">
      <div className="space-y-1.5">
        <p className="text-sm text-foreground-secondary">
          Tienes <span className="font-semibold text-destructive">{totalMinutes} min</span> sin registrar hoy
        </p>
        {gaps.slice(0, 3).map((g, i) => {
          const start = new Date(g.start);
          const end = new Date(g.end);
          return (
            <div key={i} className="flex items-center justify-between text-xs px-2 py-1.5 rounded-lg bg-destructive/5">
              <span className="text-foreground-secondary">
                {start.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })} — {end.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
              </span>
              <span className="text-destructive font-medium">{g.minutes} min</span>
            </div>
          );
        })}
        <button
          onClick={() => navigate("/bitacora")}
          className="text-[11px] font-medium text-accent hover:text-accent/80 transition-colors"
        >
          Rellenar en Bitácora →
        </button>
      </div>
    </WidgetCard>
  );
}
