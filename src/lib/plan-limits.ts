/**
 * Plan feature gates.
 * Free tier: unlimited entries, limited history/export/team/insights.
 * Pro tier: full OasisOS access.
 */

export const FREE_LIMITS = {
  planDisplayName: "Bitácora Personal",
  /** Max days of history visible (null = unlimited) */
  maxHistoryDays: 14,
  /** Can see team members' entries */
  showTeamView: false,
  /** Can export CSV/reports */
  allowExport: false,
  /** Can see advanced day insights / AI summaries */
  showAdvancedInsights: false,
  /** Can access OasisOS modules (clients, finances, hub, tasks) */
  allowOasisModules: false,
  /** Max AI refine uses per day */
  maxAiRefinePerDay: 5,
} as const;

export const PRO_LIMITS = {
  planDisplayName: "Task Master",
  maxHistoryDays: null,
  showTeamView: true,
  allowExport: true,
  showAdvancedInsights: true,
  allowOasisModules: true,
  maxAiRefinePerDay: null,
} as const;

export function getPlanLimits(plan: "free" | "pro") {
  return plan === "pro" ? PRO_LIMITS : FREE_LIMITS;
}
