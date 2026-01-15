
import React, { useState } from 'react';
import { ChevronLeft, ShieldCheck, Skull, Zap } from 'lucide-react';
import { OnlineSubMode, GameRules } from '../types';

interface OfflineSetupViewProps {
  onBack: () => void;
  onCreateLobby: (rules: GameRules) => void;
}

const OfflineSetupView: React.FC<OfflineSetupViewProps> = ({ onBack, onCreateLobby }) => {
  const [subMode, setSubMode] = useState<OnlineSubMode>('CLASSIC');
  const [initialCards, setInitialCards] = useState<number>(7);

  const subModeInfo = {
    CLASSIC: { icon: <ShieldCheck className="text-blue-400" />, desc: "Standard rules." },
    NO_MERCY: { icon: <Skull className="text-red-500" />, desc: "Stacking +2 and +4 cards!" },
    SUPERIOR: { icon: <Zap className="text-yellow-400" />, desc: "Fast play rules." }
  };

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h2 className="font-game text-3xl text-yellow-400">HOST OFFLINE</h2>
      </div>

      <div className="space-y-8 flex-1">
        <div>
          <label className="text-xs font-bold text-white/50 uppercase ml-2 mb-4 block tracking-widest">Select Game Mode</label>
          <div className="space-y-3">
            {(['CLASSIC', 'NO_MERCY', 'SUPERIOR'] as OnlineSubMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => setSubMode(mode)}
                className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
                  subMode === mode ? 'border-yellow-400 bg-white/10' : 'border-white/5 bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-black/20 rounded-xl">{subModeInfo[mode].icon}</div>
                  <div>
                    <div className="font-bold">{mode.replace('_', ' ')}</div>
                    <div className="text-[10px] opacity-60">{subModeInfo[mode].desc}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Card Number Slider */}
        <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
          <div className="flex justify-between items-center mb-6">
            <label className="text-xs font-bold text-white/50 uppercase tracking-widest">Starting Cards</label>
            <div className="font-game text-3xl text-yellow-400">{initialCards}</div>
          </div>
          <input 
            type="range" 
            min="2" 
            max="20" 
            value={initialCards} 
            onChange={(e) => setInitialCards(parseInt(e.target.value))}
            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-yellow-400"
          />
          <div className="flex justify-between mt-2 text-[10px] font-black opacity-20 uppercase tracking-widest">
            <span>2 Cards</span>
            <span>20 Cards</span>
          </div>
        </div>
      </div>

      <button
        onClick={() => onCreateLobby({ subMode, initialCards })}
        className="w-full py-5 bg-yellow-400 text-blue-900 font-game text-xl rounded-3xl shadow-2xl hover:bg-yellow-300 transition-all border-b-8 border-yellow-600 mt-6"
      >
        START HOSTING
      </button>
    </div>
  );
};

export default OfflineSetupView;
