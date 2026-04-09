'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface LevelCardProps {
  level: {
    level: number;
    title: string;
    description: string;
    hint: string;
  };
  currentAttempts: number;
  onSubmitPasscode: (passcode: string) => Promise<void>;
  loading: boolean;
  error: string;
  passcode: string;
  onPasscodeChange: (value: string) => void;
  revealNumber?: number;
}

export function LevelCard({
  level,
  currentAttempts,
  onSubmitPasscode,
  loading,
  error,
  passcode,
  onPasscodeChange,
  revealNumber,
}: LevelCardProps) {
  const [showHint, setShowHint] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmitPasscode(passcode);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-gradient-to-br from-slate-900/80 via-slate-800/80 to-slate-900/80 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-8 shadow-2xl"
    >
      {/* Level Header */}
      <div className="mb-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-3 mb-3"
        >
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <span className="text-white font-bold text-lg">{level.level}</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-transparent bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text">
              {level.title}
            </h2>
          </div>
        </motion.div>
      </div>

      {/* Level Description */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-gray-300 mb-6 leading-relaxed"
      >
        {level.description}
      </motion.p>

      {/* Hint Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mb-8"
      >
        <button
          onClick={() => setShowHint(!showHint)}
          className="text-sm text-cyan-400 hover:text-cyan-300 underline transition-colors"
        >
          {showHint ? '✕ Hide hint' : '? Show hint'}
        </button>
        {showHint && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 p-4 bg-cyan-900/20 border border-cyan-500/30 rounded-lg text-cyan-300 text-sm"
          >
            {level.hint}
          </motion.div>
        )}
      </motion.div>

      {/* Passcode Input Form */}
      <form onSubmit={handleSubmit} className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Passcode</label>
          <Input
            type="text"
            value={passcode}
            onChange={(e) => onPasscodeChange(e.target.value.toUpperCase())}
            placeholder="Enter the passcode..."
            disabled={loading}
            className="bg-slate-800/50 border-cyan-500/30 text-white placeholder-gray-500 uppercase text-center tracking-widest"
          />
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-gap-2 bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-300 text-sm"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </motion.div>
        )}

        <Button
          type="submit"
          disabled={loading || !passcode.trim()}
          className="w-full bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 text-white font-bold py-2 rounded-lg transition-all duration-200"
        >
          {loading ? 'Validating...' : 'Submit Passcode'}
        </Button>
      </form>

      {/* Reveal Number - shown when level is completed */}
      {revealNumber !== undefined && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6 p-6 bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-500/50 rounded-lg text-center"
        >
          <p className="text-green-300 text-sm font-semibold mb-2">✓ Level Complete!</p>
          <p className="text-gray-300 text-sm mb-2">Your Reward Number:</p>
          <p className="text-5xl font-bold text-transparent bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text">
            {revealNumber}
          </p>
        </motion.div>
      )}

      {/* Attempt Counter */}
      <div className="flex items-center justify-between text-sm text-gray-400">
        <span>Wrong Attempts: {currentAttempts}</span>
        <span className="text-xs">+1 min penalty per wrong attempt</span>
      </div>
    </motion.div>
  );
}
