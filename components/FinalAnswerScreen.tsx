'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface FinalAnswerScreenProps {
  teamName: string;
  onSubmit: (answer: string) => Promise<void>;
  loading: boolean;
  error: string;
}

export function FinalAnswerScreen({
  teamName,
  onSubmit,
  loading,
  error,
}: FinalAnswerScreenProps) {
  const [answer, setAnswer] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(answer);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="w-full max-w-2xl"
      >
        <div className="bg-gradient-to-br from-purple-900/30 via-blue-900/30 to-cyan-900/30 backdrop-blur-xl border border-purple-500/30 rounded-3xl p-8 md:p-12 shadow-2xl">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl md:text-5xl font-bold text-center mb-4 text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text"
          >
            Final Challenge
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center text-gray-300 text-lg mb-8 leading-relaxed"
          >
            You have collected all the numbers from each level. Now arrange them in order and convert them to alphabets.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-slate-800/50 rounded-xl p-6 border border-cyan-500/30 mb-8 space-y-3"
          >
            <p className="text-cyan-300 text-center text-sm font-semibold">
              Numbers collected (in order):
            </p>
            <p className="text-pink-300 text-center text-xl font-bold tracking-widest">
              16 • 18 • 11 • 25 • 1
            </p>
            <p className="text-cyan-300 text-center text-sm mt-4">
              Convert these numbers to alphabets (A=1, B=2... Z=26) and you will reveal the FCC person&apos;s initials.
            </p>
            <p className="text-purple-300 text-center text-sm mt-2">
              Go to the 6th floor, find that person, and enter the passcode shown by them.
            </p>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Passcode from 6th Floor
              </label>
              <Input
                type="text"
                value={answer}
                onChange={(e) => setAnswer(e.target.value.toUpperCase())}
                placeholder="Enter the passcode..."
                disabled={loading}
                className="bg-slate-800/50 border-cyan-500/30 text-white placeholder-gray-500 text-center text-lg uppercase tracking-widest"
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
              disabled={loading || !answer.trim()}
              className={`w-full text-white font-bold py-3 rounded-lg transition-all duration-200 ${
                answer.trim()
                  ? 'bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 shadow-lg shadow-emerald-500/30'
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
              }`}
            >
              {loading ? 'Validating...' : 'Complete Challenge'}
            </Button>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
}
