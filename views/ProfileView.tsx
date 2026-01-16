
import React, { useState, useRef, useEffect } from 'react';
import { UserProfile } from '../types';
import { ChevronLeft, Camera, ShieldCheck, Facebook, Phone, Mail, Upload, Edit3, Eye, Image as ImageIcon, X } from 'lucide-react';
import { AVATARS, SOUNDS } from '../constants';

interface ProfileViewProps {
  user: UserProfile;
  onUpdate: (name: string, avatar: string) => void;
  onBack: () => void;
  playSFX: (s: keyof typeof SOUNDS) => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ user, onUpdate, onBack, playSFX }) => {
  const [name, setName] = useState(user.name);
  const [avatar, setAvatar] = useState(user.avatar);
  const [isLoggingIn, setIsLoggingIn] = useState<string | null>(null);
  
  // UI State for Modals
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [showChangeMenu, setShowChangeMenu] = useState(false);
  const [showFullscreenAvatar, setShowFullscreenAvatar] = useState(false);
  const [showCameraMode, setShowCameraMode] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  const handleSave = () => {
    playSFX('click');
    onUpdate(name, avatar);
    onBack();
  };

  const simulateLogin = (method: string) => {
    playSFX('click');
    setIsLoggingIn(method);
    setTimeout(() => {
      setIsLoggingIn(null);
      alert(`${method} Login Successful! Progress synced.`);
    }, 1500);
  };

  const handleUploadFromDevice = () => {
    playSFX('click');
    // Implicitly asks for files/media permission via OS file picker
    fileInputRef.current?.click();
    setShowChangeMenu(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // CAMERA LOGIC
  const startCamera = async () => {
    playSFX('click');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setShowCameraMode(true);
      setShowChangeMenu(false);
    } catch (err) {
      alert("Camera permission is required to take a photo.");
      console.error(err);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCameraMode(false);
  };

  const capturePhoto = () => {
    playSFX('click');
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        setAvatar(canvas.toDataURL('image/jpeg'));
        stopCamera();
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto bg-black/20 relative">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => { playSFX('click'); onBack(); }} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h2 className="font-game text-3xl uppercase tracking-tight">Deployment Profile</h2>
      </div>

      <div className="flex flex-col items-center mb-10">
        <div className="relative group mb-8">
          <button 
            onClick={() => { playSFX('click'); setShowAvatarMenu(true); }}
            className="relative block"
          >
            <img src={avatar} className="w-36 h-36 rounded-full border-4 border-white shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-transform hover:scale-105 object-cover bg-zinc-800" alt="Avatar" />
            <div className="absolute bottom-1 right-1 bg-yellow-400 p-2 rounded-full border-4 border-zinc-900 shadow-lg text-blue-900">
               <Camera size={20} />
            </div>
          </button>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />
        </div>
        
        <div className="w-full space-y-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2 ml-2">
               <Edit3 size={12} className="text-white/40" />
               <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Change Identity Name</label>
            </div>
            <input 
              type="text" 
              value={name}
              placeholder="Enter your name..."
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-[25px] py-5 px-6 focus:ring-2 focus:ring-yellow-400 outline-none transition-all font-bold text-white placeholder:text-white/20 text-lg shadow-inner"
            />
          </div>
          <div className="bg-white/5 p-5 rounded-[25px] flex items-center justify-between border border-white/5">
            <span className="text-xs font-bold opacity-40 uppercase tracking-widest">Global Battle ID</span>
            <span className="font-mono font-black text-yellow-400 text-sm tracking-tighter">{user.id}</span>
          </div>
        </div>
      </div>

      {/* Login Options */}
      <div className="space-y-4 mb-10">
        <h3 className="text-[10px] font-black text-white/40 uppercase ml-2 tracking-widest flex items-center gap-2">
            <ShieldCheck size={16} /> Cloud Progress Sync
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <button onClick={() => simulateLogin('Facebook')} className="flex flex-col items-center justify-center p-5 bg-blue-600 rounded-3xl hover:bg-blue-500 transition-all active:scale-95 shadow-lg">
            <Facebook size={28} />
            <span className="text-[10px] mt-2 uppercase font-black">FB</span>
          </button>
          <button onClick={() => simulateLogin('Google')} className="flex flex-col items-center justify-center p-5 bg-white text-black rounded-3xl hover:bg-zinc-200 transition-all active:scale-95 shadow-lg">
            <Mail size={28} />
            <span className="text-[10px] mt-2 uppercase font-black">GMAIL</span>
          </button>
          <button onClick={() => simulateLogin('Mobile')} className="flex flex-col items-center justify-center p-5 bg-green-600 rounded-3xl hover:bg-green-500 transition-all active:scale-95 shadow-lg">
            <Phone size={28} />
            <span className="text-[10px] mt-2 uppercase font-black">SMS</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-10">
        <div className="bg-blue-500/10 p-6 rounded-[35px] border border-blue-500/20 text-center">
            <div className="text-4xl font-game text-blue-400 leading-none mb-1">{user.wins}</div>
            <div className="text-[10px] opacity-40 uppercase font-black tracking-widest">Deployed Wins</div>
        </div>
        <div className="bg-red-500/10 p-6 rounded-[35px] border border-red-500/20 text-center">
            <div className="text-4xl font-game text-red-400 leading-none mb-1">{user.losses}</div>
            <div className="text-[10px] opacity-40 uppercase font-black tracking-widest">Total Losses</div>
        </div>
      </div>

      <button 
        onClick={handleSave}
        className="w-full py-6 bg-yellow-400 text-blue-900 font-game text-2xl rounded-[35px] shadow-[0_15px_30px_rgba(234,179,8,0.2)] hover:bg-yellow-300 transition-all border-b-8 border-yellow-600 active:translate-y-1 mb-10"
      >
        SYNC CHANGES
      </button>

      {/* --- MODALS --- */}

      {/* 1. Main Avatar Menu */}
      {showAvatarMenu && (
        <div className="fixed inset-0 z-[2000] flex items-end justify-center bg-black/80 backdrop-blur-md p-6 animate-fade-in" onClick={() => setShowAvatarMenu(false)}>
           <div className="w-full max-w-sm bg-zinc-900 rounded-[40px] p-6 space-y-3 animate-bounce-in" onClick={e => e.stopPropagation()}>
              <h3 className="text-center font-black text-[10px] uppercase tracking-[0.3em] opacity-30 mb-6">Profile Picture Actions</h3>
              <button onClick={() => { playSFX('click'); setShowFullscreenAvatar(true); setShowAvatarMenu(false); }} className="w-full py-5 bg-white/5 rounded-2xl flex items-center justify-center gap-4 hover:bg-white/10 font-bold transition-all">
                <Eye className="text-blue-400" /> See Profile Picture
              </button>
              <button onClick={() => { playSFX('click'); setShowChangeMenu(true); setShowAvatarMenu(false); }} className="w-full py-5 bg-white/5 rounded-2xl flex items-center justify-center gap-4 hover:bg-white/10 font-bold transition-all">
                <ImageIcon className="text-yellow-400" /> Change Profile Picture
              </button>
              <button onClick={() => { playSFX('click'); setShowAvatarMenu(false); }} className="w-full py-5 bg-red-500/10 text-red-500 rounded-2xl font-black uppercase tracking-widest text-xs mt-4">Cancel</button>
           </div>
        </div>
      )}

      {/* 2. Change Photo Menu */}
      {showChangeMenu && (
        <div className="fixed inset-0 z-[2100] flex items-center justify-center bg-black/90 backdrop-blur-xl p-6 animate-fade-in" onClick={() => setShowChangeMenu(false)}>
           <div className="w-full max-w-sm bg-zinc-900 rounded-[50px] p-10 text-center border border-white/5 shadow-2xl animate-bounce-in" onClick={e => e.stopPropagation()}>
              <h3 className="font-game text-3xl mb-8 uppercase italic">Update Image</h3>
              <div className="grid grid-cols-2 gap-4 mb-8">
                 <button onClick={startCamera} className="flex flex-col items-center gap-4 p-8 bg-white/5 rounded-[40px] border border-white/5 hover:bg-yellow-400 hover:text-blue-900 transition-all group">
                    <Camera size={32} className="group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">Take<br/>Photo</span>
                 </button>
                 <button onClick={handleUploadFromDevice} className="flex flex-col items-center gap-4 p-8 bg-white/5 rounded-[40px] border border-white/5 hover:bg-blue-500 transition-all group">
                    <Upload size={32} className="group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">Upload<br/>Device</span>
                 </button>
              </div>
              <div className="space-y-2 mb-8">
                 <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-4">Or choose preset</p>
                 <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
                   {AVATARS.map(a => (
                     <button key={a} onClick={() => { playSFX('click'); setAvatar(a); setShowChangeMenu(false); }} className="shrink-0">
                       <img src={a} className="w-12 h-12 rounded-full border-2 border-white/10 hover:border-white transition-all object-cover" />
                     </button>
                   ))}
                 </div>
              </div>
              <button onClick={() => { playSFX('click'); setShowChangeMenu(false); }} className="text-white/40 font-black uppercase tracking-widest text-[10px]">Close</button>
           </div>
        </div>
      )}

      {/* 3. Fullscreen Avatar View */}
      {showFullscreenAvatar && (
        <div className="fixed inset-0 z-[3000] bg-black flex flex-col items-center justify-center p-10 animate-fade-in" onClick={() => setShowFullscreenAvatar(false)}>
           <button className="absolute top-10 right-10 p-4 text-white/40 hover:text-white transition-colors">
              <X size={32} />
           </button>
           <img src={avatar} className="w-full max-w-xs aspect-square object-cover rounded-[50px] shadow-3xl border-8 border-white/5" />
           <div className="mt-10 font-game text-4xl uppercase tracking-tighter text-white/40 italic">{name}</div>
        </div>
      )}

      {/* 4. Camera Mode */}
      {showCameraMode && (
        <div className="fixed inset-0 z-[4000] bg-black flex flex-col animate-fade-in">
           <div className="flex-1 relative overflow-hidden flex items-center justify-center">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              <div className="absolute inset-0 border-[40px] border-black/60 pointer-events-none flex items-center justify-center">
                 <div className="w-64 h-64 border-4 border-white/20 rounded-full" />
              </div>
           </div>
           <div className="h-48 bg-zinc-950 flex items-center justify-around px-10">
              <button onClick={() => { playSFX('click'); stopCamera(); }} className="p-4 text-white/60 font-black text-xs uppercase tracking-widest">Cancel</button>
              <button onClick={capturePhoto} className="w-20 h-20 bg-white rounded-full border-8 border-zinc-800 shadow-2xl active:scale-90 transition-transform" />
              <div className="w-12" /> {/* Spacer */}
           </div>
           <canvas ref={canvasRef} className="hidden" />
        </div>
      )}
    </div>
  );
};

export default ProfileView;
