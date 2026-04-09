'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type TeamRow = {
  id: string;
  team_name: string;
  current_level: number;
  completion_status: string;
  start_time: string;
  end_time: string | null;
  penalty_seconds: number;
  total_time: number;
};

type AttemptRow = {
  team_id: string;
  level: number;
  attempt_count: number;
};

function formatClock(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function fmtIst(value: string | null) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(new Date(value));
}

export default function AdminPage() {
  const supabase = createClient();
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [attempts, setAttempts] = useState<AttemptRow[]>([]);
  const [nowMs, setNowMs] = useState(Date.now());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    const refresh = async () => {
      const [teamsRes, attemptsRes] = await Promise.all([
        supabase
          .from('teams')
          .select('id, team_name, current_level, completion_status, start_time, end_time, penalty_seconds, total_time')
          .order('completion_status', { ascending: false })
          .order('current_level', { ascending: false }),
        supabase.from('level_attempts').select('team_id, level, attempt_count'),
      ]);

      if (!teamsRes.error && teamsRes.data) setTeams(teamsRes.data as TeamRow[]);
      if (!attemptsRes.error && attemptsRes.data) setAttempts(attemptsRes.data as AttemptRow[]);
      setLoading(false);
    };

    refresh();
    const pollId = setInterval(refresh, 3000);
    const clockId = setInterval(() => setNowMs(Date.now()), 1000);

    const channel = supabase
      .channel('admin_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'level_attempts' }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'level_completions' }, refresh)
      .subscribe();

    return () => {
      clearInterval(pollId);
      clearInterval(clockId);
      channel.unsubscribe();
    };
  }, [supabase]);

  const attemptsByTeam = useMemo(() => {
    return attempts.reduce<Record<string, number>>((acc, row) => {
      acc[row.team_id] = (acc[row.team_id] || 0) + (row.attempt_count || 0);
      return acc;
    }, {});
  }, [attempts]);

  const stats = useMemo(() => {
    const totalTeams = teams.length;
    const completed = teams.filter((t) => t.completion_status === 'completed').length;
    const inProgress = teams.filter((t) => t.completion_status === 'in_progress').length;
    const totalAttempts = attempts.reduce((sum, row) => sum + (row.attempt_count || 0), 0);
    return { totalTeams, completed, inProgress, totalAttempts };
  }, [teams, attempts]);

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    window.location.href = '/admin/login';
  };

  if (!supabase) {
    return <div className="p-8 text-gray-200">Supabase is not configured. Admin dashboard is unavailable.</div>;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#1e1b4b_0%,_#020617_45%,_#000_100%)] text-gray-100 p-6 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div className="absolute -top-24 -left-24 w-80 h-80 bg-fuchsia-500/30 blur-3xl rounded-full" />
        <div className="absolute top-20 right-0 w-96 h-96 bg-cyan-500/20 blur-3xl rounded-full" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-transparent bg-gradient-to-r from-cyan-300 via-sky-300 to-fuchsia-300 bg-clip-text">
              Admin Live Dashboard
            </h1>
            <p className="text-sm text-gray-300 mt-1">Real-time tracking of team progress, attempts, and effective time (IST).</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-lg border border-rose-400/40 bg-rose-500/20 hover:bg-rose-500/30 text-rose-100 transition"
          >
            Logout
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="rounded-xl border border-cyan-400/30 bg-cyan-500/10 p-4 backdrop-blur-md">
            <p className="text-xs text-cyan-200 uppercase tracking-widest">Total Teams</p>
            <p className="text-3xl font-bold text-cyan-100 mt-2">{stats.totalTeams}</p>
          </div>
          <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4 backdrop-blur-md">
            <p className="text-xs text-emerald-200 uppercase tracking-widest">Completed</p>
            <p className="text-3xl font-bold text-emerald-100 mt-2">{stats.completed}</p>
          </div>
          <div className="rounded-xl border border-indigo-400/30 bg-indigo-500/10 p-4 backdrop-blur-md">
            <p className="text-xs text-indigo-200 uppercase tracking-widest">In Progress</p>
            <p className="text-3xl font-bold text-indigo-100 mt-2">{stats.inProgress}</p>
          </div>
          <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-4 backdrop-blur-md">
            <p className="text-xs text-amber-200 uppercase tracking-widest">Wrong Attempts</p>
            <p className="text-3xl font-bold text-amber-100 mt-2">{stats.totalAttempts}</p>
          </div>
        </div>

      {loading ? (
          <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-6">Loading live data...</div>
      ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-600/70 bg-slate-900/60 backdrop-blur-md shadow-2xl">
            <table className="w-full text-sm">
              <thead className="bg-slate-900/90">
              <tr>
                <th className="text-left p-3 text-cyan-200">Team</th>
                <th className="text-left p-3 text-cyan-200">Current Level</th>
                <th className="text-left p-3 text-cyan-200">Status</th>
                <th className="text-left p-3 text-cyan-200">Start Time (IST)</th>
                <th className="text-left p-3 text-cyan-200">End Time (IST)</th>
                <th className="text-left p-3 text-cyan-200">Wrong Attempts</th>
                <th className="text-left p-3 text-cyan-200">Penalty</th>
                <th className="text-left p-3 text-cyan-200">Effective Time</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team) => {
                const baseSeconds = team.end_time
                  ? Math.floor((new Date(team.end_time).getTime() - new Date(team.start_time).getTime()) / 1000)
                  : Math.floor((nowMs - new Date(team.start_time).getTime()) / 1000);
                const total = team.completion_status === 'completed'
                  ? team.total_time
                  : Math.max(0, baseSeconds + (team.penalty_seconds || 0));
                return (
                  <tr key={team.id} className="border-t border-slate-800/80 hover:bg-slate-800/40 transition">
                    <td className="p-3 font-semibold text-slate-100">{team.team_name}</td>
                    <td className="p-3">
                      <span className="inline-flex px-2.5 py-1 rounded-md bg-indigo-500/20 border border-indigo-400/40 text-indigo-100">
                        L{team.current_level}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-md border ${
                          team.completion_status === 'completed'
                            ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-100'
                            : 'bg-amber-500/20 border-amber-400/40 text-amber-100'
                        }`}
                      >
                        {team.completion_status}
                      </span>
                    </td>
                    <td className="p-3">{fmtIst(team.start_time)}</td>
                    <td className="p-3">{fmtIst(team.end_time)}</td>
                    <td className="p-3">{attemptsByTeam[team.id] || 0}</td>
                    <td className="p-3">+{Math.floor((team.penalty_seconds || 0) / 60)}m</td>
                    <td className="p-3 font-mono text-cyan-100">{formatClock(Math.max(0, total || 0))}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      </div>
    </div>
  );
}
