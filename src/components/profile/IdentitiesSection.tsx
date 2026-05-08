import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Loader2, Link2, Unlink, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

interface Identity {
  identity_id?: string;
  id: string;
  user_id: string;
  identity_data?: Record<string, any>;
  provider: string;
  created_at?: string;
  last_sign_in_at?: string;
}

const PROVIDER_LABEL: Record<string, string> = {
  email: "Email y contraseña",
  google: "Google",
  apple: "Apple",
};

export function IdentitiesSection() {
  const [identities, setIdentities] = useState<Identity[]>([]);
  const [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState(false);
  const [unlinkingId, setUnlinkingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.getUserIdentities();
    setLoading(false);
    if (error) {
      toast.error("No se pudieron cargar las identidades");
      return;
    }
    setIdentities((data?.identities ?? []) as Identity[]);
  };

  useEffect(() => {
    load();
  }, []);

  const handleLinkGoogle = async () => {
    setLinking(true);
    try {
      // Use Supabase's linkIdentity directly to attach a new provider to the
      // currently authenticated user (does NOT create a new user).
      const { data, error } = await supabase.auth.linkIdentity({
        provider: "google",
        options: { redirectTo: window.location.href },
      });
      if (error) {
        toast.error(error.message);
      } else if ((data as any)?.url) {
        window.location.href = (data as any).url;
      }
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo iniciar la vinculación");
    } finally {
      setLinking(false);
    }
  };

  const handleUnlink = async (identity: Identity) => {
    if (identities.length <= 1) {
      toast.error("Necesitas al menos un método de inicio de sesión");
      return;
    }
    setUnlinkingId(identity.id);
    const { error } = await supabase.auth.unlinkIdentity(identity as any);
    setUnlinkingId(null);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Método desvinculado");
      load();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Cargando…
      </div>
    );
  }

  const hasGoogle = identities.some((i) => i.provider === "google");

  return (
    <div className="space-y-2">
      {identities.map((id) => {
        const email = id.identity_data?.email ?? "—";
        return (
          <div
            key={id.id}
            className="flex items-center justify-between rounded-md border border-border bg-background-secondary px-3 py-2"
          >
            <div className="flex items-center gap-2 min-w-0">
              <ShieldCheck className="h-3.5 w-3.5 text-accent shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-foreground">
                  {PROVIDER_LABEL[id.provider] ?? id.provider}
                </p>
                <p className="text-[11px] text-foreground-muted truncate">{email}</p>
              </div>
            </div>
            {identities.length > 1 && (
              <button
                onClick={() => handleUnlink(id)}
                disabled={unlinkingId === id.id}
                className="text-foreground-muted hover:text-destructive transition-colors"
                title="Desvincular"
              >
                {unlinkingId === id.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Unlink className="h-3.5 w-3.5" />
                )}
              </button>
            )}
          </div>
        );
      })}

      {!hasGoogle && (
        <Button
          variant="secondary"
          size="sm"
          className="w-full gap-2"
          onClick={handleLinkGoogle}
          disabled={linking}
        >
          {linking ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Link2 className="h-3.5 w-3.5" />
          )}
          Vincular cuenta de Google
        </Button>
      )}

      <p className="text-[11px] text-foreground-muted">
        Vincula varios métodos para entrar con cualquiera de ellos a la misma cuenta.
      </p>
    </div>
  );
}
