
import React from 'react';

interface SplashViewProps {
  onInteract: () => void;
}

const SplashView: React.FC<SplashViewProps> = ({ onInteract }) => {
  return (
    <div 
      className="fixed inset-0 bg-[#020208] flex flex-col items-center justify-center overflow-hidden z-[1000] cursor-pointer"
      onClick={onInteract}
    >
      {/* High-fidelity Space Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(40,60,180,0.1)_0%,_transparent_80%)]" />
        {[...Array(120)].map((_, i) => (
          <div 
            key={i}
            className="absolute rounded-full bg-white animate-pulse"
            style={{
              width: Math.random() * 2 + 0.5 + 'px',
              height: Math.random() * 2 + 0.5 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              opacity: Math.random() * 0.8 + 0.2,
              animationDelay: Math.random() * 5 + 's',
              animationDuration: Math.random() * 3 + 2 + 's'
            }}
          />
        ))}
        {/* Subtle glowing nebula clouds */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-600/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-600/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center scale-100 sm:scale-110 md:scale-125">
        {/* Main Circular Tech Logo Composition */}
        <div className="relative w-80 h-80 flex items-center justify-center animate-bounce-in">
          
          {/* Circular Tech Arcs with precise SVG paths */}
          <div className="absolute inset-0">
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]">
              <defs>
                <pattern id="techGrid" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                   <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.1" opacity="0.3" />
                   <circle cx="2" cy="2" r="0.2" fill="white" opacity="0.4" />
                </pattern>
                
                <linearGradient id="chromeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="45%" stopColor="#d1d5db" />
                  <stop offset="50%" stopColor="#9ca3af" />
                  <stop offset="100%" stopColor="#4b5563" />
                </linearGradient>

                <filter id="neonGlowRed"><feGaussianBlur stdDeviation="1" result="blur"/><feComposite in="SourceGraphic" in2="blur" operator="over"/></filter>
                <filter id="neonGlowGreen"><feGaussianBlur stdDeviation="1" result="blur"/><feComposite in="SourceGraphic" in2="blur" operator="over"/></filter>
                <filter id="neonGlowBlue"><feGaussianBlur stdDeviation="1" result="blur"/><feComposite in="SourceGraphic" in2="blur" operator="over"/></filter>
                <filter id="neonGlowYellow"><feGaussianBlur stdDeviation="1" result="blur"/><feComposite in="SourceGraphic" in2="blur" operator="over"/></filter>
              </defs>

              {/* Red Tech Arc (Top Left) */}
              <g filter="url(#neonGlowRed)">
                <path d="M 45 6 A 44 44 0 0 0 6 45 L 18 45 A 32 32 0 0 1 45 18 Z" fill="#ef4444" />
                <path d="M 45 6 A 44 44 0 0 0 6 45 L 18 45 A 32 32 0 0 1 45 18 Z" fill="url(#techGrid)" />
                <path d="M 45 6 A 44 44 0 0 0 6 45 L 18 45 A 32 32 0 0 1 45 18 Z" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
              </g>

              {/* Green Tech Arc (Top Right) */}
              <g filter="url(#neonGlowGreen)">
                <path d="M 55 6 A 44 44 0 0 1 94 45 L 82 45 A 32 32 0 0 0 55 18 Z" fill="#22c55e" />
                <path d="M 55 6 A 44 44 0 0 1 94 45 L 82 45 A 32 32 0 0 0 55 18 Z" fill="url(#techGrid)" />
                <path d="M 55 6 A 44 44 0 0 1 94 45 L 82 45 A 32 32 0 0 0 55 18 Z" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
              </g>

              {/* Blue Tech Arc (Bottom Left) */}
              <g filter="url(#neonGlowBlue)">
                <path d="M 6 55 A 44 44 0 0 0 45 94 L 45 82 A 32 32 0 0 1 18 55 Z" fill="#3b82f6" />
                <path d="M 6 55 A 44 44 0 0 0 45 94 L 45 82 A 32 32 0 0 1 18 55 Z" fill="url(#techGrid)" />
                <path d="M 6 55 A 44 44 0 0 0 45 94 L 45 82 A 32 32 0 0 1 18 55 Z" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
              </g>

              {/* Yellow Tech Arc (Bottom Right) */}
              <g filter="url(#neonGlowYellow)">
                <path d="M 94 55 A 44 44 0 0 1 55 94 L 55 82 A 32 32 0 0 0 82 55 Z" fill="#eab308" />
                <path d="M 94 55 A 44 44 0 0 1 55 94 L 55 82 A 32 32 0 0 0 82 55 Z" fill="url(#techGrid)" />
                <path d="M 94 55 A 44 44 0 0 1 55 94 L 55 82 A 32 32 0 0 0 82 55 Z" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
              </g>
            </svg>
          </div>

          {/* Central Logo Content Area */}
          <div className="relative flex flex-col items-center justify-center -translate-y-2">
            
            {/* Chrome/Metallic UNO Text */}
            <div className="relative z-30 mb-[-10px]">
              <h1 className="font-game text-[88px] italic leading-none select-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-zinc-300 to-zinc-500 drop-shadow-[0_4px_0_#000] drop-shadow-[0_8px_15px_rgba(0,0,0,0.8)]">
                UNO
              </h1>
              <div className="absolute inset-0 font-game text-[88px] italic leading-none select-none tracking-tighter text-white/10 blur-[2px] -z-10 translate-y-[2px]" aria-hidden="true">
                UNO
              </div>
            </div>

            {/* Central Orbital Energy Swirl with separated cards */}
            <div className="relative w-40 h-40 flex items-center justify-center z-20">
              {/* Swirling Particle/Energy Rings */}
              <div className="absolute inset-0 rounded-full border-2 border-dashed border-white/10 animate-[spin_10s_linear_infinite]" />
              <div className="absolute inset-4 rounded-full border border-white/5 animate-[spin_15s_linear_infinite_reverse]" />
              
              {/* Central Glow */}
              <div className="absolute inset-10 bg-gradient-to-br from-blue-500 via-purple-500 to-red-500 rounded-full blur-3xl opacity-20 animate-pulse" />

              {/* Separated Flipped Cards */}
              <div className="relative flex items-center justify-center gap-2">
                 {/* Card 1 */}
                 <div className="w-12 h-18 bg-zinc-900 border-2 border-white rounded-lg flex items-center justify-center shadow-2xl -rotate-[20deg] -translate-x-4 animate-[float_4s_ease-in-out_infinite]">
                    <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center border border-white">
                      <span className="font-game text-white text-[10px]">U</span>
                    </div>
                 </div>
                 {/* Card 2 (Center) */}
                 <div className="w-14 h-20 bg-zinc-900 border-2 border-white rounded-lg flex items-center justify-center shadow-2xl z-10 animate-[float_4.5s_ease-in-out_infinite_reverse]">
                    <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center border-2 border-white">
                      <span className="font-game text-white text-xs">U</span>
                    </div>
                 </div>
                 {/* Card 3 */}
                 <div className="w-12 h-18 bg-zinc-900 border-2 border-white rounded-lg flex items-center justify-center shadow-2xl rotate-[20deg] translate-x-4 animate-[float_5s_ease-in-out_infinite]">
                    <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center border border-white">
                      <span className="font-game text-white text-[10px]">U</span>
                    </div>
                 </div>
                 
                 {/* Floating Decorative Cards */}
                 <div className="absolute top-[-40px] right-[-20px] w-6 h-10 bg-zinc-900 border border-white rounded-md rotate-[35deg] opacity-60 shadow-lg animate-pulse" />
                 <div className="absolute bottom-[-30px] left-[-30px] w-6 h-10 bg-zinc-900 border border-white rounded-md -rotate-[45deg] opacity-40 shadow-lg animate-pulse" />
              </div>
            </div>

            {/* Ultimate Edition Badge */}
            <div className="mt-[-15px] z-40 bg-black/90 px-12 py-2 rounded-full border border-white/20 shadow-[0_0_40px_rgba(0,0,0,1)]">
               <span className="font-bold text-sm text-white tracking-[0.25em] uppercase whitespace-nowrap">
                  Ultimate Edition
               </span>
            </div>
          </div>
        </div>

        {/* Signature */}
        <div className="mt-20 opacity-80 animate-pulse">
           <span className="font-light text-white text-lg tracking-widest font-sans italic">
             by sadikul fahim
           </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-16 w-56 h-[1.5px] bg-white/5 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-transparent via-white/50 to-transparent w-0 animate-[loading_4s_ease-in-out_forwards]" />
      </div>

      <style>{`
        @keyframes loading {
          0% { width: 0%; left: -100%; }
          100% { width: 100%; left: 0%; }
        }
        @keyframes bounce-in {
          0% { transform: scale(0.4); opacity: 0; }
          50% { transform: scale(1.05); opacity: 1; }
          70% { transform: scale(0.98); }
          100% { transform: scale(1); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(-20deg); }
          50% { transform: translateY(-10px) rotate(-15deg); }
        }
      `}</style>
    </div>
  );
};

export default SplashView;
