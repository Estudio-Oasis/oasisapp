import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePlan } from "@/hooks/usePlan";
import { supabase } from "@/integrations/supabase/client";
import { Check, ChevronRight } from "lucide-react";

interface CheckItem {
  id: string;
  label: string;
  done: boolean;
  link: string;
}

export function WelcomeChecklist() {
  const { user } = useAuth();
  const { isFree } = usePlan();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [dismissed, setDismissed] = useState(false);
  const [userName, setUserName] = useState("");
  const [items, setItems] = useState<CheckItem[]>([]);
  const [isNew, setIsNew] = useState(false);

  useEffect(() => {
    if (!user) return;

    (async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("agency_id, name")
        .eq("id", user.id)
        .single();

      if (!profile?.agency_id) return;
      const agencyId = profile.agency_id;

      const { data: agency } = await supabase
        .from("agencies")
        .select("name, created_at")
        .eq("id", agencyId)
        .single();

      if (!agency) return;

      // Only show for agencies created in the last 14 days or if ?welcome=true
      const ageDays = (Date.now() - new Date(agency.created_at).getTime()) / (1000 * 60 * 60 * 24);
      const isWelcome = searchParams.get("welcome") === "true";
      if (ageDays > 14 && !isWelcome) return;

      setUserName(profile.name || agency.name);
      setIsNew(true);

      // Check completion items in parallel
      const [timeEntries, clients, members, quotes] = await Promise.all([
        supabase.from("time_entries").select("id", { count: "exact", head: true }).eq("user_id", user.id).not("ended_at", "is", null),
        supabase.from("clients").select("id", { count: "exact", head: true }).eq("agency_id", agencyId),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("agency_id", agencyId),
        supabase.from("quotes").select("id", { count: "exact", head: true }).eq("agency_id", agencyId),
      ]);

      const baseItems: CheckItem[] = [
        { id: "timer", label: "Registra tu primera hora", done: (timeEntries.count ?? 0) > 0, link: "/bitacora" },
        { id: "client", label: "Agrega tu primer cliente", done: (clients.count ?? 0) > 0, link: "/clients" },
      ];

      // Only show team/quote items for paid plans
      if (!isFree) {
        baseItems.push(
          { id: "invite", label: "Invita a alguien de tu equipo", done: (members.count ?? 0) > 1, link: "/settings?tab=members" },
          { id: "quote", label: "Crea tu primera propuesta", done: (quotes.count ?? 0) > 0, link: "/quotes" },
        );
      }

      baseItems.push(
        { id: "profile", label: "Configura tu perfil", done: false, link: "/settings" },
      );

      setItems(baseItems);
    })();
  }, [user, isFree]);

  if (!isNew || dismissed || items.length === 0) return null;

  const completedCount = items.filter((i) => i.done).length;

  return (
    <div className="mb-6 rounded-2xl border border-border bg-gradient-to-r from-background to-muted/20 p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold text-foreground">¡Bienvenido, {userName}! 🎉</h3>
          <p className="text-sm text-muted-foreground">Completa estos pasos para arrancar</p>
        </div>
        <button onClick={() => setDismissed(true)} className="text-muted-foreground hover:text-foreground transition-colors">
          ✕
        </button>
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-muted/40 transition-colors ${item.done ? "opacity-60" : ""}`}
            onClick={() => !item.done && navigate(item.link)}
          >
            <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${item.done ? "bg-success border-success" : "border-border"}`}>
              {item.done && <Check className="h-3 w-3 text-white" />}
            </div>
            <span className={`text-sm ${item.done ? "line-through text-muted-foreground" : "text-foreground"}`}>
              {item.label}
            </span>
            {!item.done && <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />}
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-foreground rounded-full transition-all"
            style={{ width: `${(completedCount / items.length) * 100}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground">{completedCount}/{items.length}</span>
      </div>
    </div>
  );
}
