'use client';

import { useState, useEffect } from 'react';
import { TeamRegistrationScreen } from '@/components/TeamRegistrationScreen';
import { GameScreen } from '@/components/GameScreen';
import { CompletionScreen } from '@/components/CompletionScreen';
import { BackgroundEffects } from '@/components/BackgroundEffects';

export default function Home() {
  const [gameState, setGameState] = useState<'registration' | 'game' | 'completion'>('registration');
  const [teamData, setTeamData] = useState<any>(null);

  const handleRegistrationComplete = (data: any) => {
    setTeamData(data);
    setGameState('game');
  };

  const handleGameComplete = (completionData: any) => {
    setTeamData(completionData);
    setGameState('completion');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black overflow-hidden relative">
      <BackgroundEffects />
      
      <div className="relative z-10">
        {gameState === 'registration' && (
          <TeamRegistrationScreen onComplete={handleRegistrationComplete} />
        )}
        {gameState === 'game' && teamData && (
          <GameScreen teamData={teamData} onComplete={handleGameComplete} />
        )}
        {gameState === 'completion' && teamData && (
          <CompletionScreen teamData={teamData} />
        )}
      </div>
    </div>
  );
}
