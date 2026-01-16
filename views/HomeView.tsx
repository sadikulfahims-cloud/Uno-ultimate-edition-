
import React from 'react';
import { UserCircle, Settings, Mail, UserPlus, Zap } from 'lucide-react';
import { UserProfile, GameMode } from '../types';

interface HomeViewProps {
  user: UserProfile;
  setView: (v: any) => void;
  onStartGame: (mode: GameMode) => void;
}

const HomeView: React.FC<HomeViewProps> = ({ user, setView, onStartGame }) => {
  return (
    <div className="flex-1 flex flex-col p-6 bg-[#020208] relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.15)_0%,_transparent_70%)] pointer-events-none" />
      
      {/* Top Navigation */}
      <div className="flex justify-between items-center mb-10 relative z-10">
        <button onClick={() => setView('profile')} className="flex items-center gap-3 p-1.5 pr-4 bg-white/5 backdrop-blur-xl rounded-full border border-white/10 hover:bg-white/10 transition-all active:scale-95 group">
          <img src={user.avatar} className="w-10 h-10 rounded-full border-2 border-white/20 group-hover:border-blue-400" />
          <div className="flex flex-col items-start leading-none">
            <span className="text-[10px] font-black uppercase text-white/40 tracking-widest mb-0.5">Profile</span>
            <span className="text-xs font-bold text-white truncate max-w-[80px]">{user.name}</span>
          </div>
        </button>
        
        <div className="flex gap-2">
          <button onClick={() => setView('addFriend')} className="p-3 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 hover:bg-white/10 transition-all text-white/60 hover:text-white">
            <UserPlus size={20} />
          </button>
          <button onClick={() => setView('mailbox')} className="p-3 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 hover:bg-white/10 transition-all relative text-white/60 hover:text-white">
            <Mail size={20} />
            {user.requests.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-[9px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-[#020208]">
                {user.requests.length}
              </span>
            )}
          </button>
          <button onClick={() => setView('settings')} className="p-3 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 hover:bg-white/10 transition-all text-white/60 hover:text-white">
            <Settings size={20} />
          </button>
        </div>
      </div>

      {/* Branding Section */}
      <div className="flex-1 flex flex-col items-center justify-center text-center relative z-10">
        <div className="relative w-64 h-64 mb-12 animate-float">
           {/* Layered Cards Shadow Effect */}
           <div className="absolute top-4 left-4 w-44 h-60 bg-red-600 rounded-3xl border-4 border-white rotate-[-12deg] shadow-2xl opacity-40 blur-[1px]"></div>
           <div className="absolute top-2 right-4 w-44 h-60 bg-yellow-400 rounded-3xl border-4 border-white rotate-[15deg] shadow-2xl opacity-60"></div>
           <div className="absolute top-8 left-1/2 -translate-x-1/2 w-48 h-64 bg-blue-500 rounded-[40px] border-[6px] border-white shadow-[0_30px_60px_rgba(0,0,0,0.8)] z-20 flex flex-col items-center justify-center">
              <span className="font-game text-8xl text-white drop-shadow-[0_4px_10px_rgba(0,0,0,0.3)] italic">U</span>
              <div className="absolute bottom-6 font-bold text-[10px] tracking-[0.4em] text-white/40 uppercase">Edition</div>
           </div>
        </div>

        <div className="space-y-2 mb-16">
          <h1 className="font-game text-7xl tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-zinc-200 to-zinc-500 drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]">UNO</h1>
          <div className="flex items-center justify-center gap-3">
            <div className="h-px w-8 bg-blue-500/50"></div>
            <p className="text-blue-400 text-[10px] font-black tracking-[0.5em] uppercase">Ultimate Master</p>
            <div className="h-px w-8 bg-blue-500/50"></div>
          </div>
        </div>

        {/* Action Grid */}
        <div className="w-full max-w-xs space-y-4">
          <button 
            onClick={() => onStartGame('OFFLINE')}
            className="group relative w-full py-6 bg-gradient-to-b from-yellow-300 to-yellow-500 text-blue-950 font-game text-2xl rounded-[30px] shadow-[0_15px_30px_rgba(234,179,8,0.3)] active:translate-y-1 transition-all border-b-8 border-yellow-700 overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            <span className="relative">OFFLINE MODE</span>
          </button>
          
          <button 
            onClick={() => onStartGame('ONLINE')}
            className="group relative w-full py-6 bg-gradient-to-b from-blue-500 to-blue-700 text-white font-game text-2xl rounded-[30px] shadow-[0_15px_30px_rgba(37,99,235,0.3)] active:translate-y-1 transition-all border-b-8 border-blue-900 overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            <span className="relative flex items-center justify-center gap-3">
              ONLINE BATTLE <Zap size={20} fill="currentColor" />
            </span>
          </button>
        </div>
      </div>

      {/* Quick Stats / ID */}
      <div className="mt-8 text-center relative z-10 bg-white/5 backdrop-blur-md rounded-[30px] p-6 border border-white/10">
        <div className="flex justify-around items-center">
          <div className="text-center px-4">
             <div className="text-2xl font-game text-blue-400 leading-none">{user.wins}</div>
             <div className="text-[8px] font-black text-white/30 uppercase tracking-widest mt-1">Victories</div>
          </div>
          <div className="h-8 w-px bg-white/10"></div>
          <div className="text-center px-4">
             <div className="text-[8px] text-white/20 uppercase tracking-[0.3em] font-black mb-1">Deployment ID</div>
             <div className="text-[10px] font-mono font-bold text-yellow-400/80 bg-black/40 px-3 py-1 rounded-full border border-white/5">
               {user.id}
             </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        .animate-float {
          animation: float 5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default HomeView;
