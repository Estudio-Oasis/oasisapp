import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface AgencyInfo {
  id: string;
  name: string;
  logo_url: string | null;
  plan: string;
  member_count: number;
}

export default function JoinWorkspace() {
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [agency, setAgency] = useState<AgencyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    supabase
      .rpc("get_agency_by_invite_token", { _token: token })
      .then(({ data, error }) => {
        if (error || !data || data.length === 0) {
          setError("Este enlace de invitación no es válido o fue desactivado.");
        } else {
          setAgency(data[0] as AgencyInfo);
        }
        setLoading(false);
      });
  }, [token]);

  // Auto-join after auth redirect
  useEffect(() => {
    if (authLoading || !user || !token || !agency) return;
    if (searchParams.get("auto") === "1") {
      handleJoin();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, agency]);

  const handleJoin = async () => {
    if (!token) return;
    if (!user) {
      const next = `/join-workspace/${token}?auto=1`;
      navigate(`/signup?redirect=${encodeURIComponent(next)}`);
      return;
    }
    setJoining(true);
    const { error } = await supabase.rpc("join_agency_via_invite_token", { _token: token });
    setJoining(false);
    if (error) {
      toast.error(error.message || "No se pudo unirte al workspace");
      return;
    }
    toast.success(`Te uniste a ${agency?.name}`);
    navigate("/home");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-foreground-muted" />
      </div>
    );
  }

  if (error || !agency) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md w-full text-center space-y-4">
          <h1 className="text-2xl font-semibold text-foreground">Invitación no válida</h1>
          <p className="text-foreground-muted">{error}</p>
          <Button onClick={() => navigate("/")}>Volver al inicio</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 text-center space-y-6">
        {agency.logo_url ? (
          <img
            src={agency.logo_url}
            alt={agency.name}
            className="h-20 w-20 rounded-2xl mx-auto object-cover"
          />
        ) : (
          <div className="h-20 w-20 rounded-2xl mx-auto bg-accent-light flex items-center justify-center text-2xl font-semibold text-foreground">
            {agency.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="space-y-2">
          <p className="text-sm text-foreground-muted">Has sido invitado a unirte a</p>
          <h1 className="text-2xl font-semibold text-foreground">{agency.name}</h1>
          <p className="text-xs text-foreground-muted">{agency.member_count} miembro(s)</p>
        </div>
        <Button onClick={handleJoin} disabled={joining} className="w-full" size="lg">
          {joining ? <Loader2 className="h-4 w-4 animate-spin" /> : "Unirme al workspace"}
        </Button>
        {!user && (
          <p className="text-xs text-foreground-muted">
            Necesitarás crear una cuenta o iniciar sesión primero.
          </p>
        )}
      </div>
    </div>
  );
}
