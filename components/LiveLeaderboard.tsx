'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { motion } from 'framer-motion';
import { AnimatedStandings } from '@/components/AnimatedStandings';
import type { RankableTeam } from '@/lib/leaderboard-rank';
import { sortTeamsByStandings } from '@/lib/leaderboard-rank';

export function LiveLeaderboard({
  currentTeamId,
  maxTeams = 15,
  fullList = false,
}: {
  currentTeamId: string;
  /** Max rows in sidebar (ignored when fullList is true). */
  maxTeams?: number;
  /** Show every team (e.g. completion screen) with live updates. */
  fullList?: boolean;
}) {
  const [leaderboard, setLeaderboard] = useState<RankableTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [nowMs, setNowMs] = useState(Date.now());
  const supabase = createClient();

  useEffect(() => {
    const clock = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(clock);
  }, []);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    const fetchLeaderboard = async () => {
      try {
        const { data, error } = await supabase
          .from('teams')
          .select('id, team_name, current_level, completion_status, start_time, total_time, penalty_seconds')
          .order('id', { ascending: true });

        if (!error && data) {
          setLeaderboard(data as RankableTeam[]);
        }
      } catch (err) {
        console.error('Failed to fetch leaderboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
    const pollId = setInterval(fetchLeaderboard, 5000);

    const subscription = supabase
      .channel('leaderboard_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'teams',
        },
        () => {
          fetchLeaderboard();
        }
      )
      .subscribe();

    return () => {
      clearInterval(pollId);
      subscription.unsubscribe();
    };
  }, [supabase]);

  if (!supabase) {
    return (
      <div className="bg-gradient-to-br from-slate-900/80 via-slate-800/80 to-slate-900/80 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-6 h-full flex items-center justify-center">
        <div className="text-gray-400 text-center">Live leaderboard unavailable (Supabase not configured).</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-slate-900/80 via-slate-800/80 to-slate-900/80 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-6 h-full flex items-center justify-center">
        <div className="text-gray-400">Loading leaderboard...</div>
      </div>
    );
  }

  const ranked = sortTeamsByStandings(leaderboard, nowMs);
  const displayTeams = fullList ? ranked : ranked.slice(0, Math.max(1, maxTeams));

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className={fullList ? 'w-full max-w-3xl mx-auto' : 'sticky top-24'}
    >
      <AnimatedStandings
        layoutGroupId={fullList ? `completion-lb-${currentTeamId}` : `player-lb-${currentTeamId}`}
        teams={displayTeams}
        nowMs={nowMs}
        currentTeamId={currentTeamId}
        variant="player"
        title={fullList ? 'Live rankings — all teams' : 'Live Leaderboard'}
      />
    </motion.div>
  );
}
