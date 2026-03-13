import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { X, Check, Circle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface OnboardingChecklistProps {
  onboarded: boolean;
}

export function OnboardingChecklist({ onboarded }: OnboardingChecklistProps) {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [profileComplete, setProfileComplete] = useState(false);
  const [timeLogged, setTimeLogged] = useState(false);

  useEffect(() => {
    if (!user || onboarded) return;

    // Check if dismissed within last 72 hours
    const dismissedAt = localStorage.getItem(`checklist_dismissed_${user.id}`);
    if (dismissedAt) {
      const elapsed = Date.now() - parseInt(dismissedAt);
      if (elapsed < 72 * 60 * 60 * 1000) {
        setDismissed(true);
      } else {
        localStorage.removeItem(`checklist_dismissed_${user.id}`);
      }
    }

    const checkStatus = async () => {
      // Check profile completeness
      const { data: profile } = await supabase
        .from("profiles")
        .select("name, avatar_url")
        .eq("id", user.id)
        .single();

      setProfileComplete(!!(profile?.name && profile?.avatar_url));

      // Check if user has logged 30+ minutes
      const { data: entries } = await supabase
        .from("time_entries")
        .select("duration_min")
        .eq("user_id", user.id);

      const totalMin = (entries || []).reduce(
        (sum, e) => sum + (e.duration_min || 0),
        0
      );
      setTimeLogged(totalMin >= 30);
    };

    checkStatus();
  }, [user, onboarded]);

  // Auto-mark onboarded when all items complete
  useEffect(() => {
    if (profileComplete && timeLogged && user && !onboarded) {
      supabase
        .from("profiles")
        .update({ onboarded: true })
        .eq("id", user.id);
    }
  }, [profileComplete, timeLogged, user, onboarded]);

  if (onboarded || dismissed) return null;

  const items = [
    { label: "Cuenta creada", done: true },
    { label: "Completa tu perfil", done: profileComplete },
    { label: "Registra 30 min", done: timeLogged },
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
            <div
              key={item.label}
              className="flex items-center gap-2 text-xs"
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
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
