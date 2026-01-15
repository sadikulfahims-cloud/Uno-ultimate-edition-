
import React, { useState } from 'react';
import { Lobby, Player, UserProfile } from '../types';
import { ChevronLeft, Share2, Copy, Check, UserPlus, PlayCircle, Users, Info } from 'lucide-react';
import { AVATARS } from '../constants';

interface LobbyViewProps {
  user: UserProfile;
  lobby: Lobby;
  onBack: () => void;
  onStart: () => void;
}

const LobbyView: React.FC<LobbyViewProps> = ({ user, lobby, onBack, onStart }) => {
  const [copied, setCopied] = useState(false);
  const isHost = lobby.hostId === user.id;

  const joinLink = `https://gemini-uno.io/join/${lobby.id.replace(/\s+/g, '-').toLowerCase()}`;

  const copyLink = () => {
    navigator.clipboard.writeText(joinLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Mock online friends to invite
  const onlineFriends = [
    { id: 'UID-777-KIM', name: 'Lucky Kim', avatar: AVATARS[1] },
    { id: 'UID-555-JOE', name: 'Mean Joe', avatar: AVATARS[2] },
    { id: 'UID-123-AMY', name: 'Aiming Amy', avatar: AVATARS[3] }
  ];

  return (
    <div className="flex-1 flex flex-col p-6 overflow-hidden bg-black/20">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <button onClick={onBack} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors shrink-0">
          <ChevronLeft size={24} />
        </button>

        {lobby.isLocal ? (
          <div className="flex-1 ml-4 text-left">
            <h2 className="font-game text-lg leading-tight text-yellow-400">{lobby.id}</h2>
            <div className="flex flex-col mt-1 text-[9px] font-bold uppercase tracking-widest text-white/40">
              <span>Mode: <span className="text-white">{lobby.rules.subMode}</span></span>
              <span>Joined: <span className="text-white">{lobby.players.length}/15</span></span>
            </div>
          </div>
        ) : (
          <div className="text-center flex-1">
            <h2 className="font-game text-2xl tracking-tight">GAME LOBBY</h2>
            <p className="text-[9px] opacity-40 uppercase tracking-[0.2em]">{lobby.id}</p>
          </div>
        )}
        <div className="w-10"></div>
      </div>

      {/* Online Specific: Link & Invites */}
      {!lobby.isLocal && isHost && (
        <div className="space-y-6 mb-6">
          <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
            <label className="text-[9px] font-black text-white/30 uppercase mb-3 block tracking-widest">Share Match Link</label>
            <div className="flex gap-2">
                <div className="flex-1 bg-black/40 rounded-xl px-4 py-3 text-[10px] font-mono overflow-hidden whitespace-nowrap opacity-60">
                    {joinLink}
                </div>
                <button 
                    onClick={copyLink}
                    className={`px-4 rounded-xl flex items-center justify-center transition-all active:scale-90 ${copied ? 'bg-green-500' : 'bg-blue-600 hover:bg-blue-500'}`}
                >
                    {copied ? <Check size={18} /> : <Copy size={18} />}
                </button>
            </div>
          </div>

          <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
            <h3 className="text-[9px] font-black text-white/30 uppercase mb-4 tracking-widest flex items-center gap-2">
              <UserPlus size={14} /> <span>Quick Invite Friends</span>
            </h3>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {onlineFriends.map(friend => (
                <button 
                  key={friend.id}
                  className="shrink-0 flex flex-col items-center gap-2 group active:scale-95 transition-all"
                  onClick={() => alert(`Invitation sent to ${friend.name}`)}
                >
                  <div className="relative">
                    <img src={friend.avatar} className="w-10 h-10 rounded-full border-2 border-white/10 group-hover:border-blue-400" alt="friend" />
                    <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white rounded-full p-0.5 border border-zinc-900">
                      <UserPlus size={10} />
                    </div>
                  </div>
                  <span className="text-[8px] font-bold text-white/60 group-hover:text-white truncate w-12 text-center">{friend.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Players List */}
      <div className="flex-1 overflow-y-auto mb-6 pr-1 scrollbar-hide">
        <h3 className="text-[9px] font-black text-white/30 uppercase mb-4 tracking-widest flex items-center gap-2 px-2">
          <Users size={14} /> <span>Connected Players ({lobby.players.length}/15)</span>
        </h3>
        
        <div className="space-y-3">
            {lobby.players.map(p => (
                <div key={p.id} className="bg-white/5 p-4 rounded-2xl flex items-center justify-between border border-white/5 animate-card-draw">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                          <img src={p.avatar} className="w-12 h-12 rounded-full border-2 border-white/10" alt="player" />
                          {p.id === lobby.hostId && <div className="absolute -top-1 -right-1 bg-yellow-400 text-blue-900 rounded-full p-1 border-2 border-zinc-900"><Info size={8} fill="currentColor" /></div>}
                        </div>
                        <div>
                            <div className="text-sm font-bold flex items-center gap-2">
                                {p.name}
                                {p.id === lobby.hostId && <span className="text-[7px] bg-yellow-400 text-blue-900 px-1 py-0.5 rounded font-black uppercase">Host</span>}
                            </div>
                            <div className="text-[8px] opacity-30 uppercase font-black tracking-tighter">Status: {p.isReady ? 'Ready to Battle' : 'Setting up...'}</div>
                        </div>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${p.isReady ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-white/20'}`}></div>
                </div>
            ))}
        </div>
      </div>

      {/* Footer Start Button */}
      <div className="pt-6 border-t border-white/10">
        {isHost ? (
            <button 
                onClick={onStart}
                className="w-full py-5 bg-green-500 hover:bg-green-400 text-white font-game text-2xl rounded-3xl shadow-2xl flex items-center justify-center gap-3 active:translate-y-1 transition-all border-b-8 border-green-700"
            >
                <PlayCircle size={28} /> START MATCH
            </button>
        ) : (
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center animate-pulse">
                <div className="text-xs font-bold text-yellow-400 uppercase tracking-widest">
                    Waiting for host to start...
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default LobbyView;
