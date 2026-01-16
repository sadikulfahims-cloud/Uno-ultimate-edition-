
import React from 'react';
import { GameSettings } from '../types';
import { ChevronLeft, Volume2, VolumeX, Palette, Music } from 'lucide-react';
import { SOUNDS } from '../constants';

interface SettingsViewProps {
  settings: GameSettings;
  onUpdate: (s: GameSettings) => void;
  onBack: () => void;
  playSFX: (s: keyof typeof SOUNDS) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ settings, onUpdate, onBack, playSFX }) => {
  const handleToggle = (key: keyof GameSettings) => {
    playSFX('click');
    onUpdate({ ...settings, [key]: !settings[key] });
  };

  const handleThemeChange = (t: GameSettings['theme']) => {
    playSFX('click');
    onUpdate({ ...settings, theme: t });
  };

  return (
    <div className="flex-1 flex flex-col p-6">
      <div className="flex items-center gap-4 mb-10">
        <button onClick={onBack} className="p-2 bg-white/10 rounded-full">
          <ChevronLeft size={24} />
        </button>
        <h2 className="font-game text-3xl uppercase tracking-tighter">Tactical Hub</h2>
      </div>

      <div className="space-y-6">
        {/* SFX Toggle */}
        <div className="flex items-center justify-between p-5 bg-white/5 rounded-3xl border border-white/5 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl ${settings.sfx ? 'bg-yellow-400 text-blue-900' : 'bg-white/10 text-white/20'}`}>
              {settings.sfx ? <Volume2 size={24} /> : <VolumeX size={24} />}
            </div>
            <div>
              <div className="font-bold text-sm uppercase tracking-widest">SFX feedback</div>
              <div className="text-[10px] opacity-40 font-black uppercase tracking-tighter">UI and Card sound effects</div>
            </div>
          </div>
          <button 
            onClick={() => handleToggle('sfx')}
            className={`w-14 h-8 rounded-full p-1 transition-all duration-300 relative ${settings.sfx ? 'bg-yellow-400' : 'bg-white/10'}`}
          >
            <div className={`w-6 h-6 bg-white rounded-full transition-transform duration-300 shadow-lg ${settings.sfx ? 'translate-x-6' : 'translate-x-0'}`}></div>
          </button>
        </div>

        {/* Music Toggle */}
        <div className="flex items-center justify-between p-5 bg-white/5 rounded-3xl border border-white/5 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl ${settings.music ? 'bg-blue-500 text-white' : 'bg-white/10 text-white/20'}`}>
              <Music size={24} />
            </div>
            <div>
              <div className="font-bold text-sm uppercase tracking-widest">Background Music</div>
              <div className="text-[10px] opacity-40 font-black uppercase tracking-tighter">Soft atmosphere audio</div>
            </div>
          </div>
          <button 
            onClick={() => handleToggle('music')}
            className={`w-14 h-8 rounded-full p-1 transition-all duration-300 relative ${settings.music ? 'bg-blue-500' : 'bg-white/10'}`}
          >
            <div className={`w-6 h-6 bg-white rounded-full transition-transform duration-300 shadow-lg ${settings.music ? 'translate-x-6' : 'translate-x-0'}`}></div>
          </button>
        </div>

        {/* Theme Picker */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center gap-2 text-[10px] font-black opacity-30 uppercase ml-2 tracking-[0.3em]">
            <Palette size={14} /> UI Environment
          </div>
          <div className="grid grid-cols-1 gap-3">
            {(['classic', 'dark', 'neon'] as const).map(t => (
              <button 
                key={t}
                onClick={() => handleThemeChange(t)}
                className={`w-full p-5 rounded-[30px] border-2 transition-all flex items-center justify-between ${
                  settings.theme === t ? 'border-yellow-400 bg-yellow-400/5 shadow-xl' : 'border-white/5 bg-white/5'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl shadow-inner border border-white/10 ${
                    t === 'classic' ? 'bg-gradient-to-br from-blue-500 to-blue-800' : t === 'dark' ? 'bg-gradient-to-br from-zinc-700 to-black' : 'bg-gradient-to-br from-purple-600 to-pink-600'
                  }`}></div>
                  <div className="text-left">
                     <span className="capitalize font-game text-xl tracking-tight">{t} Environment</span>
                     <div className="text-[9px] opacity-40 font-black uppercase tracking-tighter">Visual Interface style</div>
                  </div>
                </div>
                {settings.theme === t && (
                  <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg">
                    <div className="w-2 h-2 bg-blue-900 rounded-full"></div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-auto text-center opacity-20 text-[9px] font-black uppercase tracking-[0.4em] py-10">
        Ultimate Master v1.0.4<br/>Secure Global Session
      </div>
    </div>
  );
};

export default SettingsView;
