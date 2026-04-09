import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { WidgetCard } from "@/components/ui/widget-card";
import { Lightbulb, ArrowRight, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Idea {
  id: string;
  title: string;
  created_at: string;
}

export function IdeasWidget({ refreshTrigger }: { refreshTrigger?: number }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [ideas, setIdeas] = useState<Idea[]>([]);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("tasks")
      .select("id, title, created_at")
      .eq("assignee_id", user.id)
      .eq("status", "backlog")
      .ilike("description", "%[idea]%")
      .order("created_at", { ascending: false })
      .limit(5);
    setIdeas((data || []) as Idea[]);
  };

  useEffect(() => { load(); }, [user?.id, refreshTrigger]);

  const promoteIdea = async (idea: Idea) => {
    await supabase.from("tasks").update({ status: "todo" as const, description: null }).eq("id", idea.id);
    toast.success("✅ Idea convertida en tarea");
    load();
  };

  const deleteIdea = async (id: string) => {
    await supabase.from("tasks").delete().eq("id", id);
    load();
  };

  if (ideas.length === 0) return null;

  return (
    <WidgetCard title="Ideas" icon={Lightbulb} action={{ label: "Ver tareas →", onClick: () => navigate("/tasks") }}>
      <div className="space-y-1.5">
        {ideas.map(idea => (
          <div key={idea.id} className="flex items-center gap-2 group">
            <Lightbulb className="h-3 w-3 text-accent/60 shrink-0" />
            <span className="text-sm text-foreground flex-1 truncate">{idea.title}</span>
            <button
              onClick={() => promoteIdea(idea)}
              className="text-foreground-muted hover:text-accent opacity-0 group-hover:opacity-100 transition-all"
              title="Convertir en tarea"
            >
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => deleteIdea(idea.id)}
              className="text-foreground-muted hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
              title="Eliminar"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </WidgetCard>
  );
}
