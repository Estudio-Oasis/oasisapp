import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "oasis.commandTour.dismissed";

export function useCommandTour() {
  const { user } = useAuth();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try { return localStorage.getItem(STORAGE_KEY) === "1"; } catch { return false; }
  });
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!user) { setChecked(true); return; }
    supabase
      .from("super_admin_users" as any)
      .select("id")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setIsSuperAdmin(!!data);
        setChecked(true);
      });
  }, [user?.id]);

  const dismiss = () => {
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch {}
    setDismissed(true);
  };

  return {
    isSuperAdmin,
    dismissed,
    ready: checked,
    shouldShow: checked && isSuperAdmin && !dismissed,
    dismiss,
  };
}
