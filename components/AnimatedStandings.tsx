'use client';

import { LayoutGroup, motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import type { RankableTeam } from '@/lib/leaderboard-rank';
import { sortTeamsByStandings, effectiveSecondsInProgress } from '@/lib/leaderboard-rank';

function formatClock(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

type Variant = 'player' | 'admin';

type Props = {
  teams: RankableTeam[];
  nowMs: number;
  currentTeamId?: string;
  variant?: Variant;
  title?: string;
  attemptsByTeam?: Record<string, number>;
  /** Admin: show extra columns */
  showAdminExtras?: boolean;
  layoutGroupId: string;
};

export function AnimatedStandings({
  teams,
  nowMs,
  currentTeamId,
  variant = 'player',
  title = 'Live standings',
  attemptsByTeam,
  showAdminExtras = false,
  layoutGroupId,
}: Props) {
  const ranked = sortTeamsByStandings(teams, nowMs);

  const containerClass =
    variant === 'admin'
      ? 'rounded-xl border border-amber-400/25 bg-slate-900/70 backdrop-blur-md p-4 shadow-xl'
      : 'bg-gradient-to-br from-slate-900/80 via-slate-800/80 to-slate-900/80 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-6';

  return (
    <div className={containerClass}>
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-yellow-400" />
        <h3
          className={
            variant === 'admin'
              ? 'text-lg font-bold text-transparent bg-gradient-to-r from-amber-200 to-orange-200 bg-clip-text'
              : 'text-lg font-bold text-transparent bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text'
          }
        >
          {title}
        </h3>
      </div>

      <LayoutGroup id={layoutGroupId}>
        <div className="flex flex-col gap-2 relative">
          {ranked.map((team, index) => {
            const rank = index + 1;
            const isCurrent = currentTeamId && team.id === currentTeamId;
            const done = team.completion_status === 'completed';
            const timeVal = done
              ? (team.total_time ?? 0)
              : effectiveSecondsInProgress(team, nowMs);

            return (
              <motion.div
                key={team.id}
                layout
                layoutId={`standings-${layoutGroupId}-${team.id}`}
                transition={{
                  type: 'spring',
                  stiffness: 350,
                  damping: 30,
                  mass: 0.8,
                }}
                className={`rounded-lg border p-3 flex items-center gap-3 ${
                  isCurrent
                    ? 'bg-purple-500/25 border-purple-400/50 ring-1 ring-purple-400/30'
                    : done
                      ? 'bg-emerald-950/40 border-emerald-500/25'
                      : 'bg-slate-800/50 border-slate-600/40'
                }`}
              >
                <motion.div
                  layout="position"
                  className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center font-bold text-sm ${
                    rank === 1
                      ? 'bg-yellow-500/35 text-yellow-200'
                      : rank === 2
                        ? 'bg-slate-400/35 text-slate-200'
                        : rank === 3
                          ? 'bg-orange-500/30 text-orange-200'
                          : 'bg-slate-600/40 text-gray-300'
                  }`}
                >
                  {rank}
                </motion.div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`font-semibold truncate ${isCurrent ? 'text-purple-200' : 'text-gray-200'}`}
                  >
                    {team.team_name}
                  </p>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-400 mt-0.5">
                    <span className={done ? 'text-emerald-400' : 'text-cyan-400'}>
                      Lvl {team.current_level}
                      {done ? ' · Done' : ''}
                    </span>
                    <span className="font-mono text-gray-300">{formatClock(Math.max(0, timeVal))}</span>
                    {showAdminExtras && attemptsByTeam && (
                      <span className="text-amber-200/80">Attempts: {attemptsByTeam[team.id] ?? 0}</span>
                    )}
                  </div>
                </div>
                {done && (
                  <motion.span
                    layout="position"
                    className="text-emerald-400 text-lg shrink-0"
                    initial={false}
                  >
                    ✓
                  </motion.span>
                )}
              </motion.div>
            );
          })}
        </div>
      </LayoutGroup>

      <p className="text-xs text-gray-500 mt-4 text-center">Ranks update live — watch rows move as standings change</p>
    </div>
  );
}
