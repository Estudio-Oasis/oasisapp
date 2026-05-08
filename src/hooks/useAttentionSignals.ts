import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Severity = "info" | "warn" | "risk";

export interface AttentionSignal {
  id: string;
  severity: Severity;
  title: string;
  why: string;
  category: "person" | "work" | "client" | "money";
  actions: { label: string; kind: "snooze" | "message" | "view"; target?: string }[];
  createdAt: number;
}

interface OperationalData {
  profiles: any[];
  agencies: any[];
  timeEntries: any[];
  tasks: any[];
  clients: any[];
  invoices: any[];
  quotes: any[];
  payments: any[];
  presence: any[];
}

const SNOOZE_KEY = "oasis.comando.snoozes.v1";

function getSnoozes(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(SNOOZE_KEY) || "{}");
  } catch {
    return {};
  }
}

export function snoozeSignal(id: string, hours = 4) {
  const snoozes = getSnoozes();
  snoozes[id] = Date.now() + hours * 60 * 60 * 1000;
  localStorage.setItem(SNOOZE_KEY, JSON.stringify(snoozes));
  window.dispatchEvent(new Event("comando:snooze"));
}

export function useOperationalData() {
  const [data, setData] = useState<OperationalData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [profiles, agencies, timeEntries, tasks, clients, invoices, quotes, payments, presence] =
        await Promise.all([
          supabase.from("profiles").select("id, name, avatar_url, agency_id, role, job_title, work_start_hour, work_end_hour"),
          supabase.from("agencies").select("id, name, plan"),
          supabase.from("time_entries").select("id, user_id, client_id, project_id, task_id, started_at, ended_at, duration_min, description").gte("started_at", new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()).order("started_at", { ascending: false }),
          supabase.from("tasks").select("id, title, status, assignee_id, client_id, due_date, updated_at, priority"),
          supabase.from("clients").select("id, name, agency_id, monthly_rate, currency, status"),
          supabase.from("invoices").select("id, number, client_id, amount, currency, status, due_date, paid_at"),
          supabase.from("quotes").select("id, title, client_id, status, valid_until, total_amount, currency, sent_at, agency_id"),
          supabase.from("payments").select("id, client_id, amount_received, currency_received, date_received").gte("date_received", new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)),
          supabase.from("member_presence").select("user_id, status, last_seen_at, current_client, current_task"),
        ]);

      if (cancelled) return;
      setData({
        profiles: profiles.data || [],
        agencies: agencies.data || [],
        timeEntries: timeEntries.data || [],
        tasks: tasks.data || [],
        clients: clients.data || [],
        invoices: invoices.data || [],
        quotes: quotes.data || [],
        payments: payments.data || [],
        presence: presence.data || [],
      });
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { data, loading };
}

export function useAttentionSignals(data: OperationalData | null): AttentionSignal[] {
  const [snoozeBump, setSnoozeBump] = useState(0);

  useEffect(() => {
    const onSnooze = () => setSnoozeBump((s) => s + 1);
    window.addEventListener("comando:snooze", onSnooze);
    return () => window.removeEventListener("comando:snooze", onSnooze);
  }, []);

  return useMemo(() => {
    if (!data) return [];
    const signals: AttentionSignal[] = [];
    const now = Date.now();
    const profilesById = new Map(data.profiles.map((p) => [p.id, p]));
    const clientsById = new Map(data.clients.map((c) => [c.id, c]));

    // 1. Fatigue: active time entry > 6h
    for (const te of data.timeEntries.filter((t) => !t.ended_at)) {
      const started = new Date(te.started_at).getTime();
      const hours = (now - started) / 3_600_000;
      if (hours >= 6) {
        const p = profilesById.get(te.user_id);
        signals.push({
          id: `fatigue-${te.id}`,
          severity: hours >= 9 ? "risk" : "warn",
          title: `${p?.name || "Alguien"}: ${hours.toFixed(1)}h sin pausa`,
          why: "Sesión activa larga — probable fatiga o timer olvidado.",
          category: "person",
          actions: [
            { label: "Snooze 4h", kind: "snooze" },
            { label: "Mensaje", kind: "message", target: te.user_id },
          ],
          createdAt: started,
        });
      }
    }

    // 2. Stuck task: in_progress > 3 days without recent time entry
    const cutoff = now - 3 * 24 * 60 * 60 * 1000;
    for (const t of data.tasks.filter((x) => x.status === "in_progress")) {
      const lastTouch = new Date(t.updated_at).getTime();
      if (lastTouch < cutoff) {
        const recent = data.timeEntries.find((te) => te.task_id === t.id && new Date(te.started_at).getTime() > cutoff);
        if (!recent) {
          const days = Math.floor((now - lastTouch) / 86_400_000);
          const c = clientsById.get(t.client_id);
          signals.push({
            id: `stuck-${t.id}`,
            severity: days >= 7 ? "risk" : "warn",
            title: `Tarea "${t.title}" · ${days}d en progreso`,
            why: c ? `Cliente: ${c.name}. Sin movimiento reciente.` : "Sin movimiento reciente.",
            category: "work",
            actions: [
              { label: "Snooze 4h", kind: "snooze" },
              { label: "Ver", kind: "view", target: `/tasks` },
            ],
            createdAt: lastTouch,
          });
        }
      }
    }

    // 3. Client over budget: this week's hours > expected based on monthly_rate hourly cap
    // Heuristic: weekly budget = monthly_rate / 4.33 / avg hourly rate (use $50 as floor)
    const weekStart = now - 7 * 24 * 60 * 60 * 1000;
    const hoursByClient = new Map<string, number>();
    for (const te of data.timeEntries) {
      if (!te.client_id || !te.duration_min) continue;
      if (new Date(te.started_at).getTime() < weekStart) continue;
      hoursByClient.set(te.client_id, (hoursByClient.get(te.client_id) || 0) + Number(te.duration_min) / 60);
    }
    for (const [clientId, hours] of hoursByClient.entries()) {
      const c = clientsById.get(clientId);
      if (!c?.monthly_rate || Number(c.monthly_rate) <= 0) continue;
      const weeklyBudgetHours = Number(c.monthly_rate) / 4.33 / 50;
      if (weeklyBudgetHours <= 0) continue;
      const ratio = hours / weeklyBudgetHours;
      if (ratio > 1.1) {
        const pct = Math.round((ratio - 1) * 100);
        signals.push({
          id: `budget-${clientId}-${Math.floor(now / 86_400_000)}`,
          severity: ratio > 1.3 ? "risk" : "warn",
          title: `${c.name}: +${pct}% vs budget semanal`,
          why: `${hours.toFixed(1)}h registradas / ${weeklyBudgetHours.toFixed(1)}h estimadas.`,
          category: "client",
          actions: [
            { label: "Snooze 4h", kind: "snooze" },
            { label: "Ver cliente", kind: "view", target: `/clients/${clientId}` },
          ],
          createdAt: now,
        });
      }
    }

    // 4. Overdue invoices
    const today = new Date().toISOString().slice(0, 10);
    for (const inv of data.invoices) {
      if (inv.status === "paid") continue;
      if (!inv.due_date || inv.due_date >= today) continue;
      const c = clientsById.get(inv.client_id);
      const days = Math.floor((now - new Date(inv.due_date).getTime()) / 86_400_000);
      signals.push({
        id: `overdue-${inv.id}`,
        severity: days >= 14 ? "risk" : "warn",
        title: `Factura ${inv.number} vencida · ${days}d`,
        why: `${c?.name || "Cliente"} · ${new Intl.NumberFormat("es-MX", { style: "currency", currency: inv.currency || "USD" }).format(Number(inv.amount))}`,
        category: "money",
        actions: [
          { label: "Snooze 4h", kind: "snooze" },
          { label: "Ver", kind: "view", target: "/finances" },
        ],
        createdAt: new Date(inv.due_date).getTime(),
      });
    }

    // 5. Quotes pending response > 7 days
    for (const q of data.quotes.filter((x) => x.status === "sent" && x.sent_at)) {
      const sentAt = new Date(q.sent_at).getTime();
      const daysSent = (now - sentAt) / 86_400_000;
      if (daysSent > 7) {
        const c = clientsById.get(q.client_id);
        signals.push({
          id: `quote-${q.id}`,
          severity: "info",
          title: `Cotización "${q.title}" sin respuesta · ${Math.floor(daysSent)}d`,
          why: c ? `${c.name} · seguimiento sugerido.` : "Seguimiento sugerido.",
          category: "money",
          actions: [
            { label: "Snooze 4h", kind: "snooze" },
            { label: "Ver", kind: "view", target: "/quotes" },
          ],
          createdAt: sentAt,
        });
      }
    }

    // Filter snoozed
    const snoozes = getSnoozes();
    const filtered = signals.filter((s) => !snoozes[s.id] || snoozes[s.id] < now);

    // Sort: risk > warn > info, then most recent
    const sevRank = { risk: 0, warn: 1, info: 2 } as const;
    filtered.sort((a, b) => sevRank[a.severity] - sevRank[b.severity] || b.createdAt - a.createdAt);
    return filtered;
  }, [data, snoozeBump]);
}
