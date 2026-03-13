import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";

const JOB_OPTIONS = [
  "Diseño",
  "Desarrollo",
  "Strategy",
  "Community",
  "Cuentas",
  "Otro",
];

interface InviteMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvited: () => void;
}

export function InviteMemberModal({ open, onOpenChange, onInvited }: InviteMemberModalProps) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setSending(true);
    const { data, error } = await supabase.functions.invoke("invite-member", {
      body: {
        email: email.trim(),
        full_name: fullName.trim() || null,
        job_title: jobTitle || null,
      },
    });

    setSending(false);

    if (error || data?.error) {
      toast.error(data?.error || error?.message || "Error al enviar invitación");
      return;
    }

    toast.success(`Invitación enviada a ${email}`);
    setEmail("");
    setFullName("");
    setJobTitle("");
    onOpenChange(false);
    onInvited();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Invitar miembro</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <label className="text-label">Correo electrónico *</label>
            <Input
              type="email"
              placeholder="carla@miagencia.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-label">Nombre completo</label>
            <Input
              placeholder="Carla García"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-label">Puesto / especialidad</label>
            <Select value={jobTitle} onValueChange={setJobTitle}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent>
                {JOB_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={sending || !email.trim()}>
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Enviar invitación
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
