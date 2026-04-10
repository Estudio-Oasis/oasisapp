import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trackEvent } from "@/lib/analytics";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      trackEvent("login_complete");
      navigate("/home");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background-secondary px-6">
      <div className="w-full max-w-[400px] rounded-lg border border-border bg-card p-10">
        {/* Wordmark */}
        <div className="flex items-center gap-2 justify-center">
          <div className="h-8 w-8 rounded-lg bg-foreground text-background flex items-center justify-center font-bold text-sm">O</div>
          <span className="text-lg font-bold tracking-tight text-foreground">OasisOS</span>
        </div>

        {/* Heading */}
        <h1 className="text-h1 text-foreground text-center mt-4">Bienvenido de vuelta</h1>
        <p className="text-sm text-foreground-secondary text-center mt-1">
          Inicia sesión en tu espacio de trabajo
        </p>

        {/* Form */}
        <form onSubmit={handleLogin} className="mt-8 space-y-5">
          {error && (
            <div className="rounded-md bg-destructive-light px-3 py-2 text-small text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="email" className="text-label">Correo</label>
            <Input
              id="email"
              type="email"
              placeholder="tu@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-label">Contraseña</label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full h-11" disabled={loading}>
            {loading ? "Iniciando sesión…" : "Iniciar sesión"}
          </Button>

          <div className="text-center">
            <Link to="/forgot-password" className="text-small text-foreground-secondary hover:text-foreground transition-colors">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
        </form>

        {/* Footer */}
        <p className="text-small text-foreground-secondary text-center mt-6">
          ¿No tienes cuenta?{" "}
          <Link to="/signup" className="font-semibold text-foreground hover:text-accent transition-colors">
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  );
}
