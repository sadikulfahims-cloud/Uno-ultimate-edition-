
import React from 'react';
import { FriendRequest } from '../types';
import { ChevronLeft, Inbox, Check, X, User } from 'lucide-react';

interface MailboxViewProps {
  requests: FriendRequest[];
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onBack: () => void;
}

const MailboxView: React.FC<MailboxViewProps> = ({ requests, onAccept, onReject, onBack }) => {
  return (
    <div className="flex-1 flex flex-col p-6 overflow-hidden">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-2 bg-white/10 rounded-full">
          <ChevronLeft size={24} />
        </button>
        <h2 className="font-game text-3xl">MAILBOX</h2>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-4 scrollbar-thin scrollbar-thumb-white/20">
        {requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-30">
            <Inbox size={64} className="mb-4" />
            <p className="font-bold">No new messages</p>
          </div>
        ) : (
          requests.map(req => (
            <div key={req.id} className="bg-white/10 p-4 rounded-2xl flex items-center justify-between animate-card-draw">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center border border-blue-500/30">
                  <User size={24} />
                </div>
                <div>
                  <div className="font-bold text-sm">{req.fromName}</div>
                  <div className="text-[10px] opacity-40 uppercase tracking-tighter">Wants to be friends!</div>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => onReject(req.id)}
                  className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
                <button 
                  onClick={() => onAccept(req.id)}
                  className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500 hover:text-white transition-colors"
                >
                  <Check size={20} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MailboxView;
