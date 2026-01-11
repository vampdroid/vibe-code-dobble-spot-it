import React, { useMemo } from 'react';
import { CardData } from '../types';
import { cn } from '../utils/cn';

interface CardProps {
  data: CardData;
  onClick: () => void;
  selected: boolean;
  disabled?: boolean;
}

export const Card: React.FC<CardProps> = ({ data, onClick, selected, disabled }) => {
  // Memoize positions and sizes
  const symbolLayout = useMemo(() => {
    const symbols = data.symbols;
    const centerIndex = 0;
    const perimeter = symbols.slice(1);
    
    // Helper to generate a random scale multiplier
    // Adjusted scales to prevent overlapping while keeping them large
    const getScale = (isCenter: boolean) => {
       const min = isCenter ? 0.9 : 0.7;
       const max = isCenter ? 1.3 : 1.1; // Slightly reduced max to prevent crowding
       return min + Math.random() * (max - min);
    };
    
    return {
      center: {
        symbol: symbols[centerIndex],
        rotation: Math.random() * 360,
        scale: getScale(true)
      },
      perimeter: perimeter.map((s, i) => ({
        symbol: s,
        angle: (i * (360 / 7)) * (Math.PI / 180),
        rotation: Math.random() * 360,
        scale: getScale(false)
      }))
    };
  }, [data.id, data.symbols]);

  return (
    <div 
      onClick={!disabled ? onClick : undefined}
      className={cn(
        // Mobile: w-28 (112px) to w-32 (128px) depending on screen
        // Desktop: w-56 (224px) to w-64 (256px) for much larger cards
        "relative w-28 h-28 xs:w-32 xs:h-32 sm:w-56 sm:h-56 md:w-64 md:h-64 rounded-full shadow-lg border-4 transition-all duration-200 cursor-pointer select-none bg-white overflow-hidden",
        selected 
          ? "border-green-400 bg-green-50 scale-105 shadow-green-500/50" 
          : "border-gray-200 hover:border-blue-300 hover:shadow-xl",
        disabled && "opacity-50 grayscale pointer-events-none"
      )}
      style={{
        transform: selected ? 'scale(1.05)' : `rotate(${data.rotation}deg)` 
      }}
    >
      {/* Center Symbol */}
      <div
        className="absolute top-1/2 left-1/2 flex items-center justify-center w-12 h-12 sm:w-20 sm:h-20"
        style={{ 
            transform: `translate(-50%, -50%) rotate(${symbolLayout.center.rotation}deg) scale(${symbolLayout.center.scale})` 
        }}
      >
        <span className="text-4xl sm:text-7xl leading-none filter drop-shadow-sm select-none">{symbolLayout.center.symbol}</span>
      </div>

      {/* Perimeter Symbols */}
      {symbolLayout.perimeter.map((item, idx) => {
        // Pushed radius to 34% to separate from center more effectively
        const radius = 34; 
        const x = 50 + Math.cos(item.angle) * radius;
        const y = 50 + Math.sin(item.angle) * radius;

        return (
          <div
            key={idx}
            className="absolute flex items-center justify-center w-8 h-8 sm:w-16 sm:h-16"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              transform: `translate(-50%, -50%) rotate(${item.rotation}deg) scale(${item.scale})`
            }}
          >
            <span className="text-3xl sm:text-5xl leading-none filter drop-shadow-sm select-none">{item.symbol}</span>
          </div>
        );
      })}
    </div>
  );
};