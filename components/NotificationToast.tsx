
import React from 'react';
import { Bell, X } from 'lucide-react';

interface NotificationToastProps {
  message: string;
  onClick: () => void;
  onClose: () => void;
}

const NotificationToast: React.FC<NotificationToastProps> = ({ message, onClick, onClose }) => {
  return (
    <div className="absolute top-4 left-4 right-4 z-[100] animate-bounce-in">
      <div 
        className="bg-zinc-900/95 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl p-4 flex items-center gap-4 cursor-pointer active:scale-95 transition-transform"
        onClick={onClick}
      >
        <div className="bg-yellow-400 text-blue-900 p-2 rounded-xl">
          <Bell size={20} fill="currentColor" />
        </div>
        <div className="flex-1">
          <div className="text-[10px] uppercase font-black tracking-widest text-yellow-400 mb-0.5">Game Notification</div>
          <p className="text-sm font-bold leading-tight">{message}</p>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="p-1 hover:bg-white/10 rounded-lg text-white/40"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

export default NotificationToast;
