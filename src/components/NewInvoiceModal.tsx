import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type Client = Tables<"clients">;

interface NewInvoiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
  prefillClientId?: string;
}

export function NewInvoiceModal({ open, onOpenChange, onCreated, prefillClientId }: NewInvoiceModalProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState(prefillClientId || "");
  const [number, setNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [dueDate, setDueDate] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setClientId(prefillClientId || "");
    setAmount("");
    setDueDate("");
    setPeriodStart("");
    setPeriodEnd("");
    setNotes("");

    const now = new Date();
    const y = now.getFullYear();
    const n = String(Math.floor(Math.random() * 900) + 100);
    setNumber(`INV-${y}-${n}`);

    supabase
      .from("clients")
      .select("*")
      .eq("status", "active")
      .order("name")
      .then(({ data }) => {
        setClients(data || []);
        if (prefillClientId && data) {
          const c = data.find((cl) => cl.id === prefillClientId);
          if (c) setCurrency(c.currency || "USD");
        }
      });
  }, [open, prefillClientId]);

  useEffect(() => {
    if (!clientId) return;
    const c = clients.find((cl) => cl.id === clientId);
    if (c) setCurrency(c.currency || "USD");
  }, [clientId, clients]);

  const handleCreate = async (markSent: boolean) => {
    if (!clientId || !number.trim() || !amount) return;
    setSaving(true);

    const insertData: Record<string, unknown> = {
      client_id: clientId,
      number: number.trim(),
      amount: parseFloat(amount),
      currency,
      due_date: dueDate || null,
      period_start: periodStart || null,
      period_end: periodEnd || null,
      notes: notes || null,
      status: markSent ? "sent" as const : "draft" as const,
    };
    const { error } = await supabase.from("invoices").insert(insertData as never);

    setSaving(false);
    if (error) {
      toast.error("Error al crear la factura");
      return;
    }
    toast.success(markSent ? "Factura creada y marcada como enviada" : "Factura creada como borrador");
    onCreated();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px] p-6 gap-0 border-border">
        <DialogHeader className="pb-0">
          <DialogTitle className="text-h3">Nueva factura</DialogTitle>
        </DialogHeader>

        <div className="mt-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-label">Cliente</label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger><SelectValue placeholder="Selecciona un cliente..." /></SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-label">Factura #</label>
              <Input value={number} onChange={(e) => setNumber(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-label">Moneda</label>
              <Input value={currency} onChange={(e) => setCurrency(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-label">Monto</label>
              <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
            </div>
            <div className="space-y-1.5">
              <label className="text-label">Fecha de vencimiento</label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-label">Periodo desde (opcional)</label>
              <Input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-label">Periodo hasta (opcional)</label>
              <Input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-label">Notas (opcional)</label>
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className="resize-none" />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button variant="secondary" className="flex-1 h-11" onClick={() => handleCreate(false)} disabled={saving || !clientId || !amount}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Crear borrador"}
          </Button>
          <Button className="flex-1 h-11" onClick={() => handleCreate(true)} disabled={saving || !clientId || !amount}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Crear y enviar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
