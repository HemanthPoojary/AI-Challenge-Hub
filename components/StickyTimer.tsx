'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export function StickyTimer({
  startTime,
  penaltySeconds = 0,
}: {
  startTime: string;
  penaltySeconds?: number;
}) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [istTime, setIstTime] = useState<string>('');

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const start = new Date(startTime);
      const elapsed = Math.floor((now.getTime() - start.getTime()) / 1000);
      setElapsedSeconds(elapsed);

      // Get IST time
      const istFormatter = new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
      setIstTime(istFormatter.format(now));
    }, 1000);

    return () => clearInterval(timer);
  }, [startTime]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-r from-purple-900/30 via-pink-900/30 to-cyan-900/30 backdrop-blur-xl border border-purple-500/30 rounded-xl p-6 sticky top-4 z-20"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Elapsed Time</p>
          <p className="text-3xl font-bold text-transparent bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text font-mono">
            {formatTime(elapsedSeconds + penaltySeconds)}
          </p>
          <p className="text-xs text-gray-400 mt-1">Penalty: +{Math.floor(penaltySeconds / 60)}m</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">IST Time</p>
          <p className="text-lg text-cyan-300 font-mono">{istTime}</p>
        </div>
      </div>

      {/* Animated progress bar */}
      <motion.div
        className="mt-4 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 rounded-full overflow-hidden"
        animate={{
          boxShadow: [
            '0 0 10px rgba(168, 85, 247, 0.5)',
            '0 0 20px rgba(236, 72, 153, 0.5)',
            '0 0 10px rgba(34, 211, 238, 0.5)',
          ],
        }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </motion.div>
  );
}
