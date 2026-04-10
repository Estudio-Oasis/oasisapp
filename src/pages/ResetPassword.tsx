import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthLayout } from "@/components/AuthLayout";
import { toast } from "sonner";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    if (window.location.hash.includes("type=recovery")) setReady(true);
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) { setError("Las contraseñas no coinciden"); return; }
    if (password.length < 6) { setError("La contraseña debe tener al menos 6 caracteres"); return; }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) { setError(error.message); setLoading(false); }
    else { toast.success("Contraseña actualizada correctamente"); navigate("/home"); }
  };

  return (
    <AuthLayout>
      <div>
        <h1 className="text-2xl font-bold text-foreground text-center">Nueva contraseña</h1>
        <p className="text-sm text-muted-foreground text-center mt-1">
          Elige una nueva contraseña para tu cuenta
        </p>
      </div>

      {!ready ? (
        <div className="mt-8 space-y-5">
          <div className="rounded-md bg-destructive/10 px-3 py-3 text-sm text-destructive">
            Enlace inválido o expirado. Solicita un nuevo enlace de recuperación.
          </div>
          <p className="text-sm text-muted-foreground text-center">
            <Link to="/forgot-password" className="font-medium text-foreground hover:underline">
              Solicitar nuevo enlace
            </Link>
          </p>
        </div>
      ) : (
        <>
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {error && (
              <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium">Nueva contraseña</label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="confirmPassword" className="text-sm font-medium">Confirmar contraseña</label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading ? "Guardando…" : "Guardar contraseña"}
            </Button>
          </form>

          <p className="text-sm text-muted-foreground text-center mt-6">
            <Link to="/login" className="font-medium text-foreground hover:underline">
              Volver al login
            </Link>
          </p>
        </>
      )}
    </AuthLayout>
  );
}
