import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, MailX, CheckCircle2, AlertTriangle } from "lucide-react";

type Status = "loading" | "valid" | "already" | "invalid" | "success" | "error";

export default function UnsubscribePage() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState<Status>("loading");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!token) { setStatus("invalid"); return; }
    const validate = async () => {
      try {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${token}`;
        const res = await fetch(url, { headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY } });
        const data = await res.json();
        if (!res.ok) { setStatus("invalid"); return; }
        setStatus(data.valid === false && data.reason === "already_unsubscribed" ? "already" : "valid");
      } catch { setStatus("error"); }
    };
    validate();
  }, [token]);

  const handleUnsubscribe = async () => {
    if (!token) return;
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", { body: { token } });
      if (error) throw error;
      setStatus(data?.success ? "success" : "already");
    } catch { setStatus("error"); }
    setProcessing(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-md w-full text-center space-y-6">
        {status === "loading" && <Loader2 className="h-8 w-8 animate-spin text-foreground-muted mx-auto" />}
        {status === "valid" && (
          <>
            <MailX className="h-12 w-12 text-foreground-muted mx-auto" />
            <h1 className="text-h2 text-foreground">Cancelar suscripción</h1>
            <p className="text-sm text-foreground-secondary">¿Estás seguro de que deseas dejar de recibir emails de OasisOS?</p>
            <Button onClick={handleUnsubscribe} disabled={processing} className="w-full">
              {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar cancelación"}
            </Button>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle2 className="h-12 w-12 text-success mx-auto" />
            <h1 className="text-h2 text-foreground">Listo</h1>
            <p className="text-sm text-foreground-secondary">Has sido removido de nuestra lista de correos.</p>
          </>
        )}
        {status === "already" && (
          <>
            <CheckCircle2 className="h-12 w-12 text-foreground-muted mx-auto" />
            <h1 className="text-h2 text-foreground">Ya cancelado</h1>
            <p className="text-sm text-foreground-secondary">Ya habías cancelado tu suscripción anteriormente.</p>
          </>
        )}
        {(status === "invalid" || status === "error") && (
          <>
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
            <h1 className="text-h2 text-foreground">Enlace inválido</h1>
            <p className="text-sm text-foreground-secondary">Este enlace de cancelación no es válido o ha expirado.</p>
          </>
        )}
      </div>
    </div>
  );
}
