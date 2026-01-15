
import React, { useState, useEffect } from 'react';
import { ChevronLeft, Globe, Search, RefreshCw, User, ShieldCheck } from 'lucide-react';
import { Lobby } from '../types';
import { AVATARS } from '../constants';

interface OnlineJoinViewProps {
  onBack: () => void;
  onJoin: (room: Lobby) => void;
}

const OnlineJoinView: React.FC<OnlineJoinViewProps> = ({ onBack, onJoin }) => {
  const [rooms, setRooms] = useState<Lobby[]>([]);
  const [isSearching, setIsSearching] = useState(true);
  const [roomCode, setRoomCode] = useState('');

  useEffect(() => {
    // Simulate searching for public online lobbies
    const timer = setTimeout(() => {
      setRooms([
        {
          id: "LOBBY-7721",
          hostId: 'host-101',
          hostName: 'DragonMaster',
          isLocal: false,
          players: [
            { id: 'host-101', name: 'DragonMaster', avatar: AVATARS[1], isBot: false, hand: [], isReady: true },
            { id: 'guest-1', name: 'AceHunter', avatar: AVATARS[0], isBot: false, hand: [], isReady: true }
          ],
          rules: { subMode: 'NO_MERCY', initialCards: 7 }
        },
        {
          id: "LOBBY-1109",
          hostId: 'host-102',
          hostName: 'UnoLegend',
          isLocal: false,
          players: [
            { id: 'host-102', name: 'UnoLegend', avatar: AVATARS[2], isBot: false, hand: [], isReady: true }
          ],
          rules: { subMode: 'CLASSIC', initialCards: 10 }
        },
        {
          id: "LOBBY-9982",
          hostId: 'host-103',
          hostName: 'WildSpirit',
          isLocal: false,
          players: [
            { id: 'host-103', name: 'WildSpirit', avatar: AVATARS[3], isBot: false, hand: [], isReady: true }
          ],
          rules: { subMode: 'SUPERIOR', initialCards: 5 }
        }
      ]);
      setIsSearching(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex-1 flex flex-col p-6 overflow-hidden bg-black/20">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-2 bg-white/10 rounded-full">
          <ChevronLeft size={24} />
        </button>
        <h2 className="font-game text-3xl">FIND MATCH</h2>
      </div>

      <div className="space-y-6">
        <div className="relative">
          <label className="text-[10px] font-black text-white/30 uppercase ml-2 mb-2 block tracking-widest">Join via Room Code</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="E.G. LOBBY-1234"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              className="flex-1 bg-white/10 border-white/5 rounded-2xl py-4 px-5 focus:ring-2 focus:ring-yellow-400 outline-none uppercase font-mono text-sm"
            />
            <button 
              onClick={() => {
                if (roomCode.startsWith('LOBBY-')) {
                    onJoin({
                        id: roomCode,
                        hostId: 'other',
                        hostName: 'Room Host',
                        isLocal: false,
                        players: [{ id: 'other', name: 'Room Host', avatar: AVATARS[1], isBot: false, hand: [], isReady: true }],
                        rules: { subMode: 'CLASSIC', initialCards: 7 }
                    });
                } else {
                    alert("Enter a valid Lobby Code (LOBBY-XXXX)");
                }
              }}
              className="px-6 bg-yellow-400 text-blue-900 rounded-2xl font-bold hover:bg-yellow-300 transition-colors"
            >
              JOIN
            </button>
          </div>
        </div>

        <div className="h-px bg-white/5"></div>

        <div className="flex items-center justify-between px-2">
            <h4 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Public Lobbies</h4>
            <Globe size={14} className="text-blue-400" />
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-hide min-h-[300px]">
          {isSearching ? (
            <div className="flex flex-col items-center justify-center py-20 opacity-30">
              <RefreshCw size={48} className="animate-spin mb-4" />
              <p className="font-game text-lg tracking-widest">SCANNING SERVERS...</p>
            </div>
          ) : rooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 opacity-30 text-center">
              <Search size={48} className="mb-4" />
              <p className="font-bold">No public rooms found</p>
            </div>
          ) : (
            rooms.map(room => (
              <button 
                key={room.hostId} 
                onClick={() => onJoin(room)}
                className="w-full bg-white/5 p-4 rounded-3xl flex items-center justify-between border border-white/5 hover:bg-white/10 transition-all active:scale-95 group text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-zinc-800 rounded-full border-2 border-white/20 flex items-center justify-center overflow-hidden">
                    <img src={room.players[0].avatar} alt="host" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="font-bold group-hover:text-yellow-400 transition-colors flex items-center gap-2">
                        {room.id}
                        <ShieldCheck size={12} className="text-green-500" />
                    </div>
                    <div className="text-[10px] opacity-40 uppercase font-black tracking-tighter">
                      {room.rules.subMode} • {room.players.length}/15 PLAYERS
                    </div>
                  </div>
                </div>
                <div className="px-4 py-2 bg-blue-500/10 text-blue-400 text-[10px] font-black rounded-xl uppercase border border-blue-500/20">JOIN</div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default OnlineJoinView;
