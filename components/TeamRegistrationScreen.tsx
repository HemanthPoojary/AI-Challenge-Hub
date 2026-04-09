'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export function TeamRegistrationScreen({ onComplete }: { onComplete: (data: any) => void }) {
  const router = useRouter();
  const [mode, setMode] = useState<'player' | 'admin'>('player');
  const [teamName, setTeamName] = useState('');
  const [playerPassword, setPlayerPassword] = useState('');
  const [adminLoginId, setAdminLoginId] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Call server API to hash password securely
      const response = await fetch('/api/register-team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamName,
          password: playerPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Registration failed');
        return;
      }

      onComplete({
        id: result.id,
        teamName: result.team_name,
        currentLevel: result.current_level,
        startTime: result.start_time,
        penaltySeconds: result.penalty_seconds || 0,
        questionOrder: result.questionOrder || result.question_order || [1, 2, 3, 4, 5],
      });
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loginId: adminLoginId,
          password: adminPassword,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        setError(result.error || 'Admin login failed');
        return;
      }

      router.push('/admin');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Unable to login right now');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="w-full max-w-md"
      >
        <div className="bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-cyan-900/20 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-8 shadow-2xl">
          <h1 className="text-4xl font-bold text-center mb-2 bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
            Treasure Hunt
          </h1>
          <p className="text-center text-gray-300 mb-5">Choose login type to continue</p>

          <div className="grid grid-cols-2 gap-2 mb-6 p-1 rounded-lg bg-slate-800/50 border border-purple-500/20">
            <button
              type="button"
              onClick={() => {
                setError('');
                setMode('player');
              }}
              className={`rounded-md py-2 text-sm font-semibold transition ${
                mode === 'player' ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-slate-700/70'
              }`}
            >
              Player Login
            </button>
            <button
              type="button"
              onClick={() => {
                setError('');
                setMode('admin');
              }}
              className={`rounded-md py-2 text-sm font-semibold transition ${
                mode === 'admin' ? 'bg-cyan-600 text-white' : 'text-gray-300 hover:bg-slate-700/70'
              }`}
            >
              Admin Login
            </button>
          </div>

          {mode === 'player' ? (
            <form onSubmit={handleRegister} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Team Name</label>
                <Input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Enter your team name"
                  required
                  className="bg-slate-800/50 border-purple-500/30 text-white placeholder-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                <Input
                  type="password"
                  value={playerPassword}
                  onChange={(e) => setPlayerPassword(e.target.value)}
                  placeholder="Create a password"
                  required
                  className="bg-slate-800/50 border-purple-500/30 text-white placeholder-gray-500"
                />
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-300 text-sm"
                >
                  {error}
                </motion.div>
              )}

              <Button
                type="submit"
                disabled={loading || !teamName || !playerPassword}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-2 rounded-lg transition-all duration-200"
              >
                {loading ? 'Registering...' : 'Start Quest'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleAdminLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Admin Login ID</label>
                <Input
                  type="text"
                  value={adminLoginId}
                  onChange={(e) => setAdminLoginId(e.target.value)}
                  placeholder="Enter admin login ID"
                  required
                  className="bg-slate-800/50 border-cyan-500/30 text-white placeholder-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Admin Password</label>
                <Input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Enter admin password"
                  required
                  className="bg-slate-800/50 border-cyan-500/30 text-white placeholder-gray-500"
                />
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-300 text-sm"
                >
                  {error}
                </motion.div>
              )}

              <Button
                type="submit"
                disabled={loading || !adminLoginId || !adminPassword}
                className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-bold py-2 rounded-lg transition-all duration-200"
              >
                {loading ? 'Signing in...' : 'Open Admin Dashboard'}
              </Button>
            </form>
          )}

          <p className="text-center text-xs text-gray-400 mt-6">
            Secure login • IST Timezone • Real-time Leaderboard
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

