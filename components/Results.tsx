import React, { useEffect } from 'react';
import { Player } from '../types';
import { Trophy, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Props {
  winner: Player | null;
  players: Player[];
  onRestart: () => void;
  isHost: boolean;
}

export const Results: React.FC<Props> = ({ winner, players, onRestart, isHost }) => {
  
  useEffect(() => {
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#fbbf24', '#ef4444', '#3b82f6']
      });
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#fbbf24', '#ef4444', '#3b82f6']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-3xl max-w-2xl w-full text-center shadow-2xl">
        <div className="mb-8">
            <Trophy className="w-24 h-24 text-yellow-400 mx-auto mb-4 animate-bounce" />
            <h1 className="text-4xl font-bold text-white mb-2">Game Over!</h1>
            <p className="text-xl text-yellow-300">Winner: {winner?.name}</p>
        </div>

        <div className="bg-black/20 rounded-xl overflow-hidden mb-8">
            {sortedPlayers.map((p, idx) => (
                <div key={p.id} className="flex items-center justify-between p-4 border-b border-white/5 last:border-0 hover:bg-white/5">
                    <div className="flex items-center gap-4">
                        <span className="text-2xl font-bold w-8 text-gray-500">#{idx + 1}</span>
                        <span className="text-3xl">{p.avatar}</span>
                        <span className="font-bold text-xl">{p.name}</span>
                    </div>
                    <span className="text-2xl font-bold text-yellow-400">{p.score} pts</span>
                </div>
            ))}
        </div>

        {isHost ? (
            <button 
                onClick={onRestart}
                className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-lg flex items-center gap-2 mx-auto transition"
            >
                <RefreshCw /> Play Again
            </button>
        ) : (
            <p className="text-gray-400">Waiting for host to restart...</p>
        )}
      </div>
    </div>
  );
};