import React, { useState, useEffect, useRef } from 'react';
import { GameState, CardData } from '../types';
import { Card } from './Card';
import { Layers } from 'lucide-react';
import { cn } from '../utils/cn';

interface Props {
  gameState: GameState;
  currentPlayerId: string;
  onGuess: (cardIds: number[]) => void;
}

// Wrapper to handle animations
const AnimatedCardSlot: React.FC<{
  card: CardData;
  status: 'stable' | 'discarding' | 'dealing';
  selected: boolean;
  onClick: () => void;
  disabled: boolean;
}> = ({ card, status, selected, onClick, disabled }) => {
  return (
    <div 
      className={cn(
        "transition-all duration-500 transform",
        status === 'discarding' && "translate-x-[120vw] rotate-45 opacity-0", // Fly right
        status === 'dealing' && "translate-x-[-120vw] -rotate-45 opacity-0", // Start from left
        status === 'stable' && "translate-x-0 rotate-0 opacity-100"
      )}
    >
       <Card 
          data={card} 
          selected={selected}
          onClick={onClick} 
          disabled={disabled || status !== 'stable'}
        />
    </div>
  );
};

export const GameRoom: React.FC<Props> = ({ gameState, currentPlayerId, onGuess }) => {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [penaltyUntil, setPenaltyUntil] = useState<number>(0);
  
  // Local state to manage animations
  const [displayCards, setDisplayCards] = useState<Array<{ data: CardData, status: 'stable' | 'discarding' | 'dealing' }>>([]);
  const prevGameStateCards = useRef<CardData[]>([]);

  const isPenalized = Date.now() < penaltyUntil;

  // Sync GameState with Display Cards (Animation Logic)
  useEffect(() => {
    const newServerCards = gameState.currentRoundCards;
    
    // Capture the current value of the ref to use inside closures/timeouts
    const currentPrevCards = prevGameStateCards.current;

    // Initial Load or Empty State
    if (displayCards.length === 0 && newServerCards.length > 0) {
      // Animate initial deal if desired, or just show them
      // Let's animate them in for flair
      const initialDeal = newServerCards.map(c => ({ data: c, status: 'dealing' as const }));
      setDisplayCards(initialDeal);
      
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setDisplayCards(prev => prev.map(item => ({ ...item, status: 'stable' })));
        });
      });
      
      prevGameStateCards.current = newServerCards;
      return;
    }

    // Detect Changes by index position
    const loopLength = Math.max(currentPrevCards.length, newServerCards.length);
    let hasChanges = false;
    
    // Create a working copy of the current display state to mark discards
    // If displayCards isn't synced yet (rare), fallback to currentPrevCards mapped
    const transitionState = displayCards.length === loopLength 
        ? displayCards.map(dc => ({...dc})) 
        : new Array(loopLength).fill(null).map((_, i) => ({ data: currentPrevCards[i] || newServerCards[i], status: 'stable' as const }));

    for (let i = 0; i < loopLength; i++) {
        const oldCard = currentPrevCards[i];
        const newCard = newServerCards[i];

        // 1. Card Replaced (ID changed)
        if (oldCard && newCard && oldCard.id !== newCard.id) {
             hasChanges = true;
             if (transitionState[i]) transitionState[i].status = 'discarding';
        } 
        // 2. Card Removed (End of game)
        else if (oldCard && !newCard) {
            hasChanges = true;
            if (transitionState[i]) transitionState[i].status = 'discarding';
        }
        // 3. New Slot Added
        else if (!oldCard && newCard) {
            hasChanges = true;
            // It will be handled in the 'dealing' phase, but we can prep it here
             transitionState[i] = { data: newCard, status: 'dealing' };
        }
    }

    if (hasChanges) {
        // Step 1: Trigger Discard Animation
        setDisplayCards(transitionState);
        setSelectedIds([]); // Clear selection immediately on success

        // Step 2: After Discard finishes, Swap in New Cards
        setTimeout(() => {
            const dealingState = newServerCards.map((c, i) => {
                const oldC = currentPrevCards[i];
                // Check if this specific slot was the one that changed
                if ((oldC && c.id !== oldC.id) || (!oldC)) {
                    return { data: c, status: 'dealing' as const };
                }
                return { data: c, status: 'stable' as const };
            });
            setDisplayCards(dealingState);

            // Step 3: Animate In
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    setDisplayCards(prev => prev.map(item => ({
                        ...item,
                        status: 'stable'
                    })));
                });
            });

        }, 500); 
    }

    prevGameStateCards.current = newServerCards;
  }, [gameState.currentRoundCards]);


  const handleCardClick = (id: number) => {
    if (isPenalized) return;
    
    let newSelected = [...selectedIds];
    if (newSelected.includes(id)) {
      newSelected = newSelected.filter(sid => sid !== id);
    } else {
      if (newSelected.length < 3) {
        newSelected.push(id);
      }
    }
    setSelectedIds(newSelected);

    if (newSelected.length === 3) {
      onGuess(newSelected);
    }
  };

  useEffect(() => {
    if (penaltyUntil > 0) {
      const interval = setInterval(() => {
        if (Date.now() > penaltyUntil) setPenaltyUntil(0);
      }, 100);
      return () => clearInterval(interval);
    }
  }, [penaltyUntil]);


  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900">
      
      {/* HEADER */}
      <div className="flex-none px-4 py-3 bg-black/20 backdrop-blur-sm border-b border-white/10 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
           <div className="flex items-center gap-4">
               <div className="flex items-center gap-2 text-yellow-400">
                   <Layers size={20} />
                   <span className="font-bold text-xl">{gameState.deckSize}</span>
               </div>
               {gameState.lastMatch && (
                  <div className="hidden sm:flex items-center gap-2 text-green-400 animate-pulse bg-green-900/30 px-3 py-1 rounded-full">
                      <span className="text-xs uppercase font-bold">Match:</span>
                      <span className="text-xl">{gameState.lastMatch}</span>
                  </div>
              )}
           </div>

           {/* Mini Leaderboard */}
           <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {gameState.players.map(p => (
                  <div key={p.id} className={cn(
                      "flex items-center gap-2 px-3 py-1 rounded-full transition-all border whitespace-nowrap text-sm",
                      p.id === currentPlayerId ? "bg-blue-600/50 border-blue-400" : "bg-black/30 border-transparent"
                  )}>
                      <span>{p.avatar}</span>
                      <span className="font-bold">{p.name}</span>
                      <span className="bg-white/20 px-1.5 rounded text-xs">{p.score}</span>
                  </div>
              ))}
           </div>
        </div>
      </div>

      {/* MAIN GAME AREA */}
      <div className="flex-1 min-h-0 flex items-center justify-center relative p-2 sm:p-4">
         
         {/* Penalty Overlay */}
         {isPenalized && (
           <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
             <div className="bg-red-500/80 text-white font-bold text-4xl px-8 py-4 rounded-xl shadow-2xl animate-pulse backdrop-blur-sm">
                Miss! ❌
             </div>
           </div>
        )}

        <div className="w-full max-w-7xl flex justify-between items-center h-full gap-2 sm:gap-8">
            
            {/* LEFT: DRAW DECK */}
            <div className="hidden md:flex flex-col items-center justify-center w-32 sm:w-48 h-full relative">
                <div className="w-24 h-24 sm:w-32 sm:h-32 bg-indigo-950 rounded-2xl border-4 border-indigo-700 shadow-2xl flex items-center justify-center relative">
                    <div className="absolute inset-0 bg-white/5 rounded-xl transform rotate-3"></div>
                    <div className="absolute inset-0 bg-white/5 rounded-xl transform -rotate-2"></div>
                    <span className="font-bold text-indigo-400/50 text-xl">DECK</span>
                    <div className="absolute -top-4 -right-4 bg-yellow-500 text-black font-bold w-8 h-8 flex items-center justify-center rounded-full z-10">
                        {gameState.deckSize}
                    </div>
                </div>
            </div>

            {/* CENTER: GRID */}
            <div className="flex-1 flex flex-col items-center justify-center h-full min-h-0">
                <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-6 lg:gap-8 aspect-square max-h-full">
                    {displayCards.map((item) => (
                        <div key={item.data.id} className="flex items-center justify-center">
                            <AnimatedCardSlot 
                                card={item.data}
                                status={item.status}
                                selected={selectedIds.includes(item.data.id)}
                                onClick={() => handleCardClick(item.data.id)}
                                disabled={isPenalized}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* RIGHT: DISCARD PILE */}
            <div className="hidden md:flex flex-col items-center justify-center w-32 sm:w-48 h-full relative">
                 <div className="w-24 h-24 sm:w-32 sm:h-32 bg-indigo-950/50 rounded-full border-4 border-indigo-800/50 border-dashed flex items-center justify-center">
                    <span className="font-bold text-indigo-400/30 text-sm">DISCARD</span>
                 </div>
            </div>
        </div>
      </div>

      {/* FOOTER INSTRUCTION */}
      <div className="flex-none pb-4 pt-2 text-center">
          <p className="text-gray-300 text-sm sm:text-base font-light">
             {selectedIds.length === 3 
               ? <span className="text-yellow-400 font-bold animate-pulse">Checking Match...</span> 
               : `Select 3 cards with ONE common symbol (${selectedIds.length}/3)`}
           </p>
      </div>
    </div>
  );
};