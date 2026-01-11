import React, { useState } from 'react';
import { Player, LobbyProps } from '../types';
import { MAX_PLAYERS } from '../constants';
import { Play, Users, Link as LinkIcon, AlertCircle } from 'lucide-react';

interface Props extends LobbyProps {
  players: Player[];
  currentPlayerId: string;
  onStartGame: () => void;
}

export const Lobby: React.FC<Props> = ({ onJoin, onCreate, players, currentPlayerId, onStartGame }) => {
  const [name, setName] = useState('');
  const [roomIdInput, setRoomIdInput] = useState('');
  const [mode, setMode] = useState<'HOME' | 'JOIN'>('HOME');

  const me = players.find(p => p.id === currentPlayerId);
  const isHost = me?.isHost;

  const handleCopyLink = () => {
    // In a real app this would copy URL
    navigator.clipboard.writeText("https://tri-spot-game.replit.app/room/DEMO-123");
    alert("Room link copied to clipboard! (Simulated)");
  };

  if (players.length > 0) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white/10 backdrop-blur-md rounded-2xl shadow-xl border border-white/20">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2 text-yellow-400">Waiting Lobby</h2>
          <div className="flex items-center justify-center gap-2 text-gray-300">
            <span className="font-mono bg-black/30 px-3 py-1 rounded">Room: DEMO-123</span>
            <button onClick={handleCopyLink} className="p-2 hover:bg-white/10 rounded-full">
              <LinkIcon size={16} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {players.map(p => (
            <div key={p.id} className="flex flex-col items-center p-4 bg-black/20 rounded-xl relative">
              <span className="text-4xl mb-2 animate-bounce">{p.avatar}</span>
              <span className="font-bold truncate w-full text-center">{p.name}</span>
              {p.isHost && <span className="absolute top-2 right-2 text-yellow-400 text-xs">👑</span>}
            </div>
          ))}
          {Array.from({ length: MAX_PLAYERS - players.length }).map((_, i) => (
            <div key={`empty-${i}`} className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-white/10 rounded-xl text-white/20">
              <Users size={24} />
              <span className="text-sm mt-2">Waiting...</span>
            </div>
          ))}
        </div>

        {isHost ? (
          <button 
            onClick={onStartGame}
            className="w-full py-4 bg-green-500 hover:bg-green-600 text-white font-bold text-xl rounded-xl shadow-lg transform transition active:scale-95 flex items-center justify-center gap-3"
          >
            <Play fill="currentColor" /> Start Game
          </button>
        ) : (
          <div className="text-center py-4 text-gray-400 animate-pulse">
            Waiting for host to start...
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-8 bg-white/10 backdrop-blur-md rounded-2xl shadow-xl border border-white/20">
      <div className="text-center mb-8">
        <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 mb-2 drop-shadow-sm">
          Tri-Spot
        </h1>
        <p className="text-gray-300">Find the matching symbol across 3 cards!</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-bold mb-2 ml-1">Nickname</label>
          <input 
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 text-white placeholder-gray-500 transition"
            placeholder="Enter your name"
          />
        </div>

        {mode === 'JOIN' && (
           <div>
           <label className="block text-sm font-bold mb-2 ml-1">Room ID</label>
           <input 
             value={roomIdInput}
             onChange={e => setRoomIdInput(e.target.value)}
             className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 text-white placeholder-gray-500 transition"
             placeholder="e.g. DEMO-123"
           />
         </div>
        )}

        <div className="flex gap-4 pt-2">
          {mode === 'HOME' ? (
            <>
              <button 
                onClick={() => onCreate(name)}
                disabled={!name}
                className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition"
              >
                Create Room
              </button>
              <button 
                onClick={() => setMode('JOIN')}
                className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition"
              >
                Join Room
              </button>
            </>
          ) : (
            <>
               <button 
                onClick={() => onJoin(name, roomIdInput)}
                disabled={!name || !roomIdInput}
                className="flex-1 py-3 bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition"
              >
                Join Now
              </button>
               <button 
                onClick={() => setMode('HOME')}
                className="px-4 py-3 text-gray-400 hover:text-white transition"
              >
                Cancel
              </button>
            </>
          )}
        </div>
        
        <div className="mt-6 p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20 flex gap-3 items-start">
           <AlertCircle className="text-yellow-400 shrink-0 mt-0.5" size={18} />
           <p className="text-xs text-yellow-200/80">
             <strong>Demo Mode:</strong> This will create a local simulation. To play with others, deploy the included server code to Replit/Heroku.
           </p>
        </div>
      </div>
    </div>
  );
};