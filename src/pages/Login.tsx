import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
      navigate("/bitacora");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background-secondary px-6">
      <div className="w-full max-w-[400px] rounded-lg border border-border bg-card p-10">
        {/* Logo */}
        <div className="flex justify-center">
          <Link to="/" className="flex h-9 w-9 items-center justify-center rounded-md bg-foreground hover:opacity-80 transition-opacity">
            <span className="text-[11px] font-bold tracking-widest text-background">OS</span>
          </Link>
        </div>

        {/* Heading */}
        <h1 className="text-h1 text-foreground text-center mt-4">Welcome back</h1>
        <p className="text-sm text-foreground-secondary text-center mt-1">
          Sign in to your workspace
        </p>

        {/* Form */}
        <form onSubmit={handleLogin} className="mt-8 space-y-5">
          {error && (
            <div className="rounded-md bg-destructive-light px-3 py-2 text-small text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="email" className="text-label">Email</label>
            <Input
              id="email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-label">Password</label>
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
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        {/* Footer */}
        <p className="text-small text-foreground-secondary text-center mt-6">
          Don't have an account?{" "}
          <Link to="/signup" className="font-semibold text-foreground hover:text-accent transition-colors">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
