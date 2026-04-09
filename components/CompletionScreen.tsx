'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Confetti } from '@/components/Confetti';
import { Trophy, Clock, Medal } from 'lucide-react';

export function CompletionScreen({ teamData }: { teamData: any }) {
  const [finalTime, setFinalTime] = useState('');

  useEffect(() => {
    const totalSeconds = Number.isFinite(teamData?.totalTime)
      ? teamData.totalTime
      : Math.floor((new Date().getTime() - new Date(teamData.startTime).getTime()) / 1000);

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      setFinalTime(`${hours}h ${minutes}m ${seconds}s`);
    } else if (minutes > 0) {
      setFinalTime(`${minutes}m ${seconds}s`);
    } else {
      setFinalTime(`${seconds}s`);
    }
  }, [teamData.startTime]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Confetti />

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 100 }}
        className="w-full max-w-2xl"
      >
        <motion.div
          animate={{
            y: [0, -10, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
          className="mb-8 flex justify-center"
        >
          <Trophy className="w-24 h-24 text-yellow-400" />
        </motion.div>

        <div className="bg-gradient-to-br from-purple-900/30 via-blue-900/30 to-cyan-900/30 backdrop-blur-xl border border-purple-500/30 rounded-3xl p-8 md:p-12 shadow-2xl text-center">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl md:text-5xl font-bold text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text mb-4"
          >
            Quest Complete!
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-2xl md:text-3xl font-bold text-gray-200 mb-8"
          >
            {teamData.teamName}
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10"
          >
            <div className="bg-slate-800/50 rounded-xl p-6 border border-cyan-500/30">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-cyan-400" />
                <p className="text-sm text-gray-400">Total Time</p>
              </div>
              <p className="text-3xl font-mono font-bold text-cyan-300">{finalTime}</p>
            </div>

            <div className="bg-slate-800/50 rounded-xl p-6 border border-purple-500/30">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Medal className="w-5 h-5 text-purple-400" />
                <p className="text-sm text-gray-400">Achievement</p>
              </div>
              <p className="text-3xl font-bold text-purple-300">All Levels</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mb-8 p-6 bg-gradient-to-r from-purple-900/40 to-cyan-900/40 rounded-xl border border-purple-500/30"
          >
            <p className="text-gray-300 leading-relaxed">
              You have successfully navigated all five realms of the Treasure Hunt and uncovered the ultimate treasure. 
              Your swift completion and strategic thinking have earned you a place in the hall of legends.
            </p>
          </motion.div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-8 rounded-lg transition-all duration-200"
          >
            Start New Quest
          </motion.button>

          <p className="text-gray-400 text-xs mt-6">
            Check the leaderboard to see your final ranking
          </p>
        </div>
      </motion.div>
    </div>
  );
}
