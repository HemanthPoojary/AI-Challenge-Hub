'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';

export function LiveLeaderboard({ currentTeamId }: { currentTeamId: string }) {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

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
          .order('completion_status', { ascending: false })
          .order('current_level', { ascending: false })
          .order('total_time', { ascending: true });

        if (!error) {
          setLeaderboard(data || []);
        }
      } catch (err) {
        console.error('Failed to fetch leaderboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
    const pollId = setInterval(fetchLeaderboard, 5000);

    // Subscribe to real-time updates
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

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-gradient-to-br from-slate-900/80 via-slate-800/80 to-slate-900/80 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-6 sticky top-24"
    >
      <div className="flex items-center gap-2 mb-6">
        <Trophy className="w-5 h-5 text-yellow-400" />
        <h3 className="text-lg font-bold text-transparent bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text">
          Live Leaderboard
        </h3>
      </div>

      <div className="space-y-3">
        {leaderboard.slice(0, 10).map((team, index) => {
          const isCurrentTeam = team.id === currentTeamId;
          const isCompleted = team.completion_status === 'completed';

          return (
            <motion.div
              key={team.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`p-3 rounded-lg border transition-all ${
                isCurrentTeam
                  ? 'bg-purple-500/20 border-purple-500/50'
                  : 'bg-slate-700/30 border-slate-600/30 hover:bg-slate-700/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                      index === 0
                        ? 'bg-yellow-500/30 text-yellow-300'
                        : index === 1
                          ? 'bg-gray-400/30 text-gray-300'
                          : index === 2
                            ? 'bg-orange-400/30 text-orange-300'
                            : 'bg-slate-600/30 text-gray-300'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-semibold truncate ${
                        isCurrentTeam ? 'text-purple-300' : 'text-gray-300'
                      }`}
                    >
                      {team.team_name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-400">
                  {isCompleted && (
                    <motion.span
                      animate={{
                        scale: [1, 1.1, 1],
                      }}
                      transition={{
                        duration: 0.5,
                        repeat: Infinity,
                      }}
                      className="text-green-400 font-bold"
                    >
                      ✓
                    </motion.span>
                  )}
                  <span className={isCompleted ? 'text-green-400' : 'text-cyan-400'}>
                    Lvl {team.current_level}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <p className="text-xs text-gray-500 mt-6 text-center">Updates in real-time</p>
    </motion.div>
  );
}
