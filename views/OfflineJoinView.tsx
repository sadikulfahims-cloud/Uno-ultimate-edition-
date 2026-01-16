
import React, { useState, useEffect } from 'react';
import { ChevronLeft, Wifi, User, RefreshCw, Signal } from 'lucide-react';
import { Lobby } from '../types';
import { AVATARS, SOUNDS } from '../constants';

interface OfflineJoinViewProps {
  onBack: () => void;
  onJoin: (room: Lobby) => void;
  playSFX: (s: keyof typeof SOUNDS) => void;
}

const OfflineJoinView: React.FC<OfflineJoinViewProps> = ({ onBack, onJoin, playSFX }) => {
  const [rooms, setRooms] = useState<Lobby[]>([]);
  const [isSearching, setIsSearching] = useState(true);

  useEffect(() => {
    // Simulate searching for local rooms on the same network
    const timer = setTimeout(() => {
      setRooms([
        {
          id: "Sadikul's Room",
          hostId: 'host-1',
          hostName: 'Sadikul',
          isLocal: true,
          players: [
            { id: 'host-1', name: 'Sadikul', avatar: AVATARS[1], isBot: false, hand: [], isReady: true }
          ],
          rules: { subMode: 'CLASSIC', initialCards: 7 }
        },
        {
          id: "Rohan's Match",
          hostId: 'host-2',
          hostName: 'Rohan',
          isLocal: true,
          players: [
            { id: 'host-2', name: 'Rohan', avatar: AVATARS[2], isBot: false, hand: [], isReady: true },
            { id: 'p-99', name: 'Guest User', avatar: AVATARS[0], isBot: false, hand: [], isReady: false }
          ],
          rules: { subMode: 'NO_MERCY', initialCards: 10 }
        },
        {
          id: "Alex's Lobby",
          hostId: 'host-3',
          hostName: 'Alex',
          isLocal: true,
          players: [
            { id: 'host-3', name: 'Alex', avatar: AVATARS[3], isBot: false, hand: [], isReady: true }
          ],
          rules: { subMode: 'SUPERIOR', initialCards: 5 }
        }
      ]);
      setIsSearching(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleRefresh = () => {
    playSFX('click');
    setIsSearching(true);
    setRooms([]);
  };

  return (
    <div className="flex-1 flex flex-col p-6 overflow-hidden">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h2 className="font-game text-3xl">JOIN LOCAL ROOM</h2>
      </div>

      <div className="bg-blue-500/20 p-4 rounded-2xl border border-blue-500/30 mb-6 flex items-center gap-3">
        <Wifi className="text-blue-400 animate-pulse" size={20} />
        <p className="text-[10px] uppercase font-bold tracking-wider leading-tight">
          Scanning local network... <br/>
          <span className="opacity-60 text-[9px]">Ensure you are on the same Wi-Fi or Hotspot</span>
        </p>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-3 scrollbar-hide">
        {isSearching ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-30">
            <RefreshCw size={48} className="animate-spin mb-4" />
            <p className="font-bold">Searching for hosts...</p>
          </div>
        ) : rooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-30 text-center">
            <Signal size={48} className="mb-4" />
            <p className="font-bold">No rooms found</p>
            <p className="text-xs max-w-[200px] mt-2">Ask the host to start a room or check your network connection.</p>
          </div>
        ) : (
          rooms.map(room => (
            <button 
              key={room.hostId} 
              onClick={() => onJoin(room)}
              className="w-full bg-white/10 p-4 rounded-2xl flex items-center justify-between border border-white/5 hover:bg-white/20 transition-all active:scale-95 group text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-zinc-800 rounded-full border-2 border-white/20 flex items-center justify-center overflow-hidden">
                  <img src={room.players[0].avatar} alt="host" className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="font-bold group-hover:text-yellow-400 transition-colors">{room.id}</div>
                  <div className="text-[10px] opacity-50 uppercase font-black tracking-tighter">
                    {room.rules.subMode} • {room.players.length} Players joined
                  </div>
                </div>
              </div>
              <ChevronLeft size={20} className="rotate-180 opacity-30 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </button>
          ))
        )}
      </div>

      <button 
        onClick={handleRefresh}
        className="mt-6 py-4 border-2 border-white/10 text-white/50 font-bold uppercase tracking-widest rounded-2xl hover:bg-white/5 hover:text-white transition-all flex items-center justify-center gap-2"
      >
        <RefreshCw size={16} /> Refresh List
      </button>
    </div>
  );
};

export default OfflineJoinView;
