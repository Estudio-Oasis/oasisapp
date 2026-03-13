import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { X, Check, Circle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface OnboardingChecklistProps {
  onboarded: boolean;
  onOpenProfile: () => void;
  onOpenTimer: () => void;
}

export function OnboardingChecklist({ onboarded, onOpenProfile, onOpenTimer }: OnboardingChecklistProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);
  const [profileComplete, setProfileComplete] = useState(false);
  const [hasTask, setHasTask] = useState(false);
  const [timeLogged, setTimeLogged] = useState(false);

  const checkStatus = useCallback(async () => {
    if (!user) return;

    const [{ data: profile }, { count: taskCount }, { data: entries }] = await Promise.all([
      supabase.from("profiles").select("name, avatar_url").eq("id", user.id).single(),
      supabase.from("tasks").select("id", { count: "exact", head: true }).eq("assignee_id", user.id),
      supabase.from("time_entries").select("duration_min").eq("user_id", user.id),
    ]);

    setProfileComplete(!!(profile?.name));
    setHasTask((taskCount ?? 0) > 0);
    const totalMin = (entries || []).reduce((sum, e) => sum + (e.duration_min || 0), 0);
    setTimeLogged(totalMin >= 30);
  }, [user]);

  useEffect(() => {
    if (!user || onboarded) return;

    // Check dismissed
    const dismissedAt = localStorage.getItem(`checklist_dismissed_${user.id}`);
    if (dismissedAt) {
      const elapsed = Date.now() - parseInt(dismissedAt);
      if (elapsed < 72 * 60 * 60 * 1000) {
        setDismissed(true);
        return;
      }
      localStorage.removeItem(`checklist_dismissed_${user.id}`);
    }

    checkStatus();

    // Poll every 30 seconds
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, [user, onboarded, checkStatus]);

  // Auto-mark onboarded when all items complete
  useEffect(() => {
    if (profileComplete && hasTask && timeLogged && user && !onboarded) {
      supabase.from("profiles").update({ onboarded: true }).eq("id", user.id);
    }
  }, [profileComplete, hasTask, timeLogged, user, onboarded]);

  if (onboarded || dismissed) return null;

  const items = [
    { label: "Cuenta creada", done: true, action: undefined },
    { label: "Completa tu perfil", done: profileComplete, action: onOpenProfile },
    { label: "Crea tu primera tarea", done: hasTask, action: () => navigate("/tasks") },
    { label: "Registra 30 minutos", done: timeLogged, action: onOpenTimer },
  ];

  const doneCount = items.filter((i) => i.done).length;
  const progress = Math.round((doneCount / items.length) * 100);

  const handleDismiss = () => {
    if (user) {
      localStorage.setItem(`checklist_dismissed_${user.id}`, Date.now().toString());
    }
    setDismissed(true);
  };

  return (
    <div className="px-3 mb-3">
      <div className="rounded-lg border border-border bg-background-secondary p-3 space-y-2.5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground">
            Tu primer día{" "}
            <span className="text-foreground-muted font-normal">
              {doneCount}/{items.length}
            </span>
          </span>
          <button
            onClick={handleDismiss}
            className="h-5 w-5 flex items-center justify-center rounded hover:bg-background-tertiary text-foreground-muted"
          >
            <X className="h-3 w-3" />
          </button>
        </div>

        {/* Progress */}
        <Progress value={progress} className="h-1.5" />

        {/* Items */}
        <div className="space-y-1">
          {items.map((item) => (
            <button
              key={item.label}
              onClick={item.action}
              disabled={item.done || !item.action}
              className="flex items-center gap-2 text-xs w-full text-left disabled:cursor-default hover:text-accent transition-colors"
            >
              {item.done ? (
                <Check className="h-3.5 w-3.5 text-success shrink-0" />
              ) : (
                <Circle className="h-3.5 w-3.5 text-foreground-muted shrink-0" />
              )}
              <span
                className={
                  item.done
                    ? "text-foreground-secondary line-through"
                    : "text-foreground"
                }
              >
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
