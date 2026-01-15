
import React from 'react';
import { UserCircle, Settings, Mail, UserPlus } from 'lucide-react';
import { UserProfile, GameMode } from '../types';

interface HomeViewProps {
  user: UserProfile;
  setView: (v: any) => void;
  onStartGame: (mode: GameMode) => void;
}

const HomeView: React.FC<HomeViewProps> = ({ user, setView, onStartGame }) => {
  return (
    <div className="flex-1 flex flex-col p-6">
      {/* Top Bar - Profile, Settings, Mail, Add Friend Icons */}
      <div className="flex justify-between items-center mb-10">
        <button onClick={() => setView('profile')} className="flex items-center gap-2 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
          <UserCircle size={28} />
        </button>
        <div className="flex gap-4">
          <button onClick={() => setView('addFriend')} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
            <UserPlus size={24} />
          </button>
          <button onClick={() => setView('mailbox')} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors relative">
            <Mail size={24} />
            {user.requests.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                {user.requests.length}
              </span>
            )}
          </button>
          <button onClick={() => setView('settings')} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
            <Settings size={24} />
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="w-48 h-48 mb-8 relative">
           <div className="absolute top-0 left-0 w-32 h-44 bg-red-500 rounded-xl border-4 border-white rotate-[-15deg] shadow-xl z-0"></div>
           <div className="absolute top-0 right-0 w-32 h-44 bg-yellow-400 rounded-xl border-4 border-white rotate-[15deg] shadow-xl z-10"></div>
           <div className="absolute top-4 left-8 w-32 h-44 bg-blue-500 rounded-xl border-4 border-white z-20 shadow-2xl flex items-center justify-center">
              <span className="font-game text-5xl text-white">U</span>
           </div>
        </div>
        <h1 className="font-game text-6xl mb-2 tracking-wider drop-shadow-lg text-white">UNO</h1>
        <p className="text-blue-200 mb-12 uppercase text-[10px] font-bold tracking-[0.2em]">The Master Challenge</p>

        {/* Action Buttons */}
        <div className="w-full space-y-4">
          <button 
            onClick={() => onStartGame('OFFLINE')}
            className="w-full py-5 bg-yellow-400 hover:bg-yellow-300 text-blue-900 font-game text-xl rounded-3xl shadow-2xl active:translate-y-1 transition-all border-b-8 border-yellow-600"
          >
            OFFLINE MODE
          </button>
          
          <button 
            onClick={() => onStartGame('ONLINE')}
            className="w-full py-5 bg-blue-500 hover:bg-blue-400 text-white font-game text-xl rounded-3xl shadow-2xl active:translate-y-1 transition-all border-b-8 border-blue-700"
          >
            ONLINE BATTLE
          </button>
        </div>
      </div>

      {/* Footer Info - Unique Player ID */}
      <div className="mt-8 text-center">
        <div className="text-[8px] text-white/30 uppercase tracking-[0.3em] font-bold mb-1">Your Unique Player ID</div>
        <div className="text-[10px] font-mono font-bold text-yellow-400/80 bg-black/20 px-3 py-1 rounded-full inline-block">
          {user.id}
        </div>
      </div>
    </div>
  );
};

export default HomeView;
