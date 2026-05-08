import { supabase } from "@/integrations/supabase/client";

export type ActivityCategory =
  | "profile"
  | "auth"
  | "identity"
  | "session"
  | "security"
  | "preferences"
  | "team"
  | "other";

export interface LogActivityInput {
  category: ActivityCategory;
  action: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Persist an account activity event for audit history.
 * Silently no-ops if the user is not authenticated; failures are logged to console only
 * so they never block the originating UX action.
 */
export async function logActivity(input: LogActivityInput): Promise<void> {
  try {
    const { data: auth } = await supabase.auth.getUser();
    const user = auth.user;
    if (!user) return;

    let agencyId: string | null = null;
    const { data: profile } = await supabase
      .from("profiles")
      .select("agency_id")
      .eq("id", user.id)
      .maybeSingle();
    agencyId = (profile as { agency_id: string | null } | null)?.agency_id ?? null;

    const ua = typeof navigator !== "undefined" ? navigator.userAgent : null;

    await supabase.from("account_activity_log" as never).insert({
      user_id: user.id,
      agency_id: agencyId,
      category: input.category,
      action: input.action,
      description: input.description ?? null,
      metadata: input.metadata ?? {},
      user_agent: ua,
    } as never);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[activityLog] failed", err);
  }
}
