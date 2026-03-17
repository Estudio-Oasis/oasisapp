/**
 * Plan feature gates.
 * Free tier: unlimited entries, limited history/export/team/insights.
 * Pro tier: full OasisOS access.
 */

export const FREE_LIMITS = {
  /** Max days of history visible (null = unlimited) */
  maxHistoryDays: 7,
  /** Can see team members' entries */
  showTeamView: false,
  /** Can export CSV/reports */
  allowExport: false,
  /** Can see advanced day insights / AI summaries */
  showAdvancedInsights: false,
  /** Can access OasisOS modules (clients, finances, hub, tasks) */
  allowOasisModules: false,
} as const;

export const PRO_LIMITS = {
  maxHistoryDays: null,
  showTeamView: true,
  allowExport: true,
  showAdvancedInsights: true,
  allowOasisModules: true,
} as const;

export function getPlanLimits(plan: "free" | "pro") {
  return plan === "pro" ? PRO_LIMITS : FREE_LIMITS;
}
