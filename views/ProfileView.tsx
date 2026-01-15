
import React, { useState } from 'react';
import { UserProfile } from '../types';
import { ChevronLeft, Camera, ShieldCheck, Facebook, Phone, Mail } from 'lucide-react';
import { AVATARS, SOUNDS } from '../constants';

interface ProfileViewProps {
  user: UserProfile;
  onUpdate: (name: string, avatar: string) => void;
  onBack: () => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ user, onUpdate, onBack }) => {
  const [name, setName] = useState(user.name);
  const [avatar, setAvatar] = useState(user.avatar);
  const [isLoggingIn, setIsLoggingIn] = useState<string | null>(null);

  const playClick = () => {
    const audio = new Audio(SOUNDS.click);
    audio.play().catch(() => {});
  };

  const handleSave = () => {
    playClick();
    onUpdate(name, avatar);
    onBack();
  };

  const simulateLogin = (method: string) => {
    playClick();
    setIsLoggingIn(method);
    setTimeout(() => {
      setIsLoggingIn(null);
      alert(`${method} Login Successful! Progress synced.`);
    }, 1500);
  };

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto bg-black/20">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => { playClick(); onBack(); }} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h2 className="font-game text-3xl">MY PROFILE</h2>
      </div>

      <div className="flex flex-col items-center mb-8">
        <div className="relative group mb-6">
          <img src={avatar} className="w-32 h-32 rounded-full border-4 border-white shadow-2xl transition-transform group-hover:scale-105" alt="Avatar" />
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
            <Camera size={24} className="text-white" />
          </div>
        </div>
        
        <div className="flex gap-3 overflow-x-auto pb-6 max-w-full scrollbar-hide">
          {AVATARS.map(a => (
            <button 
              key={a} 
              onClick={() => { playClick(); setAvatar(a); }}
              className={`shrink-0 w-14 h-14 rounded-full border-4 transition-all active:scale-90 ${avatar === a ? 'border-yellow-400 scale-110' : 'border-white/10'}`}
            >
              <img src={a} className="w-full h-full rounded-full" alt="option" />
            </button>
          ))}
        </div>

        <div className="w-full space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-white/40 uppercase ml-2 tracking-widest">Display Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 focus:ring-2 focus:ring-yellow-400 outline-none transition-all"
            />
          </div>
          <div className="bg-white/5 p-4 rounded-2xl flex items-center justify-between border border-white/5">
            <span className="text-xs font-bold opacity-40 uppercase tracking-widest">Unique Player ID</span>
            <span className="font-mono font-black text-yellow-400 text-sm">{user.id}</span>
          </div>
        </div>
      </div>

      <div className="space-y-4 mb-10">
        <h3 className="text-[10px] font-black text-white/40 uppercase ml-2 tracking-widest flex items-center gap-2">
            <ShieldCheck size={16} /> Login to Save Progress
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <button 
            disabled={!!isLoggingIn}
            onClick={() => simulateLogin('Facebook')}
            className="flex flex-col items-center justify-center p-4 bg-blue-600 rounded-2xl hover:bg-blue-500 transition-all active:scale-95 shadow-lg disabled:opacity-50"
          >
            <Facebook size={24} />
            <span className="text-[9px] mt-2 uppercase font-black">Facebook</span>
          </button>
          <button 
            disabled={!!isLoggingIn}
            onClick={() => simulateLogin('Google')}
            className="flex flex-col items-center justify-center p-4 bg-white text-black rounded-2xl hover:bg-zinc-200 transition-all active:scale-95 shadow-lg disabled:opacity-50"
          >
            <Mail size={24} />
            <span className="text-[9px] mt-2 uppercase font-black">Google</span>
          </button>
          <button 
            disabled={!!isLoggingIn}
            onClick={() => simulateLogin('Mobile')}
            className="flex flex-col items-center justify-center p-4 bg-green-600 rounded-2xl hover:bg-green-500 transition-all active:scale-95 shadow-lg disabled:opacity-50"
          >
            <Phone size={24} />
            <span className="text-[9px] mt-2 uppercase font-black">Mobile</span>
          </button>
        </div>
        {isLoggingIn && (
          <div className="text-center text-[10px] font-black text-yellow-400 animate-pulse">CONNECTING TO {isLoggingIn.toUpperCase()}...</div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-10">
        <div className="bg-blue-500/10 p-5 rounded-3xl border border-blue-500/20 text-center">
            <div className="text-3xl font-game text-blue-400">{user.wins}</div>
            <div className="text-[9px] opacity-40 uppercase font-black tracking-widest">Total Wins</div>
        </div>
        <div className="bg-red-500/10 p-5 rounded-3xl border border-red-500/20 text-center">
            <div className="text-3xl font-game text-red-400">{user.losses}</div>
            <div className="text-[9px] opacity-40 uppercase font-black tracking-widest">Total Losses</div>
        </div>
      </div>

      <button 
        onClick={handleSave}
        className="w-full py-5 bg-yellow-400 text-blue-900 font-game text-xl rounded-3xl shadow-xl hover:bg-yellow-300 transition-all border-b-8 border-yellow-600 active:translate-y-1"
      >
        SAVE CHANGES
      </button>
    </div>
  );
};

export default ProfileView;
