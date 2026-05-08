import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, nextSession) => {
        if (!mounted) return;
        setSession(nextSession);
        if (event === "SIGNED_IN" && nextSession?.user) {
          // Defer to avoid deadlocks inside the auth callback
          setTimeout(() => {
            void import("@/lib/activityLog").then(({ logActivity }) =>
              logActivity({
                category: "auth",
                action: "auth.signed_in",
                description: `Inicio de sesión (${nextSession.user.app_metadata.provider ?? "email"})`,
                metadata: { provider: nextSession.user.app_metadata.provider ?? "email" },
              }),
            );
          }, 0);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (!mounted) return;
      setSession(initialSession);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    void import("@/lib/activityLog").then(({ logActivity }) =>
      logActivity({ category: "auth", action: "auth.signed_out", description: "Cierre de sesión" }),
    );
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
