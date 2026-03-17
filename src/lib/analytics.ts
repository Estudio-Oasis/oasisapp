import { supabase } from "@/integrations/supabase/client";

/** Lazily-generated session ID for grouping events in one visit */
function getSessionId(): string {
  const KEY = "bitacora_session_id";
  let sid = sessionStorage.getItem(KEY);
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem(KEY, sid);
  }
  return sid;
}

/**
 * Fire-and-forget analytics event.
 * Never throws — analytics must never break the app.
 */
export function trackEvent(
  event: string,
  metadata?: Record<string, unknown>
) {
  try {
    const base: Record<string, unknown> = {
      page: window.location.pathname,
      is_demo: window.location.pathname.includes("demo"),
      ts: Date.now(),
      ...metadata,
    };

    supabase
      .from("analytics_events" as any)
      .insert({
        event,
        session_id: getSessionId(),
        metadata: base,
      })
      .then(() => {});
  } catch {
    // silent
  }
}
