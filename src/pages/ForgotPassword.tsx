import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthLayout } from "@/components/AuthLayout";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSent(true);
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div>
        <h1 className="text-2xl font-bold text-foreground text-center">Recupera tu contraseña</h1>
        <p className="text-sm text-muted-foreground text-center mt-1">
          Te enviaremos un enlace para restablecerla
        </p>
      </div>

      {sent ? (
        <div className="mt-8 space-y-5">
          <div className="rounded-md bg-accent/10 px-3 py-3 text-sm text-foreground">
            Revisa tu bandeja de entrada en <strong>{email}</strong>. Si tienes una cuenta, recibirás un enlace para restablecer tu contraseña.
          </div>
          <p className="text-sm text-muted-foreground text-center">
            <Link to="/login" className="font-medium text-foreground hover:underline">
              Volver al login
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
              <label htmlFor="email" className="text-sm font-medium">Correo</label>
              <Input
                id="email"
                type="email"
                placeholder="tu@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading ? "Enviando…" : "Enviar enlace"}
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
