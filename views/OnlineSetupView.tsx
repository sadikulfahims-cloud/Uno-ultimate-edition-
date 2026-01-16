
import React, { useState } from 'react';
import { ChevronLeft, Zap, Skull, ShieldCheck, Globe, PlusCircle, Search } from 'lucide-react';
import { OnlineSubMode, GameRules } from '../types';
import { SOUNDS } from '../constants';

interface OnlineSetupViewProps {
  onBack: () => void;
  onCreateLobby: (rules: GameRules) => void;
  onJoinMode: () => void;
  playSFX: (s: keyof typeof SOUNDS) => void;
}

const OnlineSetupView: React.FC<OnlineSetupViewProps> = ({ onBack, onCreateLobby, onJoinMode, playSFX }) => {
  const [subMode, setSubMode] = useState<OnlineSubMode>('CLASSIC');
  const [initialCards, setInitialCards] = useState<number>(7);
  const [activeTab, setActiveTab] = useState<'HOST' | 'JOIN'>('HOST');

  const subModeInfo = {
    CLASSIC: {
      icon: <ShieldCheck className="text-blue-400" />,
      desc: "Standard rules. First to zero cards wins."
    },
    NO_MERCY: {
      icon: <Skull className="text-red-500" />,
      desc: "Stackable penalties and chaos rules."
    },
    SUPERIOR: {
      icon: <Zap className="text-yellow-400" />,
      desc: "Vanishing turns and secret wild cards."
    }
  };

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto bg-black/20">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h2 className="font-game text-3xl text-yellow-400">ONLINE BATTLE</h2>
      </div>

      <div className="flex gap-2 mb-8 bg-black/40 p-1 rounded-2xl border border-white/5">
        <button 
          onClick={() => { playSFX('click'); setActiveTab('HOST'); }}
          className={`flex-1 py-3 rounded-xl font-game text-sm transition-all flex items-center justify-center gap-2 ${activeTab === 'HOST' ? 'bg-yellow-400 text-blue-900 shadow-lg' : 'text-white/40'}`}
        >
          <PlusCircle size={18} /> HOST MATCH
        </button>
        <button 
          onClick={onJoinMode}
          className={`flex-1 py-3 rounded-xl font-game text-sm transition-all flex items-center justify-center gap-2 ${activeTab === 'JOIN' ? 'bg-yellow-400 text-blue-900 shadow-lg' : 'text-white/40'}`}
        >
          <Search size={18} /> JOIN MATCH
        </button>
      </div>

      {activeTab === 'HOST' && (
        <div className="space-y-8 flex-1 animate-card-draw">
          <div>
            <label className="text-xs font-black text-white/30 uppercase ml-2 mb-4 block tracking-[0.2em]">Select Game Rules</label>
            <div className="space-y-3">
              {(['CLASSIC', 'NO_MERCY', 'SUPERIOR'] as OnlineSubMode[]).map(mode => (
                <button
                  key={mode}
                  onClick={() => { playSFX('click'); setSubMode(mode); }}
                  className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
                    subMode === mode ? 'border-yellow-400 bg-white/10 shadow-lg' : 'border-white/5 bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-black/20 rounded-xl">
                      {subModeInfo[mode].icon}
                    </div>
                    <div>
                      <div className="font-bold">{mode.replace('_', ' ')}</div>
                      <div className="text-[10px] opacity-40 uppercase tracking-widest">{subModeInfo[mode].desc}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
            <div className="flex justify-between items-center mb-6">
              <label className="text-xs font-black text-white/30 uppercase tracking-[0.2em]">Starting Cards</label>
              <div className="font-game text-3xl text-yellow-400">{initialCards}</div>
            </div>
            <input 
              type="range" 
              min="2" 
              max="20" 
              value={initialCards} 
              onChange={(e) => { playSFX('click'); setInitialCards(parseInt(e.target.value)); }}
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-yellow-400"
            />
          </div>

          <button
            onClick={() => onCreateLobby({ subMode, initialCards })}
            className="w-full py-5 bg-yellow-400 text-blue-900 font-game text-xl rounded-3xl shadow-2xl hover:bg-yellow-300 transition-all border-b-8 border-yellow-600 mt-6"
          >
            CREATE LOBBY
          </button>
        </div>
      )}
    </div>
  );
};

export default OnlineSetupView;
