import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { X, Loader2, ImagePlus, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { ImageEditorModal } from "@/components/ImageEditorModal";

interface BreakdownItem {
  label: string;
  amount: number;
}

export interface PaymentRow {
  id: string;
  client_id: string;
  invoice_id: string | null;
  amount_received: number;
  currency_received: string;
  date_received: string;
  sender_name: string | null;
  reference: string | null;
  transaction_id: string | null;
  method: string | null;
  bank_amount: number | null;
  bank_currency: string | null;
  exchange_rate: number | null;
  breakdown: { label: string; amount: number }[] | null;
  receipt_url: string | null;
  notes: string | null;
  created_at: string;
  client_name?: string;
  invoice_number?: string;
}

interface PaymentDetailPanelProps {
  payment: PaymentRow;
  onClose: () => void;
  onUpdated: () => void;
}

export function PaymentDetailPanel({ payment, onClose, onUpdated }: PaymentDetailPanelProps) {
  const { user } = useAuth();
  const [notes, setNotes] = useState(payment.notes || "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);

  const saveNotes = async () => {
    setSaving(true);
    await supabase.from("payments").update({ notes: notes || null } as Record<string, unknown>).eq("id", payment.id);
    setSaving(false);
    toast.success("Notes saved");
    onUpdated();
  };

  const deletePayment = async () => {
    if (!window.confirm("Delete this payment? This cannot be undone.")) return;
    setSaving(true);
    await supabase.from("payments").delete().eq("id", payment.id);
    setSaving(false);
    toast.success("Payment deleted");
    onUpdated();
    onClose();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("File must be under 10MB"); return; }
    setReceiptFile(file);
    setEditorOpen(true);
  };

  const handleEditorConfirm = async (editedFile: File) => {
    if (!user) return;
    setUploading(true);
    const path = `${user.id}/${payment.id}/${Date.now()}.jpg`;
    const { error: uploadError } = await supabase.storage
      .from("receipts")
      .upload(path, editedFile, { contentType: "image/jpeg" });

    if (uploadError) {
      toast.error("Failed to upload receipt");
      setUploading(false);
      return;
    }

    const { data: signedData } = await supabase.storage
      .from("receipts")
      .createSignedUrl(path, 60 * 60 * 24 * 365);

    if (signedData?.signedUrl) {
      await supabase.from("payments")
        .update({ receipt_url: signedData.signedUrl } as Record<string, unknown>)
        .eq("id", payment.id);
      toast.success("Receipt uploaded");
      onUpdated();
    }
    setUploading(false);
  };

  const breakdown = Array.isArray(payment.breakdown) ? payment.breakdown as BreakdownItem[] : [];

  return (
    <>
      <div className="fixed inset-0 z-40 bg-foreground/20" onClick={onClose} />
      <div className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-[400px] bg-background border-l border-border overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-h2 text-foreground">Payment details</h2>
            <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-md text-foreground-muted hover:text-foreground hover:bg-background-tertiary">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-col gap-4">
            {/* Amount */}
            <div className="border border-border rounded-lg p-4">
              <p className="text-micro text-foreground-muted mb-1">Amount received</p>
              <p className="text-h1 text-foreground">
                ${payment.amount_received.toLocaleString(undefined, { minimumFractionDigits: 2 })} {payment.currency_received}
              </p>
            </div>

            {/* Conversion */}
            {payment.bank_amount && payment.bank_currency && (
              <div className="bg-accent-light border border-accent/20 rounded-lg p-4">
                <p className="text-micro text-foreground-muted mb-1">Currency conversion</p>
                <p className="text-sm text-foreground">
                  Received ${payment.amount_received.toLocaleString()} {payment.currency_received} → arrived ${payment.bank_amount.toLocaleString()} {payment.bank_currency}
                </p>
                {payment.exchange_rate && (
                  <p className="text-small text-accent-foreground mt-1">
                    Rate: 1 {payment.currency_received} = {payment.exchange_rate.toFixed(4)} {payment.bank_currency}
                  </p>
                )}
              </div>
            )}

            {/* Receipt */}
            <div>
              <p className="text-micro text-foreground-muted mb-2">Receipt</p>
              {payment.receipt_url ? (
                <div className="space-y-2">
                  <img
                    src={payment.receipt_url}
                    alt="Payment receipt"
                    className="w-full max-h-[280px] object-contain border border-border rounded-lg"
                  />
                  <div className="flex gap-2">
                    <a
                      href={payment.receipt_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-small text-accent-foreground hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" /> View full size
                    </a>
                    <label className="text-small text-foreground-muted hover:underline cursor-pointer">
                      <input type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
                      Replace receipt
                    </label>
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center gap-2 border-2 border-dashed border-border rounded-xl p-4 cursor-pointer bg-background-secondary hover:bg-background-tertiary transition-colors text-center">
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
                  {uploading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-foreground-muted" />
                  ) : (
                    <ImagePlus className="h-5 w-5 text-foreground-muted" />
                  )}
                  <span className="text-small text-foreground-muted">Add receipt</span>
                </label>
              )}
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-micro text-foreground-muted mb-1">Date</p>
                <p className="text-sm text-foreground">
                  {new Date(payment.date_received + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </div>
              <div>
                <p className="text-micro text-foreground-muted mb-1">Method</p>
                <p className="text-sm text-foreground capitalize">{payment.method || "—"}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-micro text-foreground-muted mb-1">Sender</p>
                <p className="text-sm text-foreground">{payment.sender_name || "—"}</p>
              </div>
              <div>
                <p className="text-micro text-foreground-muted mb-1">Reference</p>
                <p className="text-sm text-foreground">{payment.reference || "—"}</p>
              </div>
            </div>

            {payment.transaction_id && (
              <div>
                <p className="text-micro text-foreground-muted mb-1">Transaction ID</p>
                <p className="text-sm text-foreground font-mono">{payment.transaction_id}</p>
              </div>
            )}

            {payment.client_name && (
              <div>
                <p className="text-micro text-foreground-muted mb-1">Client</p>
                <p className="text-sm text-foreground">{payment.client_name}</p>
              </div>
            )}

            {payment.invoice_number && (
              <div>
                <p className="text-micro text-foreground-muted mb-1">Linked invoice</p>
                <span className="inline-flex items-center bg-accent-light text-accent-foreground text-xs font-medium px-2.5 py-1 rounded-full">
                  {payment.invoice_number}
                </span>
              </div>
            )}

            {/* Breakdown */}
            {breakdown.length > 0 && (
              <div>
                <p className="text-micro text-foreground-muted mb-2">Breakdown</p>
                <div className="border border-border rounded-lg overflow-hidden">
                  {breakdown.map((item, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2 border-b border-border last:border-b-0">
                      <span className="text-sm text-foreground">{item.label}</span>
                      <span className="text-sm font-medium text-foreground">${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="h-px bg-border" />

            <div className="space-y-1.5">
              <label className="text-label">Notes</label>
              <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className="resize-none" />
              <Button variant="secondary" size="sm" onClick={saveNotes} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save notes"}
              </Button>
            </div>

            <div className="h-px bg-border" />

            <button onClick={deletePayment} className="text-sm text-destructive hover:underline text-left" disabled={saving}>
              Delete payment
            </button>
          </div>
        </div>
      </div>

      <ImageEditorModal
        open={editorOpen}
        onOpenChange={setEditorOpen}
        imageFile={receiptFile}
        onConfirm={handleEditorConfirm}
      />
    </>
  );
}
