import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTimer } from "@/contexts/TimerContext";
import { WidgetCard } from "@/components/ui/widget-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getClientColor } from "@/lib/timer-utils";
import { toast } from "sonner";
import {
  CheckSquare, Plus, Zap, CalendarPlus, ChevronRight, X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Tables } from "@/integrations/supabase/types";

type Task = Tables<"tasks">;

const PRIORITY_BADGE: Record<string, string> = {
  urgent: "bg-destructive/10 text-destructive",
  high: "bg-accent/10 text-accent",
  medium: "bg-foreground-muted/10 text-foreground-secondary",
  low: "bg-background-secondary text-foreground-muted",
};

export function DayTasksWidget() {
  const { user } = useAuth();
  const { startTimer } = useTimer();
  const navigate = useNavigate();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [clients, setClients] = useState<Record<string, string>>({});
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddMode, setQuickAddMode] = useState<"today" | "later">("today");
  const [newTitle, setNewTitle] = useState("");
  const [adding, setAdding] = useState(false);

  const loadTasks = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("tasks")
      .select("*")
      .eq("assignee_id", user.id)
      .in("status", ["todo", "in_progress"])
      .order("created_at", { ascending: false })
      .limit(10);
    setTasks((data || []) as Task[]);
  };

  useEffect(() => {
    if (!user) return;
    loadTasks();

    const loadClients = async () => {
      const { data } = await supabase.from("clients").select("id, name").eq("status", "active");
      const map: Record<string, string> = {};
      (data || []).forEach((c: { id: string; name: string }) => { map[c.id] = c.name; });
      setClients(map);
    };
    loadClients();
  }, [user?.id]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sortedTasks = useMemo(() => {
    const order: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
    return [...tasks]
      .sort((a, b) => (order[a.priority] ?? 2) - (order[b.priority] ?? 2))
      .slice(0, 5);
  }, [tasks]);

  const handleQuickAdd = async () => {
    if (!newTitle.trim() || !user) return;
    setAdding(true);
    const todayStr = new Date().toISOString().split("T")[0];
    const { error } = await supabase.from("tasks").insert({
      title: newTitle.trim(),
      status: "todo",
      assignee_id: user.id,
      due_date: quickAddMode === "today" ? todayStr : null,
      priority: "medium",
    });
    if (error) {
      toast.error("No se pudo crear la tarea");
    } else {
      toast.success(quickAddMode === "today" ? "✅ Tarea añadida para hoy" : "📋 Tarea añadida al backlog");
      setNewTitle("");
      setShowQuickAdd(false);
      loadTasks();
    }
    setAdding(false);
  };

  const handleStartTimer = async (task: Task) => {
    await startTimer({
      description: task.title,
      taskId: task.id,
      clientId: task.client_id,
      projectId: task.project_id,
    });
    // Update task status to in_progress
    await supabase.from("tasks").update({ status: "in_progress" as const }).eq("id", task.id);
    toast.success(`⏱ Timer iniciado: ${task.title}`);
  };

  return (
    <WidgetCard
      title="Mi día de hoy"
      icon={CheckSquare}
      action={{ label: "Ver todas →", onClick: () => navigate("/tasks") }}
    >
      {/* Quick add buttons */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => { setQuickAddMode("today"); setShowQuickAdd(true); }}
          className="flex items-center gap-1.5 text-[11px] font-medium text-accent hover:text-accent/80 transition-colors"
        >
          <Plus className="h-3 w-3" /> Tarea hoy
        </button>
        <span className="text-foreground-muted/30">|</span>
        <button
          onClick={() => { setQuickAddMode("later"); setShowQuickAdd(true); }}
          className="flex items-center gap-1.5 text-[11px] font-medium text-foreground-secondary hover:text-foreground transition-colors"
        >
          <CalendarPlus className="h-3 w-3" /> Para después
        </button>
      </div>

      {/* Quick add input */}
      {showQuickAdd && (
        <div className="flex gap-2 mb-3 animate-in fade-in-0 slide-in-from-top-1 duration-200">
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleQuickAdd(); if (e.key === "Escape") { setShowQuickAdd(false); setNewTitle(""); } }}
            placeholder={quickAddMode === "today" ? "¿Qué harás hoy?" : "Tarea para después..."}
            className="h-8 text-sm"
            autoFocus
            disabled={adding}
          />
          <Button size="sm" onClick={handleQuickAdd} disabled={!newTitle.trim() || adding} className="h-8 px-3 text-xs">
            {adding ? "..." : "Crear"}
          </Button>
          <button onClick={() => { setShowQuickAdd(false); setNewTitle(""); }} className="text-foreground-muted hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Task list */}
      {sortedTasks.length === 0 ? (
        <div className="text-center py-6">
          <CheckSquare className="h-8 w-8 text-border mx-auto mb-2" />
          <p className="text-sm text-foreground-secondary">Sin tareas pendientes</p>
          <p className="text-[11px] text-foreground-muted mt-1">Agrega una tarea para empezar tu día</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {sortedTasks.map(task => {
            const clientName = task.client_id ? clients[task.client_id] : null;
            const isOverdue = task.due_date && new Date(task.due_date) < today && task.status !== "done";
            return (
              <div
                key={task.id}
                className={`rounded-xl border bg-card p-3 flex items-center gap-3 group hover:border-border transition-all ${isOverdue ? "border-l-4 border-l-destructive" : "border-border/40"}`}
              >
                <div className="flex-1 min-w-0 cursor-pointer hover:bg-muted/50 rounded-lg px-1 -mx-1 transition-colors" onClick={() => navigate("/tasks")}>
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${PRIORITY_BADGE[task.priority] || ""}`}>
                      {task.priority}
                    </span>
                    <span className="text-sm font-medium text-foreground truncate">{task.title}</span>
                  </div>
                  {clientName && (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: getClientColor(clientName) }} />
                      <span className="text-[11px] text-foreground-muted">{clientName}</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleStartTimer(task)}
                  className="h-7 w-7 rounded-full flex items-center justify-center text-foreground-muted hover:text-accent hover:bg-accent/10 opacity-0 group-hover:opacity-100 transition-all"
                  title="Iniciar timer"
                >
                  <Zap className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </WidgetCard>
  );
}
