import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

export default function Setup() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [invitedBy, setInvitedBy] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    // Supabase redirects with hash fragments for invite tokens
    // The auth state change handles the token exchange
    const handleSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        // User already has a session from the invite link
        const meta = session.user.user_metadata;
        setName(meta?.name || "");
        setEmail(session.user.email || "");
        setInvitedBy(meta?.invited_by_name || "tu equipo");
        setVerifying(false);
      } else {
        // Listen for the auth event from the invite token
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (event === "SIGNED_IN" && session?.user) {
              const meta = session.user.user_metadata;
              setName(meta?.name || "");
              setEmail(session.user.email || "");
              setInvitedBy(meta?.invited_by_name || "tu equipo");
              setVerifying(false);
            }
          }
        );

        // Wait a bit then show error if no session
        setTimeout(() => {
          setVerifying(false);
        }, 3000);

        return () => subscription.unsubscribe();
      }
    };

    handleSession();
  }, []);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);

    // Update the user's password
    const { error: pwError } = await supabase.auth.updateUser({
      password,
      data: { name: name.trim() },
    });

    if (pwError) {
      setError(pwError.message);
      setLoading(false);
      return;
    }

    // Update profile
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("profiles")
        .update({
          name: name.trim(),
          job_title: user.user_metadata?.job_title || null,
          onboarded: false,
        })
        .eq("id", user.id);
    }

    navigate("/bitacora");
  };

  if (verifying) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-secondary">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-foreground-muted" />
          <p className="text-sm text-foreground-secondary">Verificando invitación...</p>
        </div>
      </div>
    );
  }

  if (!email) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-secondary px-6">
        <div className="w-full max-w-[400px] rounded-lg border border-border bg-card p-10 text-center">
          <div className="flex justify-center">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-foreground">
              <span className="text-[11px] font-bold tracking-widest text-background">B</span>
            </div>
          </div>
          <h1 className="text-h2 text-foreground mt-4">Invitación inválida</h1>
          <p className="text-sm text-foreground-secondary mt-2">
            Este enlace de invitación ha expirado o es inválido.
          </p>
          <Button className="mt-6" onClick={() => navigate("/login")}>
            Ir al login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background-secondary px-6">
      <div className="w-full max-w-[400px] rounded-lg border border-border bg-card p-10">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-foreground">
            <span className="text-[11px] font-bold tracking-widest text-background">B</span>
          </div>
        </div>

        <h1 className="text-h1 text-foreground text-center mt-4">Configura tu cuenta</h1>
        <p className="text-sm text-foreground-secondary text-center mt-1">
          Estás siendo incorporado por {invitedBy}
        </p>

        <form onSubmit={handleSetup} className="mt-8 space-y-5">
          {error && (
            <div className="rounded-md bg-destructive-light px-3 py-2 text-small text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-label">Nombre completo *</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-label">Correo</label>
            <Input value={email} disabled className="opacity-60" />
          </div>

          <div className="space-y-1.5">
            <label className="text-label">Contraseña *</label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-label">Confirmar contraseña *</label>
            <Input
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full h-11" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Creando cuenta...
              </>
            ) : (
              "Crear mi cuenta →"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
