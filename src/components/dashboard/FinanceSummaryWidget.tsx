import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { WidgetCard } from "@/components/ui/widget-card";
import { DollarSign, TrendingUp, AlertCircle, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getClientColor } from "@/lib/timer-utils";

interface PaymentMin {
  id: string;
  amount_received: number;
  currency_received: string;
  date_received: string;
  client_id: string;
}

interface InvoiceMin {
  id: string;
  number: string;
  amount: number;
  currency: string;
  due_date: string | null;
  status: string;
  client_id: string;
}

export function FinanceSummaryWidget() {
  const navigate = useNavigate();
  const [payments, setPayments] = useState<PaymentMin[]>([]);
  const [invoices, setInvoices] = useState<InvoiceMin[]>([]);
  const [clients, setClients] = useState<Record<string, string>>({});
  const [mrr, setMrr] = useState(0);

  useEffect(() => {
    const load = async () => {
      const [payRes, invRes, cliRes] = await Promise.all([
        supabase.from("payments").select("id, amount_received, currency_received, date_received, client_id").order("date_received", { ascending: false }).limit(5),
        supabase.from("invoices").select("id, number, amount, currency, due_date, status, client_id").in("status", ["sent", "overdue"]).order("due_date", { ascending: true }).limit(5),
        supabase.from("clients").select("id, name, monthly_rate").eq("status", "active"),
      ]);
      setPayments((payRes.data || []) as PaymentMin[]);
      setInvoices((invRes.data || []) as InvoiceMin[]);
      const map: Record<string, string> = {};
      let total = 0;
      ((cliRes.data || []) as { id: string; name: string; monthly_rate: number | null }[]).forEach(c => {
        map[c.id] = c.name;
        total += c.monthly_rate || 0;
      });
      setClients(map);
      setMrr(total);
    };
    load();
  }, []);

  const collectedThisMonth = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    return payments
      .filter(p => new Date(p.date_received + "T00:00:00") >= monthStart)
      .reduce((s, p) => s + p.amount_received, 0);
  }, [payments]);

  return (
    <WidgetCard title="Finanzas" icon={DollarSign} action={{ label: "Ver todo →", onClick: () => navigate("/finances") }}>
      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-xl border border-border/40 bg-background-secondary/50 p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp className="h-3.5 w-3.5 text-foreground-muted" />
            <span className="text-[10px] text-foreground-muted uppercase">MRR</span>
          </div>
          <p className="text-lg font-bold text-foreground">${mrr.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-border/40 bg-background-secondary/50 p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <DollarSign className="h-3.5 w-3.5 text-foreground-muted" />
            <span className="text-[10px] text-foreground-muted uppercase">Este mes</span>
          </div>
          <p className="text-lg font-bold text-foreground">${collectedThisMonth.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      {/* Pending invoices */}
      {invoices.length > 0 && (
        <div className="mb-3">
          <p className="text-[10px] font-semibold uppercase text-foreground-muted mb-1.5 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" /> Por cobrar
          </p>
          <div className="space-y-1">
            {invoices.slice(0, 3).map(inv => {
              const isOverdue = inv.due_date && new Date(inv.due_date) < new Date();
              return (
                <div key={inv.id} className="flex items-center justify-between text-sm py-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className={`text-foreground-secondary truncate ${isOverdue ? "text-destructive font-medium" : ""}`}>
                      {clients[inv.client_id] || inv.number}
                    </span>
                    {isOverdue && <span className="text-[9px] text-destructive font-bold">VENCIDA</span>}
                  </div>
                  <span className="font-semibold text-foreground shrink-0">${inv.amount.toLocaleString()}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent payments */}
      {payments.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase text-foreground-muted mb-1.5">Últimos pagos</p>
          <div className="space-y-1">
            {payments.slice(0, 3).map(p => (
              <div key={p.id} className="flex items-center justify-between text-sm py-1">
                <span className="text-foreground-secondary truncate">
                  {clients[p.client_id] || "—"} · {new Date(p.date_received + "T00:00:00").toLocaleDateString("es-MX", { month: "short", day: "numeric" })}
                </span>
                <span className="font-semibold text-success shrink-0">+${p.amount_received.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </WidgetCard>
  );
}
