'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loginId, password }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error || 'Login failed');
        return;
      }
      router.push('/admin');
      router.refresh();
    } catch {
      setError('Unable to login right now.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/50 to-black text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-cyan-500/30 bg-slate-900/70 backdrop-blur-xl p-8 shadow-2xl shadow-cyan-900/20">
        <h1 className="text-3xl font-bold mb-2 text-transparent bg-gradient-to-r from-cyan-400 to-fuchsia-400 bg-clip-text">
          Admin Login
        </h1>
        <p className="text-sm text-slate-300 mb-6">Authorized organizers only.</p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-slate-300 block mb-1">Login ID</label>
            <input
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 focus:border-cyan-400 outline-none"
              placeholder="Enter admin login ID"
            />
          </div>
          <div>
            <label className="text-sm text-slate-300 block mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 focus:border-cyan-400 outline-none"
              placeholder="Enter password"
            />
          </div>

          {error ? <div className="text-sm text-red-300 bg-red-900/30 border border-red-500/40 rounded-md p-2">{error}</div> : null}

          <button
            type="submit"
            disabled={loading || !loginId.trim() || !password.trim()}
            className="w-full py-2.5 rounded-lg font-semibold bg-gradient-to-r from-cyan-600 to-fuchsia-600 hover:from-cyan-500 hover:to-fuchsia-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
