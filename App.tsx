import React, { useEffect, useState, useRef } from 'react';
import { GameState, GameStatus, Player } from './types';
import { MAX_PLAYERS, PENALTY_MS } from './constants';
import { mockServer } from './services/gameService';
import { Lobby } from './components/Lobby';
import { GameRoom } from './components/GameRoom';
import { Results } from './components/Results';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [myId, setMyId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [flashError, setFlashError] = useState(false);
  
  useEffect(() => {
    mockServer.on('gameState', (state: GameState) => {
      setGameState(state);
    });

    mockServer.on('error', (msg: string) => {
      setError(msg);
      setTimeout(() => setError(null), 3000);
    });

    mockServer.on('correctGuess', (data: { playerId: string, cardIds: number[] }) => {
        // Handle correct guess visuals if needed
    });

    mockServer.on('wrongGuess', (pid: string) => {
        if (pid === myId) {
            setFlashError(true);
            setTimeout(() => setFlashError(false), 500);
        }
    });

    return () => {
    };
  }, [myId]);

  const handleCreateRoom = (name: string) => {
    const player = mockServer.joinGame(name);
    if (player) setMyId(player.id);
  };

  const handleJoinRoom = (name: string, roomId?: string) => {
    const player = mockServer.joinGame(name);
    if (player) setMyId(player.id);
  };

  const handleStartGame = () => {
    mockServer.startGame();
  };

  const handleGuess = (cardIds: number[]) => {
    mockServer.submitGuess(myId, cardIds);
  };

  if (!gameState) {
     return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 flex items-center justify-center text-white">
           <Lobby 
             players={[]} 
             currentPlayerId="" 
             onJoin={handleJoinRoom} 
             onCreate={handleCreateRoom}
             onStartGame={handleStartGame}
           />
        </div>
     );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 text-white overflow-hidden font-sans select-none transition-colors duration-200 ${flashError ? 'bg-red-900' : ''}`}>
      
      {/* Global Error Toast */}
      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-red-600 px-6 py-3 rounded-full shadow-xl z-50 font-bold animate-bounce">
          {error}
        </div>
      )}

      {gameState.status === GameStatus.LOBBY && (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Lobby 
            players={gameState.players} 
            currentPlayerId={myId}
            onJoin={handleJoinRoom} 
            onCreate={handleCreateRoom} 
            onStartGame={handleStartGame}
          />
        </div>
      )}

      {gameState.status === GameStatus.PLAYING && (
        <div className="h-screen py-4">
           <GameRoom 
              gameState={gameState} 
              currentPlayerId={myId} 
              onGuess={handleGuess}
           />
        </div>
      )}

      {gameState.status === GameStatus.FINISHED && (
        <Results 
          winner={gameState.winner} 
          players={gameState.players} 
          isHost={gameState.players.find(p => p.id === myId)?.isHost || false}
          onRestart={handleStartGame}
        />
      )}
    </div>
  );
};

export default App;