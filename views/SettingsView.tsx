
import React from 'react';
import { GameSettings } from '../types';
import { ChevronLeft, Volume2, VolumeX, Palette } from 'lucide-react';

interface SettingsViewProps {
  settings: GameSettings;
  onUpdate: (s: GameSettings) => void;
  onBack: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ settings, onUpdate, onBack }) => {
  return (
    <div className="flex-1 flex flex-col p-6">
      <div className="flex items-center gap-4 mb-10">
        <button onClick={onBack} className="p-2 bg-white/10 rounded-full">
          <ChevronLeft size={24} />
        </button>
        <h2 className="font-game text-3xl uppercase">Settings</h2>
      </div>

      <div className="space-y-8">
        {/* SFX Toggle */}
        <div className="flex items-center justify-between p-4 bg-white/10 rounded-2xl">
          <div className="flex items-center gap-4">
            {settings.sfx ? <Volume2 size={24} className="text-yellow-400" /> : <VolumeX size={24} className="opacity-40" />}
            <div>
              <div className="font-bold">Sound Effects</div>
              <div className="text-xs opacity-50">Game & UI feedback sounds</div>
            </div>
          </div>
          <button 
            onClick={() => onUpdate({ ...settings, sfx: !settings.sfx })}
            className={`w-14 h-8 rounded-full p-1 transition-colors relative ${settings.sfx ? 'bg-yellow-400' : 'bg-white/20'}`}
          >
            <div className={`w-6 h-6 bg-white rounded-full transition-transform ${settings.sfx ? 'translate-x-6' : 'translate-x-0'}`}></div>
          </button>
        </div>

        {/* Theme Picker */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold opacity-50 uppercase ml-2">
            <Palette size={16} /> Choose Theme
          </div>
          <div className="grid grid-cols-1 gap-3">
            {(['classic', 'dark', 'neon'] as const).map(t => (
              <button 
                key={t}
                onClick={() => onUpdate({ ...settings, theme: t })}
                className={`w-full p-5 rounded-2xl border-2 transition-all flex items-center justify-between ${
                  settings.theme === t ? 'border-yellow-400 bg-white/10' : 'border-white/10 bg-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${
                    t === 'classic' ? 'bg-blue-600' : t === 'dark' ? 'bg-zinc-800' : 'bg-purple-600'
                  }`}></div>
                  <span className="capitalize font-bold">{t}</span>
                </div>
                {settings.theme === t && (
                  <div className="w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-blue-900 rounded-full"></div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-auto text-center opacity-30 text-xs py-8">
        MADE WITH ❤️ BY GEMINI<br/>© 2025 UNO MASTER LTD.
      </div>
    </div>
  );
};

export default SettingsView;
