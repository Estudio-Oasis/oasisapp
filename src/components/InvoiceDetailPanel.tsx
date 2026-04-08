import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface InvoiceRow {
  id: string;
  number: string;
  client_id: string;
  amount: number;
  currency: string;
  status: string;
  due_date: string | null;
  paid_at: string | null;
  period_start?: string | null;
  period_end?: string | null;
  notes: string | null;
  created_at: string;
  client_name?: string;
}

interface InvoiceDetailPanelProps {
  invoice: InvoiceRow;
  onClose: () => void;
  onUpdated: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  draft: "Borrador",
  sent: "Enviada",
  paid: "Pagada",
  overdue: "Vencida",
};

export function InvoiceDetailPanel({ invoice, onClose, onUpdated }: InvoiceDetailPanelProps) {
  const [notes, setNotes] = useState(invoice.notes || "");
  const [saving, setSaving] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isEffectivelyOverdue =
    invoice.status === "overdue" ||
    (invoice.status === "sent" && invoice.due_date && new Date(invoice.due_date) < today);

  const updateStatus = async (status: "draft" | "sent" | "paid" | "overdue", extra?: Record<string, unknown>) => {
    setSaving(true);
    const { error } = await supabase
      .from("invoices")
      .update({ status, ...extra } as { status: string; paid_at?: string })
      .eq("id", invoice.id);
    setSaving(false);
    if (error) {
      toast.error("Error al actualizar la factura");
      return;
    }
    toast.success(`Factura marcada como ${STATUS_LABELS[status] || status}`);
    onUpdated();
  };

  const saveNotes = async () => {
    setSaving(true);
    await supabase.from("invoices").update({ notes: notes || null }).eq("id", invoice.id);
    setSaving(false);
    toast.success("Notas guardadas");
    onUpdated();
  };

  const deleteInvoice = async () => {
    if (!window.confirm("¿Eliminar esta factura? Esta acción no se puede deshacer.")) return;
    setSaving(true);
    await supabase.from("invoices").delete().eq("id", invoice.id);
    setSaving(false);
    toast.success("Factura eliminada");
    onUpdated();
    onClose();
  };

  const STATUS_BADGE: Record<string, string> = {
    draft: "bg-background-tertiary text-foreground-secondary",
    sent: "bg-accent-light text-accent-foreground",
    paid: "bg-success-light text-success",
    overdue: "bg-destructive-light text-destructive",
  };

  const displayStatus = isEffectivelyOverdue ? "overdue" : invoice.status;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-foreground/20" onClick={onClose} />
      <div className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-[400px] bg-background border-l border-border overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-h2 text-foreground">{invoice.number}</h2>
            <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-md text-foreground-muted hover:text-foreground hover:bg-background-tertiary">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_BADGE[displayStatus] || ""}`}>
                {STATUS_LABELS[displayStatus] || displayStatus}
              </span>
              {invoice.client_name && (
                <span className="text-sm text-foreground-secondary">{invoice.client_name}</span>
              )}
            </div>

            <div className="border border-border rounded-lg p-4">
              <p className="text-micro text-foreground-muted mb-1">Monto</p>
              <p className="text-h1 text-foreground">
                {invoice.currency} ${invoice.amount.toLocaleString()}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-micro text-foreground-muted mb-1">Fecha de vencimiento</p>
                <p className="text-sm text-foreground">
                  {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString("es-MX", { month: "short", day: "numeric", year: "numeric" }) : "Sin fecha"}
                </p>
              </div>
              <div>
                <p className="text-micro text-foreground-muted mb-1">Pagada el</p>
                <p className="text-sm text-foreground">
                  {invoice.paid_at ? new Date(invoice.paid_at).toLocaleDateString("es-MX", { month: "short", day: "numeric", year: "numeric" }) : "Sin pagar"}
                </p>
              </div>
            </div>

            {(invoice.period_start || invoice.period_end) && (
              <div>
                <p className="text-micro text-foreground-muted mb-1">Periodo</p>
                <p className="text-sm text-foreground">
                  {invoice.period_start ? new Date(invoice.period_start + "T00:00:00").toLocaleDateString("es-MX", { month: "short", day: "numeric" }) : "Sin fecha"}
                  {" → "}
                  {invoice.period_end ? new Date(invoice.period_end + "T00:00:00").toLocaleDateString("es-MX", { month: "short", day: "numeric", year: "numeric" }) : "Sin fecha"}
                </p>
              </div>
            )}

            <div className="h-px bg-border" />

            <div className="space-y-1.5">
              <label className="text-label">Notas</label>
              <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className="resize-none" />
              <Button variant="secondary" size="sm" onClick={saveNotes} disabled={saving}>
                Guardar notas
              </Button>
            </div>

            <div className="h-px bg-border" />

            <p className="text-micro text-foreground-muted">Acciones</p>
            <div className="flex flex-col gap-2">
              {invoice.status === "draft" && (
                <Button variant="secondary" className="justify-start" onClick={() => updateStatus("sent")} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Marcar como enviada
                </Button>
              )}
              {(invoice.status === "sent" || isEffectivelyOverdue) && (
                <Button variant="secondary" className="justify-start" onClick={() => updateStatus("paid", { paid_at: new Date().toISOString() })} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Marcar como pagada
                </Button>
              )}
              {invoice.status === "sent" && !isEffectivelyOverdue && (
                <Button variant="secondary" className="justify-start" onClick={() => updateStatus("overdue")} disabled={saving}>
                  Marcar como vencida
                </Button>
              )}
            </div>

            <div className="h-px bg-border" />

            <button onClick={deleteInvoice} className="text-sm text-destructive hover:underline text-left" disabled={saving}>
              Eliminar factura
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
