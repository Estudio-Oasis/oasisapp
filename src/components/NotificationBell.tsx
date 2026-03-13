import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/hooks/useRole";
import { Bell, X, Check, Clock, User, AlertTriangle } from "lucide-react";
import { getCompletenessLevel, getMissingFields } from "@/lib/clientCompleteness";

interface NotificationItem {
  id: string;
  type: "incomplete_client" | "time_gap";
  title: string;
  body: string;
  level?: "critical" | "incomplete";
  score?: number;
  link: string;
}

export function NotificationBell() {
  const { user } = useAuth();
  const { isAdmin } = useRole();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    if (!user) return;
    computeNotifications();
  }, [user, isAdmin]);

  const computeNotifications = async () => {
    if (!user) return;
    const items: NotificationItem[] = [];

    // Incomplete clients
    const { data: clients } = await supabase
      .from("clients")
      .select("id, name, completeness_score, email, phone, monthly_rate, contact_name, payment_method, communication_channel, billing_entity")
      .lt("completeness_score", 80);

    (clients || []).forEach((c) => {
      const level = getCompletenessLevel(c.completeness_score ?? 0);
      const missing = getMissingFields(c as Record<string, unknown>);
      if (level !== "complete") {
        items.push({
          id: `client-${c.id}`,
          type: "incomplete_client",
          title: `${c.name} is missing info`,
          body: missing.join(", "),
          level: level as "critical" | "incomplete",
          score: c.completeness_score ?? 0,
          link: `/clients/${c.id}`,
        });
      }
    });

    // Time gaps today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { data: entries } = await supabase
      .from("time_entries")
      .select("started_at, ended_at")
      .eq("user_id", user.id)
      .gte("started_at", today.toISOString())
      .order("started_at", { ascending: true });

    if (entries && entries.length > 0) {
      for (let i = 0; i < entries.length - 1; i++) {
        const end = entries[i].ended_at ? new Date(entries[i].ended_at!) : null;
        const nextStart = new Date(entries[i + 1].started_at);
        if (end) {
          const gapMin = (nextStart.getTime() - end.getTime()) / 60000;
          if (gapMin > 30) {
            const h = Math.floor(gapMin / 60);
            const m = Math.round(gapMin % 60);
            items.push({
              id: `gap-${i}`,
              type: "time_gap",
              title: `Untracked time · ${h > 0 ? `${h}h ` : ""}${m}m`,
              body: `Today, ${end.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} – ${nextStart.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`,
              link: "/timer",
            });
          }
        }
      }
    }

    setNotifications(items);
  };

  const count = notifications.length;

  return (
    <>
      {/* Bell button */}
      <button
        onClick={() => { setOpen(true); computeNotifications(); }}
        className="relative flex h-9 w-9 items-center justify-center rounded-md text-foreground-muted hover:text-foreground hover:bg-background-tertiary transition-colors mx-3"
      >
        <Bell className="h-[18px] w-[18px]" />
        {count > 0 && (
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
        )}
      </button>

      {/* Panel */}
      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-foreground/20" onClick={() => setOpen(false)} />
          <NotificationPanel notifications={notifications} onClose={() => setOpen(false)} />
        </>
      )}
    </>
  );
}

function NotificationPanel({ notifications, onClose }: { notifications: NotificationItem[]; onClose: () => void }) {
  const navigate = useNavigate();

  const incompleteClients = notifications.filter((n) => n.type === "incomplete_client");
  const timeGaps = notifications.filter((n) => n.type === "time_gap");

  return (
    <div className="fixed top-0 left-0 bottom-0 z-50 w-[320px] max-w-full bg-background border-r border-border overflow-y-auto shadow-lg">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-h2 text-foreground">Notifications</h2>
            {notifications.length > 0 && (
              <span className="bg-accent-light text-accent-foreground text-micro px-2 py-0.5 rounded-pill">
                {notifications.length} unread
              </span>
            )}
          </div>
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-md text-foreground-muted hover:text-foreground hover:bg-background-tertiary">
            <X className="h-4 w-4" />
          </button>
        </div>

        {notifications.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Check className="h-10 w-10 text-success mb-3" />
            <p className="text-sm text-foreground-secondary">All caught up!</p>
          </div>
        ) : (
          <>
            {incompleteClients.length > 0 && (
              <div className="mb-6">
                <p className="text-micro text-foreground-muted mb-2">Profile gaps</p>
                <div className="flex flex-col gap-2">
                  {incompleteClients.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => { navigate(n.link); onClose(); }}
                      className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-background-secondary transition-colors text-left w-full"
                    >
                      <User className={`h-4 w-4 shrink-0 mt-0.5 ${n.level === "critical" ? "text-destructive" : "text-accent"}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{n.title}</p>
                        <p className="text-small text-foreground-secondary truncate">{n.body}</p>
                      </div>
                      <span className={`text-micro px-1.5 py-0.5 rounded-pill shrink-0 ${n.level === "critical" ? "bg-destructive-light text-destructive" : "bg-accent-light text-accent-foreground"}`}>
                        {n.score}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {timeGaps.length > 0 && (
              <div>
                <p className="text-micro text-foreground-muted mb-2">Time gaps</p>
                <div className="flex flex-col gap-2">
                  {timeGaps.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => { navigate(n.link); onClose(); }}
                      className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-background-secondary transition-colors text-left w-full"
                    >
                      <Clock className="h-4 w-4 shrink-0 mt-0.5 text-accent" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{n.title}</p>
                        <p className="text-small text-foreground-secondary">{n.body}</p>
                      </div>
                      <span className="text-small text-accent font-medium shrink-0">Fill in →</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
