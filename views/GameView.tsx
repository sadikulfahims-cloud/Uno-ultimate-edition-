
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardColor, GameMode, Player, UserProfile, OnlineSubMode } from '../types';
import { createDeck, canPlayCard, shuffle } from '../utils/gameLogic';
import CardUI from '../components/CardUI';
import { LogOut, Mic, MicOff, Volume2, VolumeX, Zap, AlertTriangle, Info, Swords, Trophy, Eye, Home, Medal, MoveLeft, MoveRight } from 'lucide-react';

interface GameViewProps {
  user: UserProfile;
  mode: GameMode;
  subMode?: OnlineSubMode;
  onBack: () => void;
  playSFX: (s: any) => void;
  onGameOver: (won: boolean) => void;
  initialPlayers?: Player[];
  rules?: { initialCards: number };
}

const MERCY_LIMIT = 30;

const GameView: React.FC<GameViewProps> = ({ user, mode, subMode = 'CLASSIC', onBack, playSFX, onGameOver, initialPlayers: lobbyPlayers, rules }) => {
  const [deck, setDeck] = useState<Card[]>([]);
  const [discardPile, setDiscardPile] = useState<Card[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [turnIndex, setTurnIndex] = useState(0);
  const [playDirection, setPlayDirection] = useState<1 | -1>(1); // 1 = Clockwise, -1 = Counter-Clockwise
  const [currentColor, setCurrentColor] = useState<CardColor>('red');
  const [stackCount, setStackCount] = useState(0);
  const [isBlackChain, setIsBlackChain] = useState(false);
  const [message, setMessage] = useState('Game Starting...');
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showPlayerPicker, setShowPlayerPicker] = useState(false);
  const [showHybridPicker, setShowHybridPicker] = useState(false);
  const [hybridSelectedCards, setHybridSelectedCards] = useState<Card[]>([]);
  const [pendingCard, setPendingCard] = useState<Card | null>(null);
  const [eliminatedMessage, setEliminatedMessage] = useState<string | null>(null);
  const [unoShout, setUnoShout] = useState<string | null>(null);

  const [isGameOver, setIsGameOver] = useState(false);
  const [inspectMode, setInspectMode] = useState(false);
  const [rankCounter, setRankCounter] = useState(1);

  // Microphone state
  const [isMicMuted, setIsMicMuted] = useState(true); // Always off by default
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const micStreamRef = useRef<MediaStream | null>(null);

  const isUserTurn = players[turnIndex]?.id === user.id && !players[turnIndex]?.isEliminated && !players[turnIndex]?.isFinished && !isGameOver;

  // Initialize Game
  useEffect(() => {
    const initialDeck = createDeck(subMode as OnlineSubMode);
    let firstCard = initialDeck.pop()!;
    while(firstCard.color === 'wild') {
      initialDeck.unshift(firstCard);
      firstCard = initialDeck.pop()!;
    }

    let gamePlayers: Player[] = [];
    if (mode === 'OFFLINE') {
      const playerCount = 4; 
      gamePlayers = [{ id: user.id, name: user.name, avatar: user.avatar, isBot: false, hand: [] }];
      for(let i = 1; i < playerCount; i++) {
        gamePlayers.push({ 
          id: `bot-${i}`, 
          name: `Bot ${i}`, 
          avatar: `https://picsum.photos/seed/bot${i}/100`, 
          isBot: true, 
          hand: [] 
        });
      }
    } else {
      gamePlayers = lobbyPlayers?.map(p => ({...p, hand: []})) || [{ id: user.id, name: user.name, avatar: user.avatar, isBot: false, hand: [] }];
    }

    const handSize = rules?.initialCards || 7;
    gamePlayers.forEach(p => {
      for (let i = 0; i < handSize; i++) {
        const c = initialDeck.pop();
        if (c) p.hand.push(c);
      }
    });

    setDeck(initialDeck);
    setDiscardPile([firstCard]);
    setCurrentColor(firstCard.color);
    setPlayers(gamePlayers);
    setMessage(`${gamePlayers[0].name}'s Turn`);

    // Clean up microphone on unmount
    return () => {
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(track => track.stop());
        micStreamRef.current = null;
      }
    };
  }, []);

  const triggerUnoShout = (playerName: string) => {
    playSFX('uno');
    setUnoShout(playerName);
    setTimeout(() => setUnoShout(null), 1800);
  };

  const checkGameOver = (updatedPlayers: Player[]) => {
    const active = updatedPlayers.filter(p => !p.isEliminated && !p.isFinished);
    if (active.length <= 1) {
      if (active.length === 1) {
        const lastPlayerIdx = updatedPlayers.findIndex(p => p.id === active[0].id);
        if (lastPlayerIdx !== -1) {
          updatedPlayers[lastPlayerIdx].isFinished = true;
          updatedPlayers[lastPlayerIdx].rank = rankCounter;
          updatedPlayers[lastPlayerIdx].finalHand = [...updatedPlayers[lastPlayerIdx].hand];
        }
      }
      setIsGameOver(true);
      setMessage('Match Complete');
      return true;
    }
    return false;
  };

  const findNextActiveIndex = (currentIdx: number, playersList: Player[], skipCount = 1, direction: 1 | -1) => {
    let next = currentIdx;
    for (let i = 0; i < skipCount; i++) {
      next = (next + direction + playersList.length) % playersList.length;
      let limit = playersList.length;
      while ((playersList[next].isEliminated || playersList[next].isFinished) && limit > 0) {
        next = (next + direction + playersList.length) % playersList.length;
        limit--;
      }
    }
    return next;
  };

  const handleElimination = (playerId: string, updatedPlayers: Player[]) => {
    const idx = updatedPlayers.findIndex(p => p.id === playerId);
    if (idx === -1) return updatedPlayers;

    updatedPlayers[idx].finalHand = [...updatedPlayers[idx].hand];
    const cardsToReturn = [...updatedPlayers[idx].hand];
    updatedPlayers[idx].isEliminated = true;
    updatedPlayers[idx].hand = [];
    setDeck(prev => shuffle([...prev, ...cardsToReturn]));

    if (playerId === user.id) {
      setEliminatedMessage("Out of Mercy! Limit reached.");
    }

    checkGameOver(updatedPlayers);
    return updatedPlayers;
  };

  const executeDraw = (playerId: string) => {
    if (isGameOver) return;
    playSFX('draw');
    setPlayers(currentPlayers => {
      let updated = [...currentPlayers];
      const idx = updated.findIndex(p => p.id === playerId);
      if (idx === -1) return currentPlayers;
      
      const count = stackCount > 0 ? stackCount : 1;
      const newDeck = [...deck];
      for (let i = 0; i < count; i++) {
        const c = newDeck.pop();
        if (c) updated[idx].hand.push(c);
      }
      setDeck(newDeck);

      if (updated[idx].hand.length > MERCY_LIMIT && subMode !== 'CLASSIC') {
        updated = handleElimination(playerId, updated);
      }

      setStackCount(0);
      setIsBlackChain(false);
      
      if (!isGameOver) {
        const nextIdx = findNextActiveIndex(idx, updated, 1, playDirection);
        setTurnIndex(nextIdx);
        setMessage(`${updated[nextIdx].name}'s Turn`);
      }
      return updated;
    });
  };

  const executePlay = (playerId: string, card: Card, selectedColor: CardColor, extras?: { swapTarget?: string, hybridCards?: Card[] }) => {
    if (isGameOver) return;
    playSFX('cardPlay');
    
    setPlayers(currentPlayers => {
      let updated = [...currentPlayers];
      let workingDeck = [...deck];
      let newDirection = playDirection;
      const idx = updated.findIndex(p => p.id === playerId);
      if (idx === -1) return currentPlayers;

      let cardToPlay = { ...card };
      if (extras?.hybridCards) {
        cardToPlay.components = [...extras.hybridCards];
      }

      // Card Action Handlers
      if (card.value === 'ghostswap' && extras?.swapTarget) {
        const targetIdx = updated.findIndex(p => p.id === extras.swapTarget);
        if (targetIdx !== -1) {
          const sourceHand = updated[idx].hand.filter(c => c.id !== card.id);
          const targetHand = [...updated[targetIdx].hand];
          updated[idx].hand = targetHand;
          updated[targetIdx].hand = sourceHand;
        }
      } else {
        updated[idx].hand = updated[idx].hand.filter(c => c.id !== card.id);
        if (extras?.hybridCards) {
          const hIds = extras.hybridCards.map(h => h.id);
          updated[idx].hand = updated[idx].hand.filter(c => !hIds.includes(c.id));
        }
      }

      if (updated[idx].hand.length === 1) {
        triggerUnoShout(updated[idx].name);
      }

      // Finish Logic
      if (updated[idx].hand.length === 0) {
        updated[idx].isFinished = true;
        updated[idx].rank = rankCounter;
        updated[idx].finalHand = [];
        setRankCounter(prev => prev + 1);
        playSFX('win');
        
        if (checkGameOver(updated)) {
           setDiscardPile(prev => [cardToPlay, ...prev]);
           setCurrentColor(selectedColor);
           return updated;
        }
      }

      setDiscardPile(prev => [cardToPlay, ...prev]);
      setCurrentColor(selectedColor);

      let skipCount = 1;
      let newStack = stackCount;

      const applyEffect = (c: Card) => {
        if (c.value === 'reverse' || c.value === 'reverse4' || c.value === 'elitereverse') {
          newDirection = (newDirection === 1 ? -1 : 1);
          setPlayDirection(newDirection);
        }

        if (c.value === 'all4') {
          playSFX('draw');
          updated = updated.map((p) => {
            if (p.isEliminated || p.isFinished || p.id === playerId) return p;
            const newHand = [...p.hand];
            for (let i = 0; i < 4; i++) {
              const drawn = workingDeck.pop();
              if (drawn) newHand.push(drawn);
            }
            return { ...p, hand: newHand };
          });
          updated.forEach(p => {
            if (p.hand.length > MERCY_LIMIT && subMode !== 'CLASSIC' && !p.isEliminated && !p.isFinished) {
              updated = handleElimination(p.id, updated);
            }
          });
          return;
        }

        const plus: Record<string, number> = { 'draw2': 2, 'draw4': 4, 'reverse4': 4, 'draw6': 6, 'draw10': 10 };
        if (c.value in plus) {
          newStack += plus[c.value];
          if (c.color === 'wild') setIsBlackChain(true);
        }
        if (c.value === 'skip') skipCount++;
      };
      
      applyEffect(card);
      extras?.hybridCards?.forEach(applyEffect);
      
      setDeck(workingDeck);
      setStackCount(newStack);

      if (!isGameOver) {
        const nextIdx = findNextActiveIndex(idx, updated, skipCount, newDirection);
        setTurnIndex(nextIdx);
        setMessage(`${updated[nextIdx].name}'s Turn`);
      }
      
      return updated;
    });
  };

  useEffect(() => {
    if (isGameOver) return;
    const bot = players[turnIndex];
    if (bot?.isBot && !bot.isEliminated && !bot.isFinished) {
      const timer = setTimeout(() => {
        const playable = bot.hand.find(c => canPlayCard(c, discardPile[0], currentColor, stackCount, isBlackChain));
        if (playable) {
          let color: CardColor = playable.color === 'wild' ? (['red', 'blue', 'green', 'yellow'] as CardColor[])[Math.floor(Math.random() * 4)] : playable.color;
          let extras: any = {};
          if (playable.value === 'ghostswap') {
            const targets = players.filter(p => p.id !== bot.id && !p.isEliminated && !p.isFinished);
            if (targets.length > 0) extras.swapTarget = targets[0].id;
          }
          if (playable.value === 'hybrid') {
             const others = bot.hand.filter(c => c.id !== playable.id);
             if (others.length >= 2) extras.hybridCards = [others[0], others[1]];
          }
          executePlay(bot.id, playable, color, extras);
        } else {
          executeDraw(bot.id);
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [turnIndex, players, discardPile, currentColor, stackCount, isBlackChain, isGameOver, playDirection]);

  const handleUserPlay = (card: Card) => {
    if (!isUserTurn) return;
    if (!canPlayCard(card, discardPile[0], currentColor, stackCount, isBlackChain)) return;
    
    setPendingCard(card);
    if (card.value === 'vanishing') executePlay(user.id, card, currentColor);
    else if (card.value === 'ghostswap') setShowPlayerPicker(true);
    else if (card.value === 'hybrid') {
        const eligible = players.find(p => p.id === user.id)?.hand.filter(c => c.id !== card.id) || [];
        if (eligible.length < 2) {
            alert("Need 2 additional cards to sacrifice for Hybrid Attack!");
            return;
        }
        setShowHybridPicker(true);
        setHybridSelectedCards([]);
    }
    else if (card.color === 'wild') setShowColorPicker(true);
    else executePlay(user.id, card, card.color);
  };

  const handleMicToggle = async () => {
    if (isMicMuted) {
      try {
        // Explicitly ask for microphone permission when trying to enable
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStreamRef.current = stream;
        setIsMicMuted(false);
      } catch (err) {
        alert("Microphone permission denied. Enable it in settings to use voice chat.");
      }
    } else {
      // Stop use of microphone immediately
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(track => track.stop());
        micStreamRef.current = null;
      }
      setIsMicMuted(true);
    }
  };

  const getProfileScale = () => {
    const count = players.length;
    if (count <= 4) return { avatar: 'w-16 h-16', grid: 'grid-cols-2 sm:grid-cols-4', name: 'text-xs' };
    if (count <= 8) return { avatar: 'w-12 h-12', grid: 'grid-cols-4 sm:grid-cols-4', name: 'text-[10px]' };
    return { avatar: 'w-10 h-10', grid: 'grid-cols-5 sm:grid-cols-8', name: 'text-[8px]' };
  };

  const scale = getProfileScale();

  const handleFinalExit = () => {
    const userRank = players.find(p => p.id === user.id)?.rank;
    onGameOver(userRank === 1);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#05050a] text-white h-screen overflow-hidden relative font-sans">
      
      {unoShout && (
        <div className="absolute inset-0 z-[4000] flex items-center justify-center pointer-events-none overflow-hidden bg-black/60 backdrop-blur-md">
          <div className="relative text-center animate-bounce-in">
             <div className="text-[160px] font-game text-yellow-400 italic leading-none drop-shadow-[0_0_80px_rgba(234,179,8,1)]">UNO!</div>
             <div className="bg-white text-blue-900 px-10 py-3 rounded-full font-black uppercase tracking-[0.4em] text-xl shadow-2xl">
                {unoShout.toUpperCase()} CALLS IT
             </div>
          </div>
        </div>
      )}

      <div className="h-[30vh] p-4 bg-white/5 backdrop-blur-md border-b border-white/10 z-50 flex flex-col">
        <div className="flex justify-between items-center mb-2 px-2">
           <div className="flex gap-2">
              <button onClick={handleMicToggle} className={`p-1.5 rounded-full transition-colors ${isMicMuted ? 'text-red-500 bg-red-500/10' : 'text-green-500 bg-green-500/10'}`}>
                {isMicMuted ? <MicOff size={14} /> : <Mic size={14} />}
              </button>
              <button onClick={() => setIsSpeakerMuted(!isSpeakerMuted)} className="p-1.5 bg-white/10 rounded-full text-white/60">
                {isSpeakerMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </button>
           </div>
           <div className="flex items-center gap-2 bg-yellow-400/20 px-4 py-0.5 rounded-full border border-yellow-400/30">
              {playDirection === 1 ? <MoveRight size={14} className="text-yellow-400" /> : <MoveLeft size={14} className="text-yellow-400" />}
              <span className="text-[9px] font-black text-yellow-400 uppercase tracking-tighter">{subMode}</span>
           </div>
           <button onClick={() => setShowExitConfirm(true)} className="p-1.5 text-white/40 hover:text-red-500">
             <LogOut size={16} />
           </button>
        </div>

        <div className={`flex-1 grid gap-2 items-center justify-items-center ${scale.grid}`}>
          {players.map((p, idx) => (
            <div 
              key={p.id} 
              className={`flex flex-col items-center gap-1 transition-all duration-300 ${turnIndex === idx && !isGameOver ? 'scale-110' : 'scale-90 opacity-60'}`}
            >
               <div className="relative">
                  <div className={`absolute -inset-1 rounded-full blur-md transition-opacity duration-500 ${turnIndex === idx && !isGameOver ? 'bg-yellow-400 opacity-40' : 'opacity-0'}`} />
                  <img 
                    src={p.avatar} 
                    className={`${scale.avatar} rounded-full border-2 transition-all duration-300 object-cover ${turnIndex === idx && !isGameOver ? 'border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.6)]' : 'border-white/20'}`} 
                  />
                  <div className="absolute -bottom-1 -right-1 bg-zinc-900 border border-white/20 rounded-full px-1.5 py-0.5 text-[8px] font-black text-white">
                    {p.isFinished ? 'FIN' : p.hand.length}
                  </div>
                  {p.isEliminated && (
                    <div className="absolute inset-0 bg-black/80 rounded-full flex items-center justify-center">
                       <span className="text-red-500 font-black text-[10px] uppercase">OUT</span>
                    </div>
                  )}
                  {p.isFinished && (
                    <div className="absolute -top-2 -right-2 bg-yellow-400 text-blue-900 rounded-full w-5 h-5 flex items-center justify-center border-2 border-zinc-900 font-game text-[10px]">
                      {p.rank}
                    </div>
                  )}
               </div>
               <span className={`${scale.name} font-bold uppercase tracking-widest truncate w-16 text-center`}>{p.id === user.id ? 'ME' : p.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="h-[40vh] relative grid grid-cols-3 w-full items-center px-6 overflow-hidden bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.03)_0%,_transparent_70%)]">
        <div className={`w-64 h-64 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 blur-[120px] opacity-20 transition-colors duration-1000 ${
          currentColor === 'red' ? 'bg-red-600' : currentColor === 'blue' ? 'bg-blue-600' : currentColor === 'green' ? 'bg-green-600' : 'bg-yellow-400'
        }`}></div>

        <div className="flex flex-col items-center justify-center gap-3">
          <div className="relative group cursor-pointer active:scale-90 transition-all" onClick={() => isUserTurn && executeDraw(user.id)}>
             <CardUI card={{} as any} facedown size="md" className="shadow-2xl relative z-10" />
          </div>
          <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em]">Deployment Deck</span>
        </div>

        <div className="col-span-2 flex flex-col items-center justify-center pl-8">
          <div className="relative w-32 h-32 flex items-center justify-center">
            {discardPile.slice(0, 4).map((c, i) => (
              <CardUI 
                key={c.id} 
                card={c} 
                size="lg" 
                className={`absolute transition-all duration-700 shadow-2xl ${
                  i === 0 ? 'z-30 scale-110' : 
                  i === 1 ? 'z-20 -translate-x-6 -rotate-12 opacity-50 scale-100' : 
                  'opacity-0 translate-y-4 scale-90'
                }`} 
              />
            ))}
          </div>

          <div className="mt-14 text-center">
             <div className="font-game text-3xl text-white tracking-widest drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
               {stackCount > 0 ? `+${stackCount} STACKING` : message.toUpperCase()}
             </div>
             <div className="flex items-center justify-center gap-3 mt-2">
                <span className={`text-[12px] font-black uppercase tracking-[0.2em] px-3 py-0.5 rounded-full border ${
                  currentColor === 'red' ? 'text-red-500 border-red-500/30' : 
                  currentColor === 'blue' ? 'text-blue-500 border-blue-500/30' : 
                  currentColor === 'green' ? 'text-green-500 border-green-500/30' : 
                  'text-yellow-400 border-yellow-400/30'
                }`}>
                  {currentColor}
                </span>
             </div>
          </div>
        </div>
      </div>

      <div className="h-[30vh] bg-white/[0.02] border-t border-white/5 p-4 backdrop-blur-3xl relative z-40 overflow-hidden">
        <div className="flex gap-3 overflow-x-auto pb-8 scrollbar-hide px-2 items-end min-h-[160px]">
          {players.find(p => p.id === user.id)?.hand.map((card) => {
            const playable = isUserTurn && canPlayCard(card, discardPile[0], currentColor, stackCount, isBlackChain);
            return (
              <CardUI 
                key={card.id} 
                card={card} 
                onClick={() => handleUserPlay(card)} 
                disabled={!isUserTurn || !playable}
                isPlayable={playable}
                className="hover:-translate-y-2 transition-all duration-300"
              />
            );
          })}
        </div>
      </div>

      {isGameOver && !inspectMode && (
        <div className="absolute inset-0 z-[5000] bg-black/95 flex flex-col items-center justify-center p-8 backdrop-blur-3xl animate-fade-in">
           <Trophy size={60} className="text-yellow-400 mb-4 animate-bounce" />
           <h2 className="font-game text-5xl text-white mb-8 italic uppercase tracking-tighter">Battle Results</h2>
           
           <div className="w-full max-w-sm space-y-3 mb-10 overflow-y-auto max-h-[50vh] pr-2 scrollbar-hide">
              {players.sort((a, b) => (a.rank || 99) - (b.rank || 99)).map((p, i) => (
                 <div key={p.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                       <div className="relative">
                         <img src={p.avatar} className="w-12 h-12 rounded-full border-2 border-white/20 object-cover" />
                         {i < 3 && (
                           <div className={`absolute -top-2 -left-2 rounded-full p-1 border border-zinc-900 ${
                             i === 0 ? 'bg-yellow-400' : i === 1 ? 'bg-zinc-400' : 'bg-orange-600'
                           }`}>
                             <Medal size={12} className="text-black" />
                           </div>
                         )}
                       </div>
                       <div>
                          <div className="font-bold text-sm uppercase tracking-widest">{p.name}</div>
                          <div className="text-[10px] opacity-40 uppercase font-black tracking-widest">
                             {p.isEliminated ? 'ELIMINATED' : p.isFinished ? 'DEPLOYED' : 'FIGHTING'}
                          </div>
                       </div>
                    </div>
                    <div className="font-game text-2xl text-yellow-400">#{p.rank || players.length}</div>
                 </div>
              ))}
           </div>

           <div className="flex flex-col w-full max-w-sm gap-4">
              <button 
                onClick={() => setInspectMode(true)}
                className="w-full py-4 bg-white/5 border border-white/10 text-white/60 font-game text-xl rounded-[25px] hover:bg-white/10 transition-all uppercase flex items-center justify-center gap-3"
              >
                <Eye size={20} /> INSPECT PLAYS
              </button>
              <button 
                onClick={handleFinalExit}
                className="w-full py-6 bg-yellow-400 text-blue-900 font-game text-2xl rounded-[30px] shadow-3xl active:scale-95 transition-all uppercase"
              >
                RETURN TO HUB
              </button>
           </div>
        </div>
      )}

      {inspectMode && (
        <div className="absolute bottom-0 left-0 right-0 z-[5100] bg-black/80 backdrop-blur-2xl p-6 border-t border-yellow-400/20 animate-fade-in flex items-center justify-between">
           <div className="flex items-center gap-3">
              <Eye className="text-yellow-400" />
              <div className="font-game text-lg tracking-tight uppercase">Tactical Inspection</div>
           </div>
           <button onClick={handleFinalExit} className="flex items-center gap-3 px-8 py-4 bg-yellow-400 text-blue-900 rounded-2xl font-game text-xl shadow-xl active:scale-95 transition-all">
             <Home size={20} /> HUB EXIT
           </button>
        </div>
      )}

      {showHybridPicker && (
        <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-black/95 p-8 backdrop-blur-2xl">
           <div className="bg-zinc-900 border border-white/10 p-8 rounded-[40px] w-full max-w-sm shadow-2xl animate-bounce-in text-center">
              <h3 className="font-game text-2xl text-yellow-400 mb-2 uppercase">HYBRID ATTACK</h3>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-8">Select 2 cards to sacrifice</p>
              <div className="grid grid-cols-4 gap-2 mb-8 h-32 overflow-y-auto pr-1">
                {players.find(p => p.id === user.id)?.hand
                  .filter(c => c.id !== pendingCard?.id)
                  .map(c => {
                    const isSelected = hybridSelectedCards.some(s => s.id === c.id);
                    return (
                      <div key={c.id} onClick={() => {
                          if (isSelected) setHybridSelectedCards(prev => prev.filter(s => s.id !== c.id));
                          else if (hybridSelectedCards.length < 2) setHybridSelectedCards(prev => [...prev, c]);
                        }}
                        className={`cursor-pointer transition-all ${isSelected ? 'scale-105 opacity-100' : 'opacity-40 hover:opacity-100'}`}
                      >
                         <CardUI card={c} size="sm" isSelected={isSelected} />
                      </div>
                    );
                  })}
              </div>
              <div className="flex gap-4">
                 <button onClick={() => setShowHybridPicker(false)} className="flex-1 py-4 bg-white/5 rounded-2xl font-black text-[10px] uppercase">Abort</button>
                 <button 
                  disabled={hybridSelectedCards.length !== 2}
                  onClick={() => { setShowHybridPicker(false); setShowColorPicker(true); }}
                  className="flex-1 py-4 bg-yellow-400 text-blue-900 rounded-2xl font-black text-[10px] uppercase disabled:opacity-20 transition-opacity"
                 >
                   Deploy Combo
                 </button>
              </div>
           </div>
        </div>
      )}

      {showColorPicker && (
        <div className="absolute inset-0 z-[1100] flex items-center justify-center bg-black/90 backdrop-blur-xl">
           <div className="bg-zinc-900 p-10 rounded-[50px] border border-white/10 text-center w-full max-w-xs shadow-2xl animate-bounce-in">
              <h3 className="font-game text-3xl mb-10 text-white uppercase tracking-tighter">Reprogram Color</h3>
              <div className="grid grid-cols-2 gap-5">
                 {(['red', 'blue', 'green', 'yellow'] as CardColor[]).map(c => (
                    <button key={c} onClick={() => { 
                        setShowColorPicker(false); 
                        executePlay(user.id, pendingCard!, c, { hybridCards: hybridSelectedCards.length > 0 ? hybridSelectedCards : undefined }); 
                        setHybridSelectedCards([]);
                      }} 
                      className={`h-24 rounded-3xl transition-all active:scale-95 shadow-2xl border-4 border-white/5 ${
                        c === 'red' ? 'bg-red-500' : c === 'blue' ? 'bg-blue-500' : c === 'green' ? 'bg-green-500' : 'bg-yellow-400'
                      }`} 
                    />
                 ))}
              </div>
           </div>
        </div>
      )}

      {showPlayerPicker && (
        <div className="absolute inset-0 z-[1200] flex items-center justify-center bg-black/95 backdrop-blur-2xl">
           <div className="bg-zinc-900 border border-white/10 p-12 rounded-[50px] w-full max-w-sm shadow-2xl animate-bounce-in text-center">
              <h3 className="font-game text-3xl text-yellow-400 mb-10 uppercase tracking-tight">Ghost Target</h3>
              <div className="grid grid-cols-2 gap-6">
                 {players.filter(p => p.id !== user.id && !p.isEliminated && !p.isFinished).map(p => (
                    <button key={p.id} onClick={() => { setShowPlayerPicker(false); executePlay(user.id, pendingCard!, currentColor, { swapTarget: p.id }); }} className="flex flex-col items-center gap-4 p-5 bg-white/5 rounded-[40px] border border-white/5 active:scale-90 transition-all">
                       <img src={p.avatar} className="w-16 h-16 rounded-full border-2 border-white/20 object-cover" />
                       <div className="text-[10px] font-black uppercase tracking-widest truncate w-full text-center">{p.name}</div>
                    </button>
                 ))}
              </div>
           </div>
        </div>
      )}

      {showExitConfirm && (
        <div className="absolute inset-0 z-[2000] flex items-center justify-center bg-black/98 p-10 backdrop-blur-3xl">
          <div className="bg-zinc-900 p-12 rounded-[60px] border border-red-500/20 text-center max-w-xs shadow-3xl animate-bounce-in">
            <h3 className="font-game text-4xl mb-6 text-white uppercase italic">Terminate?</h3>
            <div className="flex flex-col gap-4">
                <button onClick={onBack} className="py-6 bg-red-600 text-white rounded-[30px] font-black uppercase text-xs tracking-widest active:scale-95 transition-all">Abort Session</button>
                <button onClick={() => setShowExitConfirm(false)} className="py-6 bg-white/5 rounded-[30px] font-black uppercase text-xs tracking-widest text-white/30">Resume Battle</button>
            </div>
          </div>
        </div>
      )}

      {eliminatedMessage && !isGameOver && (
        <div className="absolute inset-0 z-[3000] flex items-center justify-center bg-black p-10 backdrop-blur-3xl">
           <div className="bg-red-500/10 border border-red-500/20 p-12 rounded-[60px] text-center max-w-sm animate-bounce-in">
              <AlertTriangle size={80} className="mx-auto text-red-500 mb-8 animate-pulse" />
              <h2 className="font-game text-6xl text-white mb-4 uppercase italic">DEFEATED</h2>
              <p className="text-sm text-red-200 font-bold uppercase tracking-widest mb-12 leading-relaxed">{eliminatedMessage}</p>
              <button onClick={() => setEliminatedMessage(null)} className="w-full py-7 bg-white text-red-600 font-game text-2xl rounded-[35px] uppercase">Watch Battle</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default GameView;
