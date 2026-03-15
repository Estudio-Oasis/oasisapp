import { useCallback } from "react";

type ActivityEvent =
  | "launcher_opened"
  | "activity_started"
  | "activity_switched"
  | "activity_finished"
  | "pause_registered"
  | "recent_used"
  | "context_edited"
  | "flow_abandoned"
  | "gap_filled";

interface EventPayload {
  event: ActivityEvent;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

/**
 * Lightweight instrumentation hook for the Activity Registration Engine.
 * Currently logs to console. Can later pipe to an analytics table.
 */
export function useActivityTracking() {
  const track = useCallback((event: ActivityEvent, metadata?: Record<string, unknown>) => {
    const payload: EventPayload = {
      event,
      metadata,
      timestamp: new Date().toISOString(),
    };
    console.info("[activity-tracking]", payload);
  }, []);

  return { track };
}
