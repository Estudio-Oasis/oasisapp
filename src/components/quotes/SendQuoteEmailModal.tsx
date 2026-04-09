import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, Paperclip } from "lucide-react";
import { toast } from "sonner";

interface SendQuoteEmailModalProps {
  open: boolean;
  onClose: () => void;
  quoteId: string;
  clientEmail: string;
  contactName: string;
  quoteTitle: string;
  quoteNumber: string;
  totalAmount: number;
  currency: string;
  validUntil: string | null;
  userName: string;
  agencyName: string;
  approvalToken: string | null;
  onSent: () => void;
}

export function SendQuoteEmailModal({
  open, onClose, quoteId, clientEmail, contactName, quoteTitle, quoteNumber,
  totalAmount, currency, validUntil, userName, agencyName, approvalToken, onSent,
}: SendQuoteEmailModalProps) {
  const [to, setTo] = useState(clientEmail);
  const [subject, setSubject] = useState(
    `Cotización: ${quoteTitle}${agencyName ? ` — ${agencyName}` : ""}`
  );
  const [message, setMessage] = useState(
    `Hola ${contactName || ""},\n\nTe comparto la cotización ${quoteNumber} por un total de $${totalAmount.toLocaleString()} ${currency}.${validUntil ? ` La cotización es válida hasta el ${new Date(validUntil).toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" })}.` : ""}\n\nQuedo atento a tus comentarios.\n\n${userName}${agencyName ? `\n${agencyName}` : ""}`
  );
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!to.trim()) { toast.error("Ingresa un email de destino"); return; }
    setSending(true);
    try {
      // Ensure approval token exists for the approval link
      let token = approvalToken;
      if (!token) {
        token = crypto.randomUUID();
        await supabase.from("quotes").update({ approval_token: token } as any).eq("id", quoteId);
      }
      const approvalUrl = `${window.location.origin}/q/${token}`;

      const validUntilFormatted = validUntil
        ? new Date(validUntil).toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" })
        : undefined;

      const { error } = await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "quote-sent",
          recipientEmail: to.trim(),
          idempotencyKey: `quote-sent-${quoteId}-${Date.now()}`,
          templateData: {
            contactName: contactName || undefined,
            quoteTitle,
            quoteNumber,
            totalAmount: totalAmount.toLocaleString(),
            currency,
            validUntil: validUntilFormatted,
            senderName: userName,
            agencyName,
            approvalUrl,
            message,
          },
        },
      });
      if (error) throw error;

      // Update quote status to sent
      await supabase.from("quotes").update({
        status: "sent",
        sent_at: new Date().toISOString(),
      }).eq("id", quoteId);

      toast.success("✓ Cotización enviada por email");
      onSent();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Error al enviar el email");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Enviar cotización por email</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-label mb-1 block">Para</label>
            <Input value={to} onChange={(e) => setTo(e.target.value)} placeholder="email@cliente.com" type="email" />
          </div>
          <div>
            <label className="text-label mb-1 block">Asunto</label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div>
            <label className="text-label mb-1 block">Mensaje</label>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={6} className="resize-none" />
          </div>
          <div className="flex items-center gap-2 text-sm text-foreground-muted bg-background-secondary rounded-lg p-3">
            <Paperclip className="h-4 w-4 shrink-0" />
            <span>Se incluirá un link de aprobación para que el cliente pueda aprobar o rechazar la cotización directamente.</span>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleSend} disabled={sending || !to.trim()}>
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Enviar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
