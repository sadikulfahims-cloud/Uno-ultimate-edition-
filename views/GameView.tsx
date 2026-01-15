
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardColor, GameMode, Player, UserProfile, OnlineSubMode } from '../types';
import { createDeck, canPlayCard } from '../utils/gameLogic';
import CardUI from '../components/CardUI';
import { LogOut, Mic, MicOff, Volume2, VolumeX, Ghost, Replace, Zap } from 'lucide-react';

interface GameViewProps {
  user: UserProfile;
  mode: GameMode;
  subMode?: OnlineSubMode;
  onBack: () => void;
  playSFX: (s: any) => void;
  onGameOver: (won: boolean) => void;
  initialPlayers?: Player[];
  rules?: { initialCards: number }; // Added rules to prop types
}

const GameView: React.FC<GameViewProps> = ({ user, mode, subMode = 'CLASSIC', onBack, playSFX, onGameOver, initialPlayers: lobbyPlayers, rules }) => {
  const [deck, setDeck] = useState<Card[]>([]);
  const [discardPile, setDiscardPile] = useState<Card[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [turnIndex, setTurnIndex] = useState(0);
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
  // Track the target player for Ghost Swap
  const [pendingSwapTarget, setPendingSwapTarget] = useState<string | null>(null);

  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);

  const currentPlayer = players[turnIndex];
  const isUserTurn = currentPlayer?.id === user.id && !currentPlayer.isEliminated;

  useEffect(() => {
    const initialDeck = createDeck(subMode as OnlineSubMode);
    let firstCard = initialDeck.pop()!;
    while(firstCard.color === 'wild') {
      initialDeck.unshift(firstCard);
      firstCard = initialDeck.pop()!;
    }

    let gamePlayers: Player[] = [];
    if (mode === 'OFFLINE') {
      const playerCount = Math.floor(Math.random() * 12) + 4; 
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
      gamePlayers = lobbyPlayers || [{ id: user.id, name: user.name, avatar: user.avatar, isBot: false, hand: [] }];
    }

    // Determine hand size from rules or default to 7
    const handSize = rules?.initialCards || 7;

    gamePlayers.forEach(p => {
      // Ensure hand is empty before dealing
      p.hand = [];
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
  }, [mode, subMode, user, lobbyPlayers, rules]);

  const nextTurn = useCallback((skipCount = 1) => {
    setTurnIndex(prev => {
      let next = prev;
      for (let i = 0; i < skipCount; i++) {
        next = (next + 1) % players.length;
        let searchLimit = players.length;
        while (players[next].isEliminated && searchLimit > 0) {
          next = (next + 1) % players.length;
          searchLimit--;
        }

        if (players[next].isVanished) {
            setPlayers(prevPlayers => {
                const updated = [...prevPlayers];
                updated[next] = { ...updated[next], isVanished: false };
                return updated;
            });
            next = (next + 1) % players.length;
            while (players[next].isEliminated) {
                next = (next + 1) % players.length;
            }
        }
      }
      setMessage(`${players[next].name}'s Turn`);
      return next;
    });
  }, [players]);

  const executeDraw = useCallback((playerId: string) => {
    playSFX('draw');
    setPlayers(prev => {
      const updated = [...prev];
      const idx = updated.findIndex(p => p.id === playerId);
      if (idx === -1) return prev;
      const count = stackCount > 0 ? stackCount : 1;
      const newDeck = [...deck];
      for (let i = 0; i < count; i++) {
        const c = newDeck.pop();
        if (c) updated[idx].hand.push(c);
      }
      setDeck(newDeck);
      return updated;
    });
    setStackCount(0);
    setIsBlackChain(false);
    nextTurn();
  }, [deck, stackCount, nextTurn, playSFX]);

  const executeGhostSwap = useCallback((sourceId: string, targetId: string) => {
    playSFX('cardPlay');
    setPlayers(prev => {
      const updated = [...prev];
      const sourceIdx = updated.findIndex(p => p.id === sourceId);
      const targetIdx = updated.findIndex(p => p.id === targetId);
      if (sourceIdx === -1 || targetIdx === -1) return prev;
      const tempHand = [...updated[sourceIdx].hand];
      updated[sourceIdx].hand = [...updated[targetIdx].hand];
      updated[targetIdx].hand = tempHand;
      setMessage(`Ghost Swap: ${updated[sourceIdx].name} swapped with ${updated[targetIdx].name}!`);
      return updated;
    });
  }, [playSFX]);

  const executePlay = useCallback((playerId: string, card: Card, selectedColor: CardColor, extras?: { swapTarget?: string, hybridCards?: Card[] }) => {
    playSFX('cardPlay');
    
    setPlayers(prev => {
      const updated = [...prev];
      const idx = updated.findIndex(p => p.id === playerId);
      if (idx === -1) return prev;
      
      if (card.value === 'vanishing') {
        updated[idx] = { ...updated[idx], isVanished: true };
        setMessage(`${updated[idx].name} has Vanished! Effects pass to next player.`);
      }

      // Remove the main card
      updated[idx].hand = updated[idx].hand.filter(c => c.id !== card.id);
      
      // Remove any hybrid additions
      if (extras?.hybridCards) {
        const hybridIds = extras.hybridCards.map(h => h.id);
        updated[idx].hand = updated[idx].hand.filter(c => !hybridIds.includes(c.id));
      }

      if (updated[idx].hand.length === 1) playSFX('uno');
      if (updated[idx].hand.length === 0) onGameOver(playerId === user.id);
      return updated;
    });

    if (card.value === 'ghostswap' && extras?.swapTarget) {
      executeGhostSwap(playerId, extras.swapTarget);
    }

    setDiscardPile(prev => [card, ...prev]);
    setCurrentColor(selectedColor);

    let skipCount = 1;
    let newStack = stackCount;

    // Helper to calculate effects
    const applyEffects = (c: Card) => {
      const plusValues: Record<string, number> = { 'draw2': 2, 'draw4': 4, 'reverse4': 4, 'draw6': 6, 'draw10': 10, 'all4': 4 };
      if (c.value in plusValues) {
        newStack += plusValues[c.value];
        if (c.color === 'wild' && c.value !== 'wild') setIsBlackChain(true);
      }
      if (c.value === 'skip') skipCount++;
      // Reverse logic could be added here if needed
    };

    applyEffects(card);
    if (extras?.hybridCards) {
      extras.hybridCards.forEach(applyEffects);
    }
    
    setStackCount(newStack);
    nextTurn(skipCount);
  }, [stackCount, nextTurn, playSFX, onGameOver, user.id, executeGhostSwap]);

  useEffect(() => {
    if (players[turnIndex]?.isBot && !players[turnIndex]?.isEliminated) {
      const bot = players[turnIndex];
      const timer = setTimeout(() => {
        const playableCard = bot.hand.find(c => canPlayCard(c, discardPile[0], currentColor, stackCount, isBlackChain));
        if (playableCard) {
          let botColor: CardColor = playableCard.color === 'wild' ? 'red' : playableCard.color;
          let extras: any = {};

          if (playableCard.value === 'ghostswap') {
            const potentialTargets = players.filter(p => p.id !== bot.id && !p.isEliminated);
            extras.swapTarget = potentialTargets.reduce((a, b) => a.hand.length < b.hand.length ? a : b).id;
          }

          if (playableCard.value === 'hybrid') {
            const others = bot.hand.filter(c => c.id !== playableCard.id);
            if (others.length >= 2) {
              extras.hybridCards = [others[0], others[1]];
            }
          }

          if (playableCard.color === 'wild') {
            const counts = { red: 0, blue: 0, green: 0, yellow: 0 };
            bot.hand.forEach(c => { if(c.color !== 'wild') counts[c.color]++ });
            botColor = (Object.keys(counts) as CardColor[]).reduce((a, b) => counts[a] > counts[b] ? a : b) as CardColor;
          }
          executePlay(bot.id, playableCard, botColor, extras);
        } else {
          executeDraw(bot.id);
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [turnIndex, players, discardPile, currentColor, stackCount, isBlackChain, executePlay, executeDraw]);

  const handleUserPlay = (card: Card) => {
    if (!isUserTurn) return;
    if (!canPlayCard(card, discardPile[0], currentColor, stackCount, isBlackChain)) return;
    setPendingCard(card);
    setPendingSwapTarget(null); // Reset swap target
    
    if (card.value === 'ghostswap') {
      setShowPlayerPicker(true);
    } else if (card.value === 'hybrid') {
      setShowHybridPicker(true);
      setHybridSelectedCards([]);
    } else if (card.color === 'wild') {
      setShowColorPicker(true);
    } else {
      executePlay(user.id, card, card.color);
    }
  };

  const handleHybridSelection = (card: Card) => {
    if (hybridSelectedCards.find(c => c.id === card.id)) {
      setHybridSelectedCards(prev => prev.filter(c => c.id !== card.id));
    } else {
      if (hybridSelectedCards.length < 2) {
        setHybridSelectedCards(prev => [...prev, card]);
      }
    }
  };

  // Finalize Ghost Swap selection for user
  const finalizeUserGhostSwap = (targetId: string) => {
    setShowPlayerPicker(false);
    setPendingSwapTarget(targetId);
    setShowColorPicker(true);
  };

  const finalizeHybrid = () => {
    setShowHybridPicker(false);
    setShowColorPicker(true);
  };

  const getDynamicSizes = () => {
    const count = players.length;
    if (count <= 4) return { avatar: 'w-12 h-12', font: 'text-[10px]', gap: 'gap-3', padding: 'p-3', outerGap: 'gap-4' };
    if (count <= 6) return { avatar: 'w-10 h-10', font: 'text-[8px]', gap: 'gap-2', padding: 'p-2', outerGap: 'gap-2' };
    if (count <= 10) return { avatar: 'w-8 h-8', font: 'text-[7px]', gap: 'gap-1.5', padding: 'p-1.5', outerGap: 'gap-1.5' };
    return { avatar: 'w-6 h-6', font: 'text-[6px]', gap: 'gap-1', padding: 'p-1', outerGap: 'gap-1' };
  };

  const sizes = getDynamicSizes();

  return (
    <div className="flex-1 flex flex-col bg-zinc-950 text-white h-screen overflow-hidden relative">
      <div className="h-1/3 p-4 flex flex-col border-b border-white/5 bg-zinc-900/50">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-black/60 p-1 rounded-full border border-white/10 backdrop-blur-sm shadow-xl">
               <button onClick={() => { setIsMicMuted(!isMicMuted); playSFX('click'); }} className={`p-1.5 rounded-full transition-all flex items-center justify-center ${isMicMuted ? 'text-red-500 bg-red-500/10' : 'text-green-400 hover:bg-green-400/10'}`}>
                  {isMicMuted ? <MicOff size={16} /> : <Mic size={16} />}
               </button>
               <button onClick={() => { setIsSpeakerMuted(!isSpeakerMuted); playSFX('click'); }} className={`p-1.5 rounded-full transition-all flex items-center justify-center ${isSpeakerMuted ? 'text-white/20' : 'text-blue-400 hover:bg-blue-400/10'}`}>
                  {isSpeakerMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
               </button>
            </div>
          </div>
          <button onClick={() => { setShowExitConfirm(true); playSFX('click'); }} className="p-2 hover:bg-red-500/20 text-red-400 rounded-full transition-colors">
            <LogOut size={18} />
          </button>
        </div>
        
        <div className={`flex-1 flex flex-wrap items-center justify-center ${sizes.outerGap} bg-black/20 rounded-3xl p-2 border border-white/5 overflow-hidden content-center`}>
          {players.map((p, idx) => (
            <div key={p.id} className={`flex flex-col items-center ${sizes.gap} ${sizes.padding} rounded-2xl transition-all border-2 relative min-w-0 ${
                idx === turnIndex ? 'border-yellow-400 bg-yellow-400/10 scale-105 shadow-[0_0_15px_rgba(250,204,21,0.2)] z-10' : 'border-transparent bg-transparent'
            } ${p.isEliminated ? 'grayscale opacity-30' : ''} ${p.isVanished ? 'opacity-20 animate-pulse' : ''}`} style={{ flexBasis: players.length > 8 ? '18%' : 'auto' }}>
              <div className="relative">
                <img src={p.avatar} className={`${sizes.avatar} rounded-full border-2 border-white/20`} alt="avatar" />
                <div className={`absolute -bottom-1 -right-1 bg-zinc-900 px-1 py-0.5 rounded-full border border-white/20 ${sizes.font} font-black`}>
                  {p.hand.length}
                </div>
                {!p.isBot && !p.isVanished && (
                  <div className={`absolute -top-1 -left-1 w-2 h-2 bg-green-500 border-2 border-zinc-900 rounded-full ${!isMicMuted ? 'animate-pulse' : ''} shadow-[0_0_5px_rgba(34,197,94,0.6)]`}></div>
                )}
              </div>
              <div className={`${sizes.font} font-bold truncate w-full text-center leading-none max-w-[50px]`}>{p.name}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="h-1/3 grid grid-cols-3 items-center px-6 relative bg-black/10">
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="relative cursor-pointer active:scale-95 transition-transform" onClick={() => isUserTurn && executeDraw(user.id)}>
            <CardUI card={{} as any} facedown size="md" className="shadow-2xl" />
          </div>
          <button onClick={() => executeDraw(user.id)} disabled={!isUserTurn} className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-white font-game text-[10px] rounded-full shadow-lg transition-all uppercase tracking-widest active:scale-95">
            Draw {stackCount > 0 ? `(${stackCount})` : ''}
          </button>
        </div>

        <div className="col-span-2 flex flex-col items-center justify-center gap-4">
          <div className="flex items-center gap-8">
            <div className={`w-3 h-24 rounded-full transition-all duration-500 ${
              currentColor === 'red' ? 'bg-red-500 shadow-[0_0_20px_red]' : 
              currentColor === 'blue' ? 'bg-blue-500 shadow-[0_0_20px_blue]' : 
              currentColor === 'green' ? 'bg-green-500 shadow-[0_0_20px_green]' : 
              'bg-yellow-400 shadow-[0_0_20px_yellow]'
            } animate-pulse`}></div>
            
            <div className="relative">
              {discardPile.slice(0, 3).map((c, i) => (
                <CardUI key={c.id} card={c} size="lg" className={`absolute transition-all duration-500 ${i === 0 ? 'z-30 scale-110' : i === 1 ? 'z-20 -translate-x-3 -rotate-12 scale-95 opacity-50' : 'z-10 translate-x-3 rotate-12 scale-90 opacity-20'}`} />
              ))}
              <div className="w-24 h-36"></div>
            </div>
          </div>
          <div className="font-game text-sm text-yellow-400 uppercase tracking-widest text-center h-6 drop-shadow-md">
            {stackCount > 0 ? `+${stackCount} STACKING` : message}
          </div>
        </div>
      </div>

      <div className="h-1/3 bg-zinc-900/90 backdrop-blur-xl p-4 flex flex-col border-t border-white/5">
        <div className="flex justify-between items-center mb-2 px-2">
            <span className="text-[10px] font-black uppercase text-white/30 tracking-widest">Your Cards</span>
            <span className="text-[10px] font-black uppercase text-yellow-400 tracking-widest">{players.find(p => p.id === user.id)?.hand.length} Cards</span>
        </div>
        <div className="w-full flex-1 overflow-x-auto flex items-center gap-2 pb-4 px-2 scrollbar-hide">
          {players.find(p => p.id === user.id)?.hand.map(card => (
            <CardUI key={card.id} card={card} onClick={() => handleUserPlay(card)} disabled={!isUserTurn || !canPlayCard(card, discardPile[0], currentColor, stackCount, isBlackChain)} className="animate-card-draw" />
          ))}
          {players.find(p => p.id === user.id)?.isEliminated && (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 opacity-50 uppercase font-game text-xl text-red-500">ELIMINATED</div>
          )}
        </div>
      </div>

      {/* Overlays */}
      {showHybridPicker && (
        <div className="absolute inset-0 z-[120] flex items-center justify-center bg-black/90 backdrop-blur-md p-6">
           <div className="bg-zinc-900 p-8 rounded-[40px] border border-white/10 text-center w-full max-w-sm shadow-2xl animate-bounce-in flex flex-col h-[70vh]">
              <div className="flex justify-center mb-4 text-white">
                <Zap size={48} className="text-yellow-400 animate-pulse" />
              </div>
              <h3 className="font-game text-2xl mb-2 text-yellow-400 tracking-tighter uppercase">Hybrid Attack</h3>
              <p className="text-[10px] opacity-40 uppercase tracking-widest mb-6">Pick 2 cards to combine effects</p>
              
              <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-3 gap-2 scrollbar-hide">
                 {players.find(p => p.id === user.id)?.hand.filter(c => c.id !== pendingCard?.id).map(card => (
                    <CardUI 
                      key={card.id} 
                      card={card} 
                      onClick={() => handleHybridSelection(card)}
                      isSelected={!!hybridSelectedCards.find(h => h.id === card.id)}
                    />
                 ))}
              </div>

              <div className="mt-6 flex flex-col gap-3">
                <div className="flex justify-center gap-2">
                   {hybridSelectedCards.map(c => (
                     <div key={c.id} className="w-8 h-12 bg-white/10 rounded-lg flex items-center justify-center border border-white/20">
                        <span className="text-[8px] font-bold">{c.value.toUpperCase()}</span>
                     </div>
                   ))}
                   {hybridSelectedCards.length === 0 && <div className="text-[10px] opacity-30 italic">None selected</div>}
                </div>
                <button 
                  disabled={hybridSelectedCards.length < 2}
                  onClick={finalizeHybrid}
                  className="w-full py-4 bg-yellow-400 text-blue-900 rounded-2xl font-game text-xl shadow-xl disabled:opacity-30 transition-all uppercase"
                >
                  Combine & Attack
                </button>
                <button onClick={() => setShowHybridPicker(false)} className="text-[10px] font-bold uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity">Cancel</button>
              </div>
           </div>
        </div>
      )}

      {showPlayerPicker && (
        <div className="absolute inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-md">
           <div className="bg-zinc-900 p-8 rounded-[40px] border border-white/10 text-center w-full max-w-sm shadow-2xl animate-bounce-in">
              <div className="flex justify-center mb-6 text-white">
                <Ghost size={48} className="animate-pulse" />
              </div>
              <h3 className="font-game text-2xl mb-2 text-yellow-400 tracking-tighter uppercase">Ghost Swap</h3>
              <p className="text-[10px] opacity-40 uppercase tracking-widest mb-8">Select a player to exchange hands with</p>
              <div className="grid grid-cols-3 gap-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
                 {players.filter(p => p.id !== user.id && !p.isEliminated).map(p => (
                    <button 
                       key={p.id}
                       onClick={() => finalizeUserGhostSwap(p.id)}
                       className="flex flex-col items-center gap-2 p-3 bg-white/5 rounded-2xl hover:bg-yellow-400/20 border border-white/5 transition-all active:scale-90"
                    >
                       <img src={p.avatar} className="w-12 h-12 rounded-full border-2 border-white/20" alt="p" />
                       <div className="text-[8px] font-bold truncate w-full text-center">{p.name}</div>
                       <div className="bg-zinc-800 px-2 py-0.5 rounded-full text-[7px] font-black">{p.hand.length} Cards</div>
                    </button>
                 ))}
              </div>
           </div>
        </div>
      )}

      {showColorPicker && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
           <div className="bg-zinc-900 p-8 rounded-[40px] border border-white/10 text-center w-full max-w-xs shadow-2xl animate-bounce-in">
              <h3 className="font-game text-2xl mb-8 text-yellow-400 tracking-tighter uppercase">Pick a Color</h3>
              <div className="grid grid-cols-2 gap-5">
                 {(['red', 'blue', 'green', 'yellow'] as CardColor[]).map(c => (
                    <button 
                       key={c}
                       onClick={() => { 
                          setShowColorPicker(false); 
                          executePlay(user.id, pendingCard!, c, { 
                            swapTarget: pendingSwapTarget || undefined, 
                            hybridCards: hybridSelectedCards.length > 0 ? hybridSelectedCards : undefined 
                          });
                          setPendingSwapTarget(null);
                          setHybridSelectedCards([]);
                       }}
                       className={`h-24 rounded-3xl border-4 border-white transition-all active:scale-95 shadow-xl ${c === 'red' ? 'bg-red-500' : c === 'blue' ? 'bg-blue-500' : c === 'green' ? 'bg-green-500' : 'bg-yellow-400'}`}
                    />
                 ))}
              </div>
           </div>
        </div>
      )}

      {showExitConfirm && (
        <div className="absolute inset-0 z-[400] flex items-center justify-center bg-black/90 p-10 backdrop-blur-md">
          <div className="bg-zinc-800 p-10 rounded-[40px] border border-red-500/30 text-center max-w-xs shadow-2xl animate-bounce-in">
            <h3 className="font-game text-3xl mb-4 text-white uppercase tracking-tighter">Exit Game?</h3>
            <p className="text-sm opacity-50 mb-10 leading-relaxed px-4">Your progress in this match will be lost.</p>
            <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setShowExitConfirm(false)} className="py-4 bg-white/5 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-white/10 transition-colors">Stay</button>
                <button onClick={onBack} className="py-4 bg-red-500 text-white rounded-2xl font-black shadow-xl uppercase text-[10px] tracking-widest shadow-red-500/30 active:scale-95 transition-all">Exit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameView;
