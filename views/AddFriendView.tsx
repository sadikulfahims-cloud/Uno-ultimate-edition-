
import React, { useState } from 'react';
import { ChevronLeft, Search, UserPlus, ShieldAlert } from 'lucide-react';

interface AddFriendViewProps {
  onBack: () => void;
  onInvite: (id: string) => void;
}

const AddFriendView: React.FC<AddFriendViewProps> = ({ onBack, onInvite }) => {
  const [searchId, setSearchId] = useState('');
  const [foundUser, setFoundUser] = useState<{id: string, name: string} | null>(null);

  const handleSearch = () => {
    // Mock search logic
    if (searchId.length > 5) {
      setFoundUser({ id: searchId, name: `Player_${searchId.split('-')[1] || 'Unknown'}` });
    } else {
      setFoundUser(null);
      alert("Invalid ID or player not found");
    }
  };

  return (
    <div className="flex-1 flex flex-col p-6">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-2 bg-white/10 rounded-full">
          <ChevronLeft size={24} />
        </button>
        <h2 className="font-game text-3xl">ADD FRIEND</h2>
      </div>

      <div className="space-y-6">
        <div className="relative">
          <label className="text-xs font-bold text-white/50 uppercase ml-2 mb-2 block">Enter Player ID</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="e.g. UID-1234-AB"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value.toUpperCase())}
              className="flex-1 bg-white/10 border-none rounded-xl py-4 px-5 focus:ring-2 focus:ring-yellow-400 outline-none uppercase font-mono"
            />
            <button 
              onClick={handleSearch}
              className="px-6 bg-yellow-400 text-blue-900 rounded-xl font-bold hover:bg-yellow-300 transition-colors"
            >
              <Search size={24} />
            </button>
          </div>
        </div>

        {foundUser ? (
          <div className="bg-white/10 p-6 rounded-3xl border border-white/10 animate-card-draw">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full border-4 border-white shadow-xl flex items-center justify-center text-4xl font-game">
                {foundUser.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-2xl font-bold">{foundUser.name}</h3>
                <p className="text-sm opacity-50 font-mono">{foundUser.id}</p>
              </div>
              <button 
                onClick={() => onInvite(foundUser.id)}
                className="w-full mt-4 py-4 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg"
              >
                <UserPlus size={20} /> SEND FRIEND REQUEST
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 px-8 bg-white/5 rounded-3xl border border-dashed border-white/10 text-center opacity-50">
            <ShieldAlert size={48} className="mb-4" />
            <p className="text-sm">Enter a valid player ID to search. You can find your ID in the Profile screen.</p>
          </div>
        )}
      </div>

      <div className="mt-8">
        <h4 className="text-[10px] font-bold text-white/40 uppercase mb-4 ml-2">Recent Searches</h4>
        <div className="space-y-2 opacity-50">
            <div className="p-3 bg-white/5 rounded-lg flex justify-between text-sm">
                <span>UID-9001-ZZ</span>
                <span className="text-[10px]">2 days ago</span>
            </div>
            <div className="p-3 bg-white/5 rounded-lg flex justify-between text-sm">
                <span>UID-4412-MK</span>
                <span className="text-[10px]">1 week ago</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AddFriendView;
