export type RankableTeam = {
  id: string;
  team_name: string;
  current_level: number;
  completion_status: string;
  start_time: string;
  end_time?: string | null;
  penalty_seconds?: number;
  total_time?: number;
};

/** Effective seconds for sorting in-progress teams (elapsed + penalty). */
export function effectiveSecondsInProgress(team: RankableTeam, nowMs: number): number {
  const raw = Math.floor((nowMs - new Date(team.start_time).getTime()) / 1000);
  return Math.max(0, raw + (team.penalty_seconds || 0));
}

/**
 * Live standings: rank 1 = best.
 * Completed teams first (fastest total_time first), then in-progress (higher level, then lower effective time).
 */
export function sortTeamsByStandings<T extends RankableTeam>(teams: T[], nowMs: number): T[] {
  return [...teams].sort((a, b) => {
    const aDone = a.completion_status === 'completed';
    const bDone = b.completion_status === 'completed';
    if (aDone !== bDone) return aDone ? -1 : 1;
    if (a.current_level !== b.current_level) return b.current_level - a.current_level;
    const aTime = aDone ? (a.total_time ?? 0) : effectiveSecondsInProgress(a, nowMs);
    const bTime = bDone ? (b.total_time ?? 0) : effectiveSecondsInProgress(b, nowMs);
    return aTime - bTime;
  });
}
