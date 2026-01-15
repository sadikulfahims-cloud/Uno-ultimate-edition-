
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardColor, GameMode, Player, UserProfile, OnlineSubMode } from '../types';
import { createDeck, canPlayCard, shuffle } from '../utils/gameLogic';
import CardUI from '../components/CardUI';
import { LogOut, Mic, MicOff, Volume2, VolumeX, Ghost, Zap, AlertTriangle, Eye, X } from 'lucide-react';

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
  const [pendingSwapTarget, setPendingSwapTarget] = useState<string | null>(null);
  const [eliminatedMessage, setEliminatedMessage] = useState<string | null>(null);

  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);

  const playersRef = useRef<Player[]>([]);
  useEffect(() => { playersRef.current = players; }, [players]);

  const isUserTurn = players[turnIndex]?.id === user.id && !players[turnIndex]?.isEliminated;
  const isUserEliminated = players.find(p => p.id === user.id)?.isEliminated;

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
      const playerCount = Math.floor(Math.random() * 5) + 3; 
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

    const handSize = rules?.initialCards || 7;
    gamePlayers.forEach(p => {
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
  }, []);

  // Reshuffle Deck
  useEffect(() => {
    if (deck.length < 5 && discardPile.length > 5) {
      const top = discardPile[0];
      const rest = discardPile.slice(1);
      setDeck(shuffle(rest));
      setDiscardPile([top]);
      setMessage("Deck Reshuffled!");
    }
  }, [deck.length, discardPile.length]);

  const findNextActiveIndex = (currentIdx: number, playersList: Player[], skipCount = 1) => {
    let next = currentIdx;
    for (let i = 0; i < skipCount; i++) {
      next = (next + 1) % playersList.length;
      let limit = playersList.length;
      
      // Skip eliminated
      while (playersList[next].isEliminated && limit > 0) {
        next = (next + 1) % playersList.length;
        limit--;
      }

      // Handle Vanishing: If vanished, skip them for this round and clear the status
      if (playersList[next].isVanished) {
        playersList[next].isVanished = false; // Reset for next cycle
        next = (next + 1) % playersList.length;
        while (playersList[next].isEliminated) {
          next = (next + 1) % playersList.length;
        }
      }
    }
    return next;
  };

  const handleElimination = useCallback((playerId: string, updatedPlayers: Player[]) => {
    const idx = updatedPlayers.findIndex(p => p.id === playerId);
    if (idx === -1) return updatedPlayers;

    const cardsToReturn = [...updatedPlayers[idx].hand];
    updatedPlayers[idx].isEliminated = true;
    updatedPlayers[idx].hand = [];
    setDeck(prev => shuffle([...prev, ...cardsToReturn]));

    if (playerId === user.id) {
      setEliminatedMessage("Out of Mercy! Hand reached 30 cards.");
    } else {
      setMessage(`${updatedPlayers[idx].name} eliminated!`);
    }

    const active = updatedPlayers.filter(p => !p.isEliminated);
    if (active.length === 1) {
      onGameOver(active[0].id === user.id);
    }

    return updatedPlayers;
  }, [user.id, onGameOver]);

  const executeDraw = useCallback((playerId: string) => {
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

      if (updated[idx].hand.length > MERCY_LIMIT && (subMode === 'NO_MERCY' || subMode === 'SUPERIOR')) {
        updated = handleElimination(playerId, updated);
      }

      setStackCount(0);
      setIsBlackChain(false);
      
      const nextIdx = findNextActiveIndex(idx, updated);
      setTurnIndex(nextIdx);
      setMessage(`${updated[nextIdx].name}'s Turn`);
      return updated;
    });
  }, [deck, stackCount, subMode, handleElimination, playSFX]);

  const executePlay = useCallback((playerId: string, card: Card, selectedColor: CardColor, extras?: { swapTarget?: string, hybridCards?: Card[] }) => {
    playSFX('cardPlay');
    
    setPlayers(currentPlayers => {
      let updated = [...currentPlayers];
      const idx = updated.findIndex(p => p.id === playerId);
      if (idx === -1) return currentPlayers;

      // Special Logic: Vanishing
      if (card.value === 'vanishing') {
        updated[idx].isVanished = true;
        setMessage(`${updated[idx].name} vanished! State preserved.`);
      }

      // Special Logic: Ghost Swap
      if (card.value === 'ghostswap' && extras?.swapTarget) {
        const targetIdx = updated.findIndex(p => p.id === extras.swapTarget);
        if (targetIdx !== -1) {
          const sourceHand = updated[idx].hand.filter(c => c.id !== card.id);
          const targetHand = [...updated[targetIdx].hand];
          updated[idx].hand = targetHand;
          updated[targetIdx].hand = sourceHand;
          setMessage(`Swapped hands with ${updated[targetIdx].name}!`);
        }
      }

      // Remove card
      updated[idx].hand = updated[idx].hand.filter(c => c.id !== card.id);
      if (extras?.hybridCards) {
        const hIds = extras.hybridCards.map(h => h.id);
        updated[idx].hand = updated[idx].hand.filter(c => !hIds.includes(c.id));
      }

      if (updated[idx].hand.length === 1) playSFX('uno');
      if (updated[idx].hand.length === 0) {
        onGameOver(playerId === user.id);
        return updated;
      }

      setDiscardPile(prev => [card, ...prev]);
      setCurrentColor(selectedColor);

      // Effects
      let skipCount = 1;
      let newStack = stackCount;
      const applyEffect = (c: Card) => {
        const plus: Record<string, number> = { 'draw2': 2, 'draw4': 4, 'reverse4': 4, 'draw6': 6, 'draw10': 10, 'all4': 4 };
        if (c.value in plus) {
          newStack += plus[c.value];
          if (c.color === 'wild' && c.value !== 'wild') setIsBlackChain(true);
        }
        if (c.value === 'skip') skipCount++;
      };
      
      applyEffect(card);
      extras?.hybridCards?.forEach(applyEffect);
      setStackCount(newStack);

      const nextIdx = findNextActiveIndex(idx, updated, skipCount);
      setTurnIndex(nextIdx);
      setMessage(`${updated[nextIdx].name}'s Turn`);
      
      return updated;
    });
  }, [stackCount, user.id, onGameOver, playSFX]);

  // Bot Logic
  useEffect(() => {
    const bot = players[turnIndex];
    if (bot?.isBot && !bot.isEliminated) {
      const timer = setTimeout(() => {
        const playable = bot.hand.find(c => canPlayCard(c, discardPile[0], currentColor, stackCount, isBlackChain));
        if (playable) {
          let color: CardColor = currentColor;
          let extras: any = {};
          
          if (playable.value === 'ghostswap') {
            const targets = players.filter(p => p.id !== bot.id && !p.isEliminated);
            if (targets.length > 0) extras.swapTarget = targets[Math.floor(Math.random() * targets.length)].id;
          } else if (playable.value === 'vanishing') {
            // Use currentColor
          } else if (playable.color === 'wild') {
            color = (['red', 'blue', 'green', 'yellow'] as CardColor[])[Math.floor(Math.random() * 4)];
          } else {
            color = playable.color;
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
  }, [turnIndex, players, discardPile, currentColor, stackCount, isBlackChain, executePlay, executeDraw]);

  const handleUserPlay = (card: Card) => {
    if (!isUserTurn) return;
    if (!canPlayCard(card, discardPile[0], currentColor, stackCount, isBlackChain)) return;
    
    setPendingCard(card);
    setPendingSwapTarget(null);

    // Vanishing: No color picker, keeps current state
    if (card.value === 'vanishing') {
      executePlay(user.id, card, currentColor);
    } 
    // Ghost Swap: No color picker after player selection, keeps current color
    else if (card.value === 'ghostswap') {
      setShowPlayerPicker(true);
    }
    else if (card.value === 'hybrid') {
      setShowHybridPicker(true);
      setHybridSelectedCards([]);
    }
    else if (card.color === 'wild') {
      setShowColorPicker(true);
    }
    else {
      executePlay(user.id, card, card.color);
    }
  };

  const getDynamicSizes = () => {
    const count = players.length;
    if (count <= 4) return { avatar: 'w-12 h-12', font: 'text-[10px]', gap: 'gap-3', padding: 'p-3', outerGap: 'gap-4' };
    if (count <= 6) return { avatar: 'w-10 h-10', font: 'text-[8px]', gap: 'gap-2', padding: 'p-2', outerGap: 'gap-2' };
    return { avatar: 'w-8 h-8', font: 'text-[7px]', gap: 'gap-1.5', padding: 'p-1.5', outerGap: 'gap-1.5' };
  };

  const sizes = getDynamicSizes();

  return (
    <div className="flex-1 flex flex-col bg-zinc-950 text-white h-screen overflow-hidden relative">
      <div className="h-1/3 p-4 flex flex-col border-b border-white/5 bg-zinc-900/50">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-black/60 p-1 rounded-full border border-white/10 backdrop-blur-sm shadow-xl">
               <button onClick={() => setIsMicMuted(!isMicMuted)} className={`p-1.5 rounded-full ${isMicMuted ? 'text-red-500 bg-red-500/10' : 'text-green-400'}`}>
                  {isMicMuted ? <MicOff size={16} /> : <Mic size={16} />}
               </button>
               <button onClick={() => setIsSpeakerMuted(!isSpeakerMuted)} className={`p-1.5 rounded-full ${isSpeakerMuted ? 'text-white/20' : 'text-blue-400'}`}>
                  {isSpeakerMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
               </button>
            </div>
            {isUserEliminated && (
                <div className="flex items-center gap-2 bg-yellow-400/20 px-3 py-1 rounded-full border border-yellow-400/30">
                    <Eye size={14} className="text-yellow-400" />
                    <span className="text-[10px] font-black uppercase tracking-tighter text-yellow-400">Specatating</span>
                </div>
            )}
          </div>
          <button onClick={() => setShowExitConfirm(true)} className="p-2 hover:bg-red-500/20 text-red-400 rounded-full">
            <LogOut size={18} />
          </button>
        </div>
        
        <div className={`flex-1 flex flex-wrap items-center justify-center ${sizes.outerGap} bg-black/20 rounded-3xl p-2 border border-white/5 overflow-hidden content-center`}>
          {players.map((p, idx) => (
            <div key={p.id} className={`flex flex-col items-center ${sizes.gap} ${sizes.padding} rounded-2xl transition-all border-2 relative min-w-0 ${
                idx === turnIndex ? 'border-yellow-400 bg-yellow-400/10 scale-105 shadow-[0_0_15px_rgba(250,204,21,0.2)] z-10' : 'border-transparent bg-transparent'
            } ${p.isEliminated ? 'grayscale opacity-30 blur-[0.5px]' : ''} ${p.isVanished ? 'opacity-20 animate-pulse' : ''}`} style={{ flexBasis: players.length > 6 ? '20%' : 'auto' }}>
              <div className="relative">
                <img src={p.avatar} className={`${sizes.avatar} rounded-full border-2 border-white/20`} alt="avatar" />
                {!p.isEliminated && (
                  <div className={`absolute -bottom-1 -right-1 bg-zinc-900 px-1 py-0.5 rounded-full border border-white/20 ${sizes.font} font-black`}>
                    {p.hand.length}
                  </div>
                )}
                {p.isEliminated && (
                    <div className="absolute inset-0 flex items-center justify-center text-red-500">
                        <X size={20} />
                    </div>
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

      <div className="h-1/3 bg-zinc-900/90 backdrop-blur-xl p-4 flex flex-col border-t border-white/5 relative">
        {!isUserEliminated ? (
            <>
                <div className="flex justify-between items-center mb-2 px-2">
                    <span className="text-[10px] font-black uppercase text-white/30 tracking-widest">Your Cards</span>
                </div>
                <div className="w-full flex-1 overflow-x-auto flex items-center gap-2 pb-4 px-2 scrollbar-hide">
                {players.find(p => p.id === user.id)?.hand.map(card => (
                    <CardUI key={card.id} card={card} onClick={() => handleUserPlay(card)} disabled={!isUserTurn || !canPlayCard(card, discardPile[0], currentColor, stackCount, isBlackChain)} className="animate-card-draw" />
                ))}
                </div>
            </>
        ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-6">
                <AlertTriangle size={48} className="text-red-500 animate-pulse" />
                <div>
                    <h3 className="font-game text-2xl text-red-500 uppercase tracking-tighter">ELIMINATED</h3>
                    <p className="text-xs opacity-40 uppercase tracking-widest mt-1">Watching match as spectator...</p>
                </div>
            </div>
        )}
      </div>

      {eliminatedMessage && (
        <div className="absolute inset-0 z-[500] flex items-center justify-center bg-black/95 backdrop-blur-xl p-10">
            <div className="bg-red-600/10 p-10 rounded-[40px] border border-red-600/30 text-center max-w-sm shadow-2xl animate-bounce-in">
                <h3 className="font-game text-4xl mb-4 text-white uppercase tracking-tighter">GAME OVER</h3>
                <p className="text-sm opacity-70 mb-10 text-red-100 font-bold">{eliminatedMessage}</p>
                <button onClick={() => setEliminatedMessage(null)} className="w-full py-5 bg-white text-red-600 font-game text-xl rounded-3xl shadow-xl uppercase">INSPECT MATCH</button>
            </div>
        </div>
      )}

      {showPlayerPicker && (
        <div className="absolute inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-md">
           <div className="bg-zinc-900 p-8 rounded-[40px] border border-white/10 text-center w-full max-w-sm shadow-2xl animate-bounce-in">
              <h3 className="font-game text-2xl mb-8 text-yellow-400 uppercase tracking-tighter">GHOST SWAP</h3>
              <div className="grid grid-cols-3 gap-4">
                 {players.filter(p => p.id !== user.id && !p.isEliminated).map(p => (
                    <button key={p.id} onClick={() => { setShowPlayerPicker(false); executePlay(user.id, pendingCard!, currentColor, { swapTarget: p.id }); }} className="flex flex-col items-center gap-2 p-3 bg-white/5 rounded-2xl border border-white/5">
                       <img src={p.avatar} className="w-12 h-12 rounded-full border-2 border-white/20" alt="p" />
                       <div className="text-[8px] font-bold truncate w-full">{p.name}</div>
                    </button>
                 ))}
              </div>
           </div>
        </div>
      )}

      {showColorPicker && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
           <div className="bg-zinc-900 p-8 rounded-[40px] border border-white/10 text-center w-full max-w-xs shadow-2xl animate-bounce-in">
              <h3 className="font-game text-2xl mb-8 text-yellow-400 uppercase tracking-tighter">PICK COLOR</h3>
              <div className="grid grid-cols-2 gap-5">
                 {(['red', 'blue', 'green', 'yellow'] as CardColor[]).map(c => (
                    <button key={c} onClick={() => { setShowColorPicker(false); executePlay(user.id, pendingCard!, c, { hybridCards: hybridSelectedCards.length > 0 ? hybridSelectedCards : undefined }); }} className={`h-24 rounded-3xl border-4 border-white shadow-xl ${c === 'red' ? 'bg-red-500' : c === 'blue' ? 'bg-blue-500' : c === 'green' ? 'bg-green-500' : 'bg-yellow-400'}`} />
                 ))}
              </div>
           </div>
        </div>
      )}

      {showExitConfirm && (
        <div className="absolute inset-0 z-[400] flex items-center justify-center bg-black/90 p-10 backdrop-blur-md">
          <div className="bg-zinc-800 p-10 rounded-[40px] border border-red-500/30 text-center max-w-xs shadow-2xl animate-bounce-in">
            <h3 className="font-game text-3xl mb-4 text-white uppercase tracking-tighter">Exit Match?</h3>
            <p className="text-sm opacity-50 mb-10 leading-relaxed">You'll lose your current progress.</p>
            <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setShowExitConfirm(false)} className="py-4 bg-white/5 rounded-2xl font-black uppercase text-[10px]">STAY</button>
                <button onClick={onBack} className="py-4 bg-red-500 text-white rounded-2xl font-black uppercase text-[10px]">EXIT</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameView;
