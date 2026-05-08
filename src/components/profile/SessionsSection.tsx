import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, Monitor, Smartphone, X, LogOut } from "lucide-react";
import { toast } from "sonner";

interface Session {
  id: string;
  created_at: string;
  updated_at: string;
  user_agent: string | null;
  ip: string | null;
  is_current: boolean;
}

function parseDevice(ua: string | null) {
  if (!ua) return { label: "Dispositivo desconocido", icon: Monitor };
  const isMobile = /Mobile|Android|iPhone|iPad/i.test(ua);
  let browser = "Navegador";
  if (/Chrome\//.test(ua) && !/Edg\//.test(ua)) browser = "Chrome";
  else if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) browser = "Safari";
  else if (/Firefox\//.test(ua)) browser = "Firefox";
  else if (/Edg\//.test(ua)) browser = "Edge";
  let os = "";
  if (/Mac OS X/.test(ua)) os = "macOS";
  else if (/Windows/.test(ua)) os = "Windows";
  else if (/Android/.test(ua)) os = "Android";
  else if (/iPhone|iPad|iOS/.test(ua)) os = "iOS";
  else if (/Linux/.test(ua)) os = "Linux";
  return { label: `${browser} · ${os}`, icon: isMobile ? Smartphone : Monitor };
}

function fmt(d: string) {
  const date = new Date(d);
  const diffMs = Date.now() - date.getTime();
  const m = Math.round(diffMs / 60000);
  if (m < 1) return "ahora";
  if (m < 60) return `hace ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `hace ${h} h`;
  return date.toLocaleDateString("es-MX", { dateStyle: "medium" });
}

export function SessionsSection() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [revokingOthers, setRevokingOthers] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("list-user-sessions");
    setLoading(false);
    if (error) {
      toast.error("No se pudieron cargar las sesiones");
      return;
    }
    setSessions((data?.sessions ?? []) as Session[]);
  };

  useEffect(() => {
    load();
  }, []);

  const revoke = async (sessionId: string) => {
    setRevokingId(sessionId);
    const { error } = await supabase.functions.invoke("revoke-user-session", {
      body: { action: "one", session_id: sessionId },
    });
    setRevokingId(null);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Sesión cerrada");
      load();
    }
  };

  const revokeOthers = async () => {
    setRevokingOthers(true);
    const { error } = await supabase.functions.invoke("revoke-user-session", {
      body: { action: "others" },
    });
    setRevokingOthers(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Cerradas las demás sesiones");
      load();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Cargando sesiones…
      </div>
    );
  }

  if (sessions.length === 0) {
    return <p className="text-xs text-foreground-muted">Sin sesiones activas.</p>;
  }

  const hasOthers = sessions.some((s) => !s.is_current);

  return (
    <div className="space-y-2">
      {sessions.map((s) => {
        const { label, icon: Icon } = parseDevice(s.user_agent);
        return (
          <div
            key={s.id}
            className="flex items-center justify-between rounded-md border border-border bg-background-secondary px-3 py-2"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Icon className="h-3.5 w-3.5 text-foreground-muted shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-foreground truncate">
                  {label}
                  {s.is_current && (
                    <span className="ml-2 text-[10px] font-semibold uppercase tracking-wider text-accent">
                      Esta sesión
                    </span>
                  )}
                </p>
                <p className="text-[11px] text-foreground-muted truncate">
                  {s.ip ?? "IP desconocida"} · {fmt(s.updated_at)}
                </p>
              </div>
            </div>
            {!s.is_current && (
              <button
                onClick={() => revoke(s.id)}
                disabled={revokingId === s.id}
                className="text-foreground-muted hover:text-destructive transition-colors"
                title="Cerrar esta sesión"
              >
                {revokingId === s.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <X className="h-3.5 w-3.5" />
                )}
              </button>
            )}
          </div>
        );
      })}
      {hasOthers && (
        <Button
          size="sm"
          variant="secondary"
          className="w-full gap-2"
          onClick={revokeOthers}
          disabled={revokingOthers}
        >
          {revokingOthers ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <LogOut className="h-3.5 w-3.5" />
          )}
          Cerrar las demás sesiones
        </Button>
      )}
    </div>
  );
}
