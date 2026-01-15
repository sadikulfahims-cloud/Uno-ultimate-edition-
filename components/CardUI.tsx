
import React from 'react';
import { Card, CardColor } from '../types';
import { Ghost, Replace, MousePointer2, Hand, HelpCircle } from 'lucide-react';

interface CardUIProps {
  card: Card;
  onClick?: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  facedown?: boolean;
  className?: string;
  isSelected?: boolean;
}

const CardUI: React.FC<CardUIProps> = ({ card, onClick, disabled, size = 'md', facedown = false, className = '', isSelected = false }) => {
  const colorMap: Record<CardColor, string> = {
    red: 'bg-red-500',
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-400',
    wild: 'bg-zinc-800'
  };

  const sizes = {
    sm: 'w-10 h-16 text-[8px]',
    md: 'w-16 h-24 text-[10px]',
    lg: 'w-24 h-36 text-sm'
  };

  const displayValue = (val: string) => {
    switch(val) {
      case 'draw2': return '+2';
      case 'draw4': return '+4';
      case 'draw6': return '+6';
      case 'draw10': return '+10';
      case 'reverse4': return 'R+4';
      case 'vanishing': return 'Vanishing';
      case 'ghostswap': return 'Ghost Swap';
      case 'elitereverse': return 'Elite R';
      case 'all4': return 'All+4';
      case 'hybrid': return 'Hybrid';
      default: return val.toUpperCase();
    }
  };

  const GlitchIcon = ({ className = "" }) => (
    <div className={`relative ${className}`}>
      <div className="absolute inset-0 flex items-center justify-center opacity-50 translate-x-[1px] translate-y-[1px]">
        <MousePointer2 className="text-cyan-400" size="100%" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center opacity-50 -translate-x-[1px] -translate-y-[1px]">
        <MousePointer2 className="text-pink-500" size="100%" />
      </div>
      <div className="relative flex items-center justify-center">
        <MousePointer2 className="text-white" size="100%" />
      </div>
    </div>
  );

  const content = () => {
    if (facedown) {
      return (
        <div className="w-full h-full bg-zinc-900 border-4 border-white rounded-xl flex items-center justify-center">
          <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center border-2 border-white">
            <span className="font-game text-white text-xl">U</span>
          </div>
        </div>
      );
    }

    // Ghost Swap Card
    if (card.value === 'ghostswap') {
      return (
        <div className="w-full h-full bg-black border-4 border-white rounded-xl relative overflow-hidden flex flex-col items-center justify-center shadow-2xl transition-transform hover:scale-105">
           <div className="absolute top-1 left-0 right-0 text-center text-[6px] font-black text-white uppercase tracking-tighter">Ghost Swap</div>
           <div className="flex items-center gap-1">
             <Ghost className="text-white fill-white" size={size === 'lg' ? 42 : 28} />
             <Ghost className="text-white fill-white scale-x-[-1]" size={size === 'lg' ? 42 : 28} />
           </div>
           <div className="mt-1 text-white font-game text-[6px] text-center px-1 uppercase leading-none opacity-80">Swap Hand</div>
        </div>
      );
    }

    // Vanishing Card
    if (card.value === 'vanishing') {
      return (
        <div className="w-full h-full bg-black border-4 border-white rounded-xl relative overflow-hidden flex flex-col items-center justify-center shadow-2xl transition-transform hover:scale-105">
           <div className="relative w-4/5 h-4/5 flex items-center justify-center">
              <div className="absolute inset-0 animate-[spin_10s_linear_infinite]">
                 <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-6 border-t-4 border-red-500 rounded-full"></div>
                 <div className="absolute right-0 top-1/2 -translate-y-1/2 w-6 h-6 border-r-4 border-blue-500 rounded-full"></div>
                 <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-6 border-b-4 border-green-500 rounded-full"></div>
                 <div className="absolute left-0 top-1/2 -translate-y-1/2 w-6 h-6 border-l-4 border-yellow-400 rounded-full"></div>
              </div>
              <div className="z-10 bg-black border-2 border-white p-1 w-1/2 h-1/2 flex items-center justify-center">
                 <GlitchIcon className="w-full h-full" />
              </div>
           </div>
           <div className="absolute bottom-2 left-0 right-0 text-center">
              <div className="font-game text-white text-[7px] uppercase tracking-tighter">Vanishing</div>
           </div>
        </div>
      );
    }

    // Wild Hybrid Attack Card
    if (card.value === 'hybrid') {
      return (
        <div className="w-full h-full bg-black border-4 border-white rounded-xl relative overflow-hidden flex flex-col items-center justify-center shadow-2xl">
          {/* Multi-colored Splat Background */}
          <div className="absolute inset-0 opacity-40">
            <div className="absolute top-2 left-2 w-full h-full bg-red-600 rotate-12 rounded-lg"></div>
            <div className="absolute top-4 right-2 w-full h-full bg-blue-600 -rotate-12 rounded-lg"></div>
            <div className="absolute bottom-2 left-4 w-full h-full bg-yellow-500 rotate-45 rounded-lg"></div>
            <div className="absolute top-8 left-0 w-full h-full bg-green-600 -rotate-45 rounded-lg"></div>
          </div>

          {/* Top Hand Icon */}
          <div className="absolute top-4 z-20">
            <Hand size={size === 'lg' ? 24 : 16} className="text-white fill-white" />
          </div>

          {/* Center Question Mark Boxes */}
          <div className="flex gap-1 z-10 scale-90">
            <div className="w-8 h-12 bg-red-600 border-2 border-white rounded flex items-center justify-center -rotate-6">
               <HelpCircle size={16} className="text-white" />
            </div>
            <div className="w-8 h-12 bg-blue-600 border-2 border-white rounded flex items-center justify-center rotate-6">
               <HelpCircle size={16} className="text-white" />
            </div>
          </div>

          {/* Arrows pointing to the combo boxes */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4 opacity-50">
             <div className="w-4 h-6 border-l-2 border-b-2 border-white rounded-bl-lg rotate-45"></div>
             <div className="w-4 h-6 border-r-2 border-b-2 border-white rounded-br-lg -rotate-45"></div>
          </div>

          {/* Small corner indicators */}
          <div className="absolute bottom-2 left-2 w-4 h-4 bg-red-600 border border-white flex items-center justify-center">
            <span className="text-[6px] font-bold">?</span>
          </div>
          <div className="absolute bottom-2 right-2 w-4 h-4 bg-blue-600 border border-white flex items-center justify-center">
            <span className="text-[6px] font-bold">?</span>
          </div>

          <div className="absolute bottom-0 left-0 right-0 bg-white text-black font-game text-[6px] py-1 tracking-tighter text-center uppercase">
            WILD HYBRID ATTACK
          </div>
        </div>
      );
    }

    const isWild = card.color === 'wild';

    return (
      <div className={`w-full h-full ${colorMap[card.color]} border-2 border-white rounded-xl relative overflow-hidden flex flex-col items-center justify-center shadow-lg ${isSelected ? 'ring-4 ring-yellow-400 scale-105' : ''}`}>
        {isWild && (
          <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
            <div className="bg-red-500"></div>
            <div className="bg-blue-500"></div>
            <div className="bg-yellow-400"></div>
            <div className="bg-green-500"></div>
          </div>
        )}
        
        <div className="z-10 bg-white/20 backdrop-blur-sm rounded-full w-[85%] h-[80%] flex flex-col items-center justify-center border border-white/30 rotate-6">
          <span className="font-game text-white drop-shadow-md select-none text-center px-1 leading-tight">
            {displayValue(card.value)}
          </span>
          {card.secondaryValue && (
            <span className="font-game text-yellow-300 text-[8px] mt-1">+{displayValue(card.secondaryValue)}</span>
          )}
        </div>
        
        <div className="absolute top-1 left-1 font-bold text-white text-[8px] select-none">
           {displayValue(card.value)}
        </div>
      </div>
    );
  };

  return (
    <div 
      onClick={!disabled ? onClick : undefined}
      className={`cursor-pointer shrink-0 transition-all ${sizes[size]} ${disabled ? 'opacity-50 grayscale scale-95' : ''} ${className}`}
    >
      {content()}
    </div>
  );
};

export default CardUI;
