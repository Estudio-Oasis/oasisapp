import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  moduleName: string;
}

export function FeedbackModal({ open, onOpenChange, moduleName }: Props) {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [type, setType] = useState<"bug" | "mejora" | "idea">("mejora");
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim() || !user) return;
    setSending(true);
    const { error } = await supabase.from("feedback").insert({
      user_id: user.id,
      agency_id: (profile as any)?.agency_id || null,
      module: moduleName,
      type,
      message: message.trim(),
    });
    setSending(false);
    if (error) {
      toast.error("No se pudo enviar el feedback");
      return;
    }
    toast.success("¡Gracias! Revisaremos tu feedback 🙌");
    setMessage("");
    setType("mejora");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>¿Algo que mejorar en {moduleName}?</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Cuéntanos qué viste..."
            className="min-h-[100px]"
          />
          <div className="space-y-2">
            <p className="text-xs font-medium text-foreground-muted">Tipo:</p>
            <div className="flex gap-2">
              {([
                { key: "bug" as const, label: "🐛 Bug" },
                { key: "mejora" as const, label: "✨ Mejora" },
                { key: "idea" as const, label: "💡 Idea" },
              ]).map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setType(opt.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    type === opt.key
                      ? "bg-accent/10 border-accent/30 text-accent"
                      : "border-border text-foreground-muted hover:border-accent/20"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleSubmit} disabled={!message.trim() || sending}>
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar →"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
