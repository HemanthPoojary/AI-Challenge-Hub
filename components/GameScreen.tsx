'use client';

import { useState } from 'react';
import { StickyTimer } from '@/components/StickyTimer';
import { LevelCard } from '@/components/LevelCard';
import { FinalAnswerScreen } from '@/components/FinalAnswerScreen';
import { LiveLeaderboard } from '@/components/LiveLeaderboard';
import { getQuestionIdForLevel, QUESTION_BANK } from '@/lib/game-config';
import { motion } from 'framer-motion';

export function GameScreen({ teamData, onComplete }: { teamData: any; onComplete: (data: any) => void }) {
  const [currentLevel, setCurrentLevel] = useState(teamData.currentLevel || 1);
  const [attemptsByLevel, setAttemptsByLevel] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passcode, setPasscode] = useState('');
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [completedLevel, setCompletedLevel] = useState(false);
  const [penaltySeconds, setPenaltySeconds] = useState(teamData.penaltySeconds || 0);
  const [latestRevealNumber, setLatestRevealNumber] = useState<number | undefined>(undefined);
  const questionOrder = Array.isArray(teamData.questionOrder) && teamData.questionOrder.length === 5
    ? teamData.questionOrder
    : [1, 2, 3, 4, 5];

  const questionId = getQuestionIdForLevel(currentLevel, questionOrder);
  const question = QUESTION_BANK[questionId];
  const levelData = {
    level: currentLevel,
    title: question?.title || `Level ${currentLevel}`,
    description: question?.description || 'Find the next clue and enter the passcode.',
    hint: question?.hint || 'Scan the QR code and submit the passcode.',
  };
  const attempts = attemptsByLevel[currentLevel] || 0;

  const handlePasscodeSubmit = async (code: string) => {
    setError('');
    setLoading(true);

    try {
      // Call API to validate passcode
      const response = await fetch('/api/validate-passcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId: teamData.id,
          level: currentLevel,
          passcode: code,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Invalid passcode');
        if (typeof result.attempts === 'number') {
          setAttemptsByLevel((prev) => ({ ...prev, [currentLevel]: result.attempts }));
        } else {
          setAttemptsByLevel((prev) => ({ ...prev, [currentLevel]: (prev[currentLevel] || 0) + 1 }));
        }
        if (typeof result.penaltySeconds === 'number') {
          setPenaltySeconds(result.penaltySeconds);
        }

        return;
      }

      // Success! Show the reveal number
      setCompletedLevel(true);
      setLatestRevealNumber(result.revealNumber);
      if (typeof result.penaltySeconds === 'number') {
        setPenaltySeconds(result.penaltySeconds);
      }

      // Wait 2 seconds before moving to next level
      setTimeout(() => {
        if (result.nextLevel === 6 || currentLevel === 5) {
          // Move to final answer screen
          setCurrentLevel(6);
          setPasscode('');
          setCompletedLevel(false);
        } else {
          // Move to next level
          const nextLevel = result.nextLevel || currentLevel + 1;
          setCurrentLevel(nextLevel);
          setPasscode('');
          setCompletedLevel(false);
        }
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto"
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text mb-2">
              {teamData.teamName}
            </h1>
            <p className="text-gray-400">Level {currentLevel} of 5</p>
          </div>
          <button
            onClick={() => setShowLeaderboard(!showLeaderboard)}
            className="px-4 py-2 bg-purple-600/30 border border-purple-500/50 rounded-lg text-purple-300 hover:bg-purple-600/50 transition-all"
          >
            {showLeaderboard ? 'Hide' : 'View'} Leaderboard
          </button>
        </div>

        {currentLevel === 6 ? (
          // Final Answer Screen
          <FinalAnswerScreen
            teamName={teamData.teamName}
            onSubmit={async (finalAnswer) => {
              setLoading(true);
              setError('');
              try {
                const response = await fetch('/api/validate-final-answer', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    teamId: teamData.id,
                    answer: finalAnswer,
                  }),
                });

                const result = await response.json();

                if (!response.ok) {
                  setError(result.error || 'Incorrect answer');
                  return;
                }

                onComplete({
                  id: result.team.id,
                  teamName: result.team.team_name,
                  startTime: result.team.start_time,
                  endTime: result.team.end_time,
                  totalTime: result.team.total_time,
                  penaltySeconds: result.team.penalty_seconds || 0,
                  currentLevel: result.team.current_level,
                  completionStatus: result.team.completion_status,
                });
              } catch (err: any) {
                setError(err.message || 'An error occurred');
              } finally {
                setLoading(false);
              }
            }}
            loading={loading}
            error={error}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Game Area */}
            <div className="lg:col-span-2 space-y-6">
              <StickyTimer startTime={teamData.startTime} penaltySeconds={penaltySeconds} />

              <LevelCard
                level={levelData}
                currentAttempts={attempts}
                onSubmitPasscode={handlePasscodeSubmit}
                loading={loading}
                error={error}
                passcode={passcode}
                onPasscodeChange={setPasscode}
                revealNumber={completedLevel ? latestRevealNumber : undefined}
              />
            </div>

            {/* Leaderboard Sidebar */}
            {showLeaderboard && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="lg:col-span-1"
              >
                <LiveLeaderboard currentTeamId={teamData.id} />
              </motion.div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}

