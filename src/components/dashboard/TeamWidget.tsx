import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { WidgetCard } from "@/components/ui/widget-card";
import { getClientColor } from "@/lib/timer-utils";
import { Users, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface MemberPresence {
  user_id: string;
  status: string;
  current_client: string | null;
  current_task: string | null;
}

interface Profile {
  id: string;
  name: string | null;
  avatar_url: string | null;
}

export function TeamWidget() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [members, setMembers] = useState<MemberPresence[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [presRes, profRes] = await Promise.all([
        supabase.from("member_presence").select("user_id, status, current_client, current_task"),
        supabase.from("profiles").select("id, name, avatar_url"),
      ]);
      setMembers((presRes.data || []) as MemberPresence[]);
      const map: Record<string, Profile> = {};
      ((profRes.data || []) as Profile[]).forEach(p => { map[p.id] = p; });
      setProfiles(map);
    };
    load();
  }, [user?.id]);

  const otherMembers = members.filter(m => m.user_id !== user?.id);

  return (
    <WidgetCard title="Equipo" icon={Users} action={{ label: "Hub →", onClick: () => navigate("/hub") }}>
      {otherMembers.length === 0 ? (
        <p className="text-sm text-foreground-muted text-center py-4">Sin miembros activos</p>
      ) : (
        <div className="space-y-2.5">
          {otherMembers.map(m => {
            const p = profiles[m.user_id];
            const name = p?.name || "Usuario";
            const statusColor = m.status === "working" ? "bg-success" : m.status === "online" ? "bg-accent" : "bg-foreground-muted";
            const statusText = m.status === "working" && m.current_task
              ? m.current_task
              : m.status === "working" && m.current_client
              ? m.current_client
              : m.status === "working"
              ? "Trabajando"
              : m.status === "online"
              ? "Disponible"
              : "Offline";

            return (
              <div key={m.user_id} className="flex items-center gap-3 group">
                <div className="relative">
                  {p?.avatar_url ? (
                    <img src={p.avatar_url} alt={name} className="h-8 w-8 rounded-full object-cover" />
                  ) : (
                    <div
                      className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-background"
                      style={{ backgroundColor: getClientColor(name) }}
                    >
                      {name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card ${statusColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{name}</p>
                  <p className="text-[11px] text-foreground-muted truncate">{statusText}</p>
                </div>
                <button
                  onClick={() => navigate("/hub")}
                  className="h-7 w-7 rounded-full flex items-center justify-center text-foreground-muted hover:text-accent hover:bg-accent/10 opacity-0 group-hover:opacity-100 transition-all"
                  title="Ir al chat"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </WidgetCard>
  );
}
