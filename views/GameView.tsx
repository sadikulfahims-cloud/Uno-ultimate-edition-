
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardColor, GameMode, Player, UserProfile, OnlineSubMode } from '../types';
import { createDeck, canPlayCard, shuffle, getPlusValue } from '../utils/gameLogic';
import CardUI from '../components/CardUI';
import { LogOut, Mic, MicOff, Volume2, VolumeX, Zap, AlertTriangle, Trophy, Loader2, MoveLeft, MoveRight, Ghost, ShieldAlert, Sparkles } from 'lucide-react';

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
  const [playDirection, setPlayDirection] = useState<1 | -1>(1); 
  const [currentColor, setCurrentColor] = useState<CardColor>('red');
  const [stackCount, setStackCount] = useState(0);
  const [lastPlusValue, setLastPlusValue] = useState(0); 
  const [isBlackChain, setIsBlackChain] = useState(false);
  const [message, setMessage] = useState('Game Starting...');
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  
  // Tactical Alert State (Before Chain Draw)
  const [tacticalAlert, setTacticalAlert] = useState<{
    playerId: string;
    targetColor: CardColor;
  } | null>(null);

  // Selection/Hybrid States
  const [selectionQueue, setSelectionQueue] = useState<Card[]>([]);
  const [targetQueue, setTargetQueue] = useState<Card[]>([]);
  const [ghostSwapTargets, setGhostSwapTargets] = useState<Record<string, string>>({});
  const [pendingPrimaryCard, setPendingPrimaryCard] = useState<Card | null>(null);
  const [hybridSelectedCards, setHybridSelectedCards] = useState<Card[]>([]);
  
  // Animation Tracking States
  const [lastPlayedCardId, setLastPlayedCardId] = useState<string | null>(null);
  const [newlyDrawnIds, setNewlyDrawnIds] = useState<Set<string>>(new Set());
  
  // Draw Reveal Overlay
  const [cardsDrawnOverlay, setCardsDrawnOverlay] = useState<{ cards: Card[], targetPlayerId: string, phase: 'entering' | 'display' | 'exiting' } | null>(null);

  // Chain Drawing State
  const [chainDrawing, setChainDrawing] = useState<{
    playerId: string;
    targetColor: CardColor;
    isProcessing: boolean;
    revealedCard: null | Card;
    success: boolean;
  } | null>(null);
  
  const [unoShout, setUnoShout] = useState<string | null>(null);
  const [isGameOver, setIsGameOver] = useState(false);
  
  // Ranking Counters
  const [winnerRank, setWinnerRank] = useState(1);
  const [loserRank, setLoserRank] = useState(4); // Default, updated on init

  const [isMicMuted, setIsMicMuted] = useState(true); 
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const micStreamRef = useRef<MediaStream | null>(null);

  const isUserTurn = players[turnIndex]?.id === user.id && !players[turnIndex]?.isEliminated && !players[turnIndex]?.isFinished && !isGameOver && !chainDrawing && !cardsDrawnOverlay && !tacticalAlert;

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
    setLoserRank(gamePlayers.length);
    setMessage(`${gamePlayers[0].name}'s Turn`);

    return () => {
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(track => track.stop());
        micStreamRef.current = null;
      }
    };
  }, []);

  // Chain Drawing Logic: Stops on target color OR if hand exceeds 30.
  useEffect(() => {
    if (!chainDrawing || !chainDrawing.isProcessing || chainDrawing.success || isGameOver) return;

    const timer = setTimeout(() => {
      setPlayers(currentPlayers => {
        let updated = [...currentPlayers];
        const idx = updated.findIndex(p => p.id === chainDrawing.playerId);
        if (idx === -1) return currentPlayers;

        const newDeck = [...deck];
        const drawn = newDeck.pop();
        if (!drawn) {
          setChainDrawing(null);
          return updated;
        }

        setDeck(newDeck);
        updated[idx].hand.push(drawn);
        
        // Mercy Elimination Check
        if (updated[idx].hand.length > MERCY_LIMIT) {
          playSFX('draw'); // Final elimination sound
          updated = handleElimination(updated[idx].id, updated);
          setChainDrawing(null);
          if (!checkGameOver(updated)) {
            const nextIdx = findNextActiveIndex(idx, updated, 1, playDirection);
            setTurnIndex(nextIdx);
            setMessage(`${updated[nextIdx].name}'s Turn`);
          }
          return updated;
        }

        const isMatch = drawn.color === chainDrawing.targetColor;
        
        if (isMatch) {
          playSFX('draw');
          setChainDrawing(prev => prev ? { ...prev, revealedCard: drawn, success: true } : null);
          setTimeout(() => {
            setChainDrawing(null);
            const nextIdx = findNextActiveIndex(idx, updated, 1, playDirection);
            setTurnIndex(nextIdx);
            setMessage(`${updated[nextIdx].name}'s Turn`);
          }, 1800); 
        } else {
          playSFX('draw');
        }

        return updated;
      });
    }, 800); 

    return () => clearTimeout(timer);
  }, [chainDrawing, deck, isGameOver, playDirection]);

  // Handle Bots using Vanish during Tactical Alert
  useEffect(() => {
    if (!tacticalAlert) return;
    const target = players.find(p => p.id === tacticalAlert.playerId);
    if (target?.isBot) {
      const timer = setTimeout(() => {
        const vanishCard = target.hand.find(c => c.value === 'vanishing');
        if (vanishCard) {
          handleTacticalVanish();
        } else {
          handleTacticalAccept();
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [tacticalAlert, players]);

  const handleTacticalVanish = () => {
    if (!tacticalAlert) return;
    playSFX('cardPlay');
    
    setPlayers(currentPlayers => {
      const updated = [...currentPlayers];
      const idx = updated.findIndex(p => p.id === tacticalAlert.playerId);
      if (idx === -1) return currentPlayers;

      // Remove Vanishing card
      const vIdx = updated[idx].hand.findIndex(c => c.value === 'vanishing');
      if (vIdx !== -1) updated[idx].hand.splice(vIdx, 1);
      
      updated[idx].isVanished = true;
      const nextIdx = findNextActiveIndex(idx, updated, 1, playDirection);
      
      // Pass the Tactical Alert to the next player
      setTacticalAlert({
        playerId: updated[nextIdx].id,
        targetColor: tacticalAlert.targetColor
      });

      return updated;
    });
  };

  const handleTacticalAccept = () => {
    if (!tacticalAlert) return;
    setChainDrawing({
      playerId: tacticalAlert.playerId,
      targetColor: tacticalAlert.targetColor,
      isProcessing: true,
      revealedCard: null,
      success: false
    });
    setTacticalAlert(null);
  };

  const executeDraw = (playerId: string) => {
    if (isGameOver || chainDrawing || cardsDrawnOverlay || tacticalAlert) return;
    playSFX('draw');
    
    const count = stackCount > 0 ? stackCount : 1;
    const drawnIds = new Set<string>();
    const tempDeck = [...deck];
    const cardsToReveal: Card[] = [];
    
    for(let i=0; i<count; i++) {
      const c = tempDeck.pop();
      if(c) cardsToReveal.push(c);
    }

    setCardsDrawnOverlay({ cards: cardsToReveal, targetPlayerId: playerId, phase: 'entering' });
    const revealDuration = Math.max(800, Math.min(2500, count * 350));

    setTimeout(() => {
      setCardsDrawnOverlay(prev => prev ? { ...prev, phase: 'display' } : null);
      
      setTimeout(() => {
        setCardsDrawnOverlay(prev => prev ? { ...prev, phase: 'exiting' } : null);
        
        setTimeout(() => {
          setPlayers(currentPlayers => {
            let updated = [...currentPlayers];
            const idx = updated.findIndex(p => p.id === playerId);
            if (idx === -1) return currentPlayers;
            
            const newDeck = [...deck];
            for (let i = 0; i < count; i++) {
              const c = newDeck.pop();
              if (c) {
                updated[idx].hand.push(c);
                if (playerId === user.id) drawnIds.add(c.id);
              }
            }
            setDeck(newDeck);

            if (updated[idx].hand.length > MERCY_LIMIT && subMode !== 'CLASSIC') {
              updated = handleElimination(playerId, updated);
            }

            setStackCount(0);
            setLastPlusValue(0);
            setIsBlackChain(false);
            
            if (!isGameOver) {
              const nextIdx = findNextActiveIndex(idx, updated, 1, playDirection);
              let finalNextIdx = nextIdx;
              if (updated[nextIdx].isVanished) {
                  updated[nextIdx].isVanished = false;
                  finalNextIdx = findNextActiveIndex(nextIdx, updated, 1, playDirection);
              }
              setTurnIndex(finalNextIdx);
              setMessage(`${updated[finalNextIdx].name}'s Turn`);
            }
            
            setCardsDrawnOverlay(null);
            return updated;
          });

          if (drawnIds.size > 0) {
            setNewlyDrawnIds(drawnIds);
          }
        }, 500); 
      }, revealDuration);
    }, 600); 
  };

  const executePlay = (playerId: string, card: Card, selectedColor: CardColor, ghostSwapTargetsMap: Record<string, string> = {}) => {
    if (isGameOver || chainDrawing || cardsDrawnOverlay || tacticalAlert) return;
    playSFX('cardPlay');
    setLastPlayedCardId(card.id);
    
    setPlayers(currentPlayers => {
      let updated = [...currentPlayers];
      let workingDeck = [...deck];
      let newDirection = playDirection;
      const idx = updated.findIndex(p => p.id === playerId);
      if (idx === -1) return currentPlayers;

      let skipCount = 1;
      let newStack = stackCount;
      let newLastPlusValue = lastPlusValue;
      let isAgain = false;
      let isVanishing = false;
      let finalColor = selectedColor;
      
      let shouldTriggerChainDraw = (card.value === 'wild' && card.color === 'wild' && (subMode === 'NO_MERCY' || subMode === 'SUPERIOR'));

      const applyCardAction = (c: Card) => {
        if (c.value === 'ghostswap') {
          const targetId = ghostSwapTargetsMap[c.id];
          const targetIdx = updated.findIndex(p => p.id === targetId);
          if (targetIdx !== -1) {
             const sourceHand = [...updated[idx].hand];
             const targetHand = [...updated[targetIdx].hand];
             if (c.id === card.id) {
               const playIdx = sourceHand.findIndex(sh => sh.id === c.id);
               if (playIdx !== -1) sourceHand.splice(playIdx, 1);
             }
             updated[idx].hand = targetHand;
             updated[targetIdx].hand = sourceHand;
          }
        } else if (c.value === 'allIn') {
          updated[idx].hand = updated[idx].hand.filter(ch => ch.color !== c.color);
        } else if (c.value === 'vanishing') {
          isVanishing = true;
          updated[idx].isVanished = true;
        } else if (c.value === 'again') {
          isAgain = true;
        } else if (c.value === 'reverse' || c.value === 'reverse4' || c.value === 'elitereverse') {
          newDirection = (newDirection === 1 ? -1 : 1);
          setPlayDirection(newDirection);
        } else if (c.value === 'all4') {
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
          newStack = 0;
          newLastPlusValue = 0;
          setIsBlackChain(false);
        } else if (c.value === 'skip') {
          skipCount++;
        }

        const plusPenalty = getPlusValue(c);
        if (plusPenalty > 0 && c.value !== 'allIn') {
          newStack += plusPenalty;
          newLastPlusValue = plusPenalty;
          if (c.color === 'wild') setIsBlackChain(true);
        }

        if (c.value === 'hybrid' && c.components) {
           c.components.forEach(applyCardAction);
        }
      };

      if (card.value !== 'ghostswap') {
        updated[idx].hand = updated[idx].hand.filter(c => c.id !== card.id);
      }
      
      const removeComponentsRecursive = (c: Card) => {
        if (c.components) {
          c.components.forEach(comp => {
            updated[idx].hand = updated[idx].hand.filter(h => h.id !== comp.id);
            removeComponentsRecursive(comp);
          });
        }
      };
      removeComponentsRecursive(card);

      applyCardAction(card);

      if (updated[idx].hand.length === 1) triggerUnoShout(updated[idx].name);

      if (updated[idx].hand.length === 0) {
        updated[idx].isFinished = true;
        updated[idx].rank = winnerRank;
        setWinnerRank(prev => prev + 1);
        playSFX('win');
        checkGameOver(updated);
      }

      setDiscardPile(prev => [card, ...prev]);
      setCurrentColor(isVanishing ? currentColor : finalColor);
      setDeck(workingDeck);
      setStackCount(newStack);
      setLastPlusValue(newLastPlusValue);

      if (!isGameOver) {
        if (isAgain) {
          setMessage(`${updated[idx].name.toUpperCase()} plays AGAIN!`);
        } else {
          const nextIdx = findNextActiveIndex(idx, updated, skipCount, newDirection);
          
          if (shouldTriggerChainDraw) {
            setMessage(`INCOMING CHAIN ATTACK!`);
            setTacticalAlert({
              playerId: updated[nextIdx].id,
              targetColor: finalColor
            });
          } else {
            let finalNextIdx = nextIdx;
            if (updated[nextIdx].isVanished && !isVanishing) {
                updated[nextIdx].isVanished = false;
                finalNextIdx = findNextActiveIndex(nextIdx, updated, 1, newDirection);
            }
            
            if (isVanishing) {
               setMessage(`${updated[idx].name.toUpperCase()} VANISHED! PENALTY PASSED!`);
            } else {
               setMessage(`${updated[finalNextIdx].name}'s Turn`);
            }
            setTurnIndex(finalNextIdx);
          }
        }
      }
      
      return updated;
    });
  };

  useEffect(() => {
    if (isGameOver || chainDrawing || cardsDrawnOverlay || tacticalAlert) return;
    const bot = players[turnIndex];
    if (bot?.isBot && !bot.isEliminated && !bot.isFinished) {
      const timer = setTimeout(() => {
        const playable = bot.hand.find(c => canPlayCard(c, discardPile[0], currentColor, stackCount, isBlackChain, lastPlusValue));
        if (playable) {
          const chosenColor: CardColor = (playable.color === 'wild' ? (['red', 'blue', 'green', 'yellow'] as CardColor[])[Math.floor(Math.random() * 4)] : playable.color);
          const swapTargets: Record<string, string> = {};
          
          const resolveHybrid = (c: Card, hand: Card[]) => {
            if (c.value === 'hybrid') {
              const sacrifices = hand.filter(h => h.id !== c.id && h.value !== 'hybrid').slice(0, 2);
              c.components = sacrifices.map(s => resolveHybrid({...s}, hand.filter(h => h.id !== s.id)));
            }
            if (c.value === 'ghostswap') {
              const potential = players.filter(p => p.id !== bot.id && !p.isEliminated && !p.isFinished);
              if (potential.length > 0) swapTargets[c.id] = potential[0].id;
            }
            return c;
          };

          const finalCard = resolveHybrid({...playable}, [...bot.hand]);
          executePlay(bot.id, finalCard, chosenColor, swapTargets);
        } else {
          executeDraw(bot.id);
        }
      }, 2000); 
      return () => clearTimeout(timer);
    }
  }, [turnIndex, players, discardPile, currentColor, stackCount, isBlackChain, isGameOver, chainDrawing, cardsDrawnOverlay, tacticalAlert, lastPlusValue]);

  const startDeploymentFlow = (card: Card) => {
    setPendingPrimaryCard(card);
    setSelectionQueue(card.value === 'hybrid' ? [card] : []);
    setTargetQueue(card.value === 'ghostswap' ? [card] : []);
    setGhostSwapTargets({});
    
    if (card.color === 'wild' && card.value !== 'hybrid' && card.value !== 'ghostswap' && card.value !== 'vanishing') {
       setShowColorPicker(true);
    } else if (card.value !== 'hybrid' && card.value !== 'ghostswap') {
       executePlay(user.id, card, card.value === 'vanishing' ? currentColor : card.color);
    }
  };

  const handleHybridSacrifice = (parentCard: Card, sacrifices: Card[]) => {
    const updatedParent = { ...parentCard, components: sacrifices };
    
    if (pendingPrimaryCard?.id === parentCard.id) {
       setPendingPrimaryCard(updatedParent);
    } else {
       const updateTree = (root: Card): Card => {
         if (root.components) {
            root.components = root.components.map(c => c.id === parentCard.id ? updatedParent : updateTree(c));
         }
         return root;
       };
       setPendingPrimaryCard(prev => prev ? updateTree({...prev}) : null);
    }

    const newQueue = selectionQueue.slice(1);
    sacrifices.forEach(s => { if (s.value === 'hybrid') newQueue.push(s); });
    setSelectionQueue(newQueue);

    const newTargetQueue = [...targetQueue];
    sacrifices.forEach(s => { if (s.value === 'ghostswap') newTargetQueue.push(s); });
    setTargetQueue(newTargetQueue);

    if (newQueue.length === 0 && newTargetQueue.length === 0) {
       if (updatedParent.color === 'wild') {
         if (updatedParent.value === 'vanishing') executePlay(user.id, updatedParent, currentColor);
         else setShowColorPicker(true);
       } else {
         executePlay(user.id, updatedParent, updatedParent.color);
       }
    }
  };

  const handleTargetSelection = (cardId: string, targetPlayerId: string) => {
    const updatedTargets = { ...ghostSwapTargets, [cardId]: targetPlayerId };
    setGhostSwapTargets(updatedTargets);
    
    const newTargetQueue = targetQueue.slice(1);
    setTargetQueue(newTargetQueue);

    if (selectionQueue.length === 0 && newTargetQueue.length === 0) {
       if (pendingPrimaryCard?.color === 'wild') {
         if (pendingPrimaryCard?.value === 'vanishing') executePlay(user.id, pendingPrimaryCard!, currentColor, updatedTargets);
         else setShowColorPicker(true);
       } else {
         executePlay(user.id, pendingPrimaryCard!, pendingPrimaryCard!.color, updatedTargets);
       }
    }
  };

  const handleFinalDeployment = (color: CardColor) => {
    setShowColorPicker(false);
    executePlay(user.id, pendingPrimaryCard!, color, ghostSwapTargets);
    setPendingPrimaryCard(null);
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
    
    // Assign rank from the bottom
    updatedPlayers[idx].rank = loserRank;
    setLoserRank(prev => prev - 1);

    setDeck(prev => shuffle([...prev, ...cardsToReturn]));
    return updatedPlayers;
  };

  const checkGameOver = (updatedPlayers: Player[]) => {
    const active = updatedPlayers.filter(p => !p.isEliminated && !p.isFinished);
    if (active.length <= 1) {
      if (active.length === 1) {
        const lastPlayerIdx = updatedPlayers.findIndex(p => p.id === active[0].id);
        if (lastPlayerIdx !== -1) {
          updatedPlayers[lastPlayerIdx].isFinished = true;
          // Last man standing gets the current best rank available
          updatedPlayers[lastPlayerIdx].rank = winnerRank;
        }
      }
      setIsGameOver(true);
      setMessage('Match Complete');
      return true;
    }
    return false;
  };

  const handleFinalExit = () => {
    playSFX('click');
    onGameOver(players.find(p => p.id === user.id)?.rank === 1);
  };

  const triggerUnoShout = (playerName: string) => {
    playSFX('uno');
    setUnoShout(playerName);
    setTimeout(() => setUnoShout(null), 1800);
  };

  const isSuperiorMode = subMode === 'NO_MERCY' || subMode === 'SUPERIOR';

  const scale = ((count: number) => {
    if (count <= 4) return { avatar: 'w-16 h-16', grid: 'grid-cols-2 sm:grid-cols-4', name: 'text-xs' };
    if (count <= 8) return { avatar: 'w-12 h-12', grid: 'grid-cols-4 sm:grid-cols-4', name: 'text-[10px]' };
    return { avatar: 'w-10 h-10', grid: 'grid-cols-5 sm:grid-cols-8', name: 'text-[8px]' };
  })(players.length);

  return (
    <div className="flex-1 flex flex-col bg-[#05050a] text-white h-screen overflow-hidden relative font-sans">
      
      {unoShout && (
        <div className="absolute top-0 bottom-[30vh] left-0 right-0 z-[4000] flex items-center justify-center pointer-events-none bg-black/60 backdrop-blur-md">
          <div className="relative text-center animate-bounce-in">
             <div className="text-[120px] font-game text-yellow-400 italic leading-none drop-shadow-[0_0_80px_rgba(234,179,8,1)]">UNO!</div>
             <div className="bg-white text-blue-900 px-10 py-3 rounded-full font-black text-xl shadow-2xl uppercase tracking-widest">{unoShout}</div>
          </div>
        </div>
      )}

      {/* DRAW REVEAL OVERLAY */}
      {cardsDrawnOverlay && cardsDrawnOverlay.targetPlayerId === user.id && (
        <div className="absolute top-0 bottom-[30vh] left-0 right-0 z-[5600] flex flex-col items-center justify-center pointer-events-none">
           <div className={`w-[90%] h-[62.5%] bg-black/85 backdrop-blur-3xl rounded-[40px] border border-white/10 p-10 flex flex-col items-center justify-center pointer-events-auto transition-all duration-500 
             ${cardsDrawnOverlay.phase === 'entering' ? 'animate-draw-reveal-in' : ''}
             ${cardsDrawnOverlay.phase === 'exiting' ? 'animate-draw-reveal-out' : ''}
             shadow-[0_0_80px_rgba(0,0,0,0.8)]`}>
              
              <div className="text-center mb-8">
                 <h2 className="font-game text-4xl text-yellow-400 italic uppercase tracking-widest drop-shadow-xl">ASSETS REVEALED</h2>
                 <p className="text-white/40 font-black text-[10px] uppercase tracking-[0.4em] mt-2">Drawn to your hand</p>
              </div>
              
              <div className="w-full flex flex-wrap items-center justify-center gap-4 overflow-y-auto max-h-[60%] scrollbar-hide px-4 py-2">
                 {cardsDrawnOverlay.cards.map((c, i) => (
                   <div key={`${c.id}-${i}`} className="animate-card-deploy" style={{ animationDelay: `${i * 0.12}s` }}>
                      <CardUI card={c} size="lg" className="shadow-2xl hover:scale-110 transition-transform" />
                   </div>
                 ))}
              </div>

              <div className="mt-8 flex items-center gap-4 bg-white/5 px-8 py-4 rounded-full border border-white/10 animate-pulse">
                 <div className="w-10 h-10 rounded-full border-2 border-white/20 bg-yellow-400 flex items-center justify-center text-blue-900 font-game">
                    +{cardsDrawnOverlay.cards.length}
                 </div>
                 <div className="text-left leading-none">
                    <div className="text-[10px] text-white/40 font-black uppercase mb-1">Incoming Assets</div>
                    <div className="font-bold text-white uppercase tracking-tighter">Synchronizing...</div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* TACTICAL ALERT OVERLAY (PRE-CHAIN) */}
      {tacticalAlert && (
        <div className="absolute inset-0 z-[5800] bg-black/90 backdrop-blur-3xl flex flex-col items-center justify-center p-8 text-center animate-fade-in">
           <div className="mb-10 relative">
              <div className="absolute inset-0 bg-red-500 blur-3xl opacity-20 animate-pulse" />
              <ShieldAlert size={80} className="text-red-500 mx-auto mb-6 relative z-10" />
              <h2 className="font-game text-5xl text-white italic uppercase tracking-widest drop-shadow-2xl mb-2">INCOMING CHAIN</h2>
              <p className="text-red-400 font-black text-xs uppercase tracking-[0.4em] animate-pulse">Target Locked on Frequency: {tacticalAlert.targetColor.toUpperCase()}</p>
           </div>

           <div className="bg-white/5 border border-white/10 rounded-[40px] p-8 w-full max-w-sm mb-12">
              <img src={players.find(p => p.id === tacticalAlert.playerId)?.avatar} className="w-20 h-20 rounded-full border-4 border-red-500/50 mx-auto mb-4 object-cover" />
              <div className="text-xl font-bold uppercase mb-2">{players.find(p => p.id === tacticalAlert.playerId)?.name}</div>
              <div className="text-[10px] font-black text-white/40 uppercase tracking-widest">Mercy Limit Active: 30 Cards Max</div>
           </div>

           {tacticalAlert.playerId === user.id ? (
             <div className="w-full max-w-sm space-y-4">
                {players.find(p => p.id === user.id)?.hand.some(c => c.value === 'vanishing') && (
                  <button 
                    onClick={handleTacticalVanish}
                    className="w-full py-6 bg-purple-600 text-white font-game text-xl rounded-[30px] shadow-[0_0_40px_rgba(147,51,234,0.4)] flex items-center justify-center gap-4 border-b-8 border-purple-800 active:scale-95 transition-all"
                  >
                    <Sparkles size={24} /> USE VANISHING CARD
                  </button>
                )}
                <button 
                  onClick={handleTacticalAccept}
                  className="w-full py-6 bg-white text-black font-game text-xl rounded-[30px] border-b-8 border-zinc-300 active:scale-95 transition-all"
                >
                  ACCEPT PENALTY
                </button>
             </div>
           ) : (
             <div className="flex flex-col items-center gap-4">
                <Loader2 size={32} className="animate-spin text-white/40" />
                <div className="text-[10px] font-black uppercase tracking-widest text-white/20 animate-pulse">Waiting for target tactical response...</div>
             </div>
           )}
        </div>
      )}

      {/* CHAIN DRAW OVERLAY */}
      {chainDrawing && (
        <div className="absolute inset-0 z-[5500] bg-black/80 backdrop-blur-3xl flex flex-col items-center justify-center animate-fade-in">
           <div className="text-center mb-10">
              <div className="flex items-center justify-center gap-4 mb-2">
                 <Loader2 size={32} className={`animate-spin ${chainDrawing.success ? 'text-green-500' : 'text-red-500'}`} />
                 <h2 className={`font-game text-5xl italic uppercase tracking-widest drop-shadow-[0_0_20px_rgba(0,0,0,0.5)] ${chainDrawing.success ? 'text-green-500' : 'text-red-500'}`}>
                    {chainDrawing.success ? 'TARGET ACQUIRED' : 'CHAIN DRAW'}
                 </h2>
              </div>
              <p className="text-white/60 font-black text-xs uppercase tracking-[0.3em]">
                 {chainDrawing.success ? 'Lock established on frequency' : `Drawing until ${chainDrawing.targetColor.toUpperCase()} appears (Wilds ignored)`}
              </p>
           </div>
           
           <div className="relative w-48 h-64 flex items-center justify-center">
              {chainDrawing.revealedCard ? (
                <div key={chainDrawing.revealedCard.id} className="animate-card-deploy">
                   <CardUI card={chainDrawing.revealedCard} size="lg" className="shadow-[0_0_50px_rgba(255,255,255,0.2)]" />
                </div>
              ) : (
                <div className="animate-pulse flex flex-col items-center">
                   <CardUI card={{} as any} facedown size="lg" className="opacity-40" />
                   <div className="mt-4 text-[10px] font-black uppercase text-white/20">Scanning Stack...</div>
                </div>
              )}
           </div>

           <div className="mt-12 flex items-center gap-6 bg-white/5 px-10 py-6 rounded-full border border-white/10">
              <div className="relative">
                <img src={players.find(p => p.id === chainDrawing.playerId)?.avatar} className="w-14 h-14 rounded-full border-2 border-white/20 object-cover" />
                <div className="absolute -bottom-2 -right-2 bg-zinc-900 border border-white/20 px-3 py-1 rounded-full text-[12px] font-black text-red-400">
                  {players.find(p => p.id === chainDrawing.playerId)?.hand.length} / 30
                </div>
              </div>
              <div className="text-left leading-none">
                 <div className="text-[10px] text-white/40 font-black uppercase mb-1">Target Player</div>
                 <div className="font-bold text-white text-lg">{players.find(p => p.id === chainDrawing.playerId)?.name}</div>
              </div>
           </div>
        </div>
      )}

      {/* Profiles Area */}
      <div className="h-[30vh] p-4 bg-white/5 backdrop-blur-md border-b border-white/10 z-50 flex flex-col">
        <div className="flex justify-between items-center mb-2 px-2">
           <div className="flex gap-2">
              <button onClick={() => setIsMicMuted(!isMicMuted)} className={`p-1.5 rounded-full ${isMicMuted ? 'text-red-500 bg-red-500/10' : 'text-green-500 bg-green-500/10'}`}>
                {isMicMuted ? <MicOff size={14} /> : <Mic size={14} />}
              </button>
              <button onClick={() => setIsSpeakerMuted(!isSpeakerMuted)} className="p-1.5 bg-white/10 rounded-full text-white/60">
                {isSpeakerMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </button>
           </div>
           <div className="bg-yellow-400/20 px-4 py-0.5 rounded-full border border-yellow-400/30 flex items-center gap-2">
              {playDirection === 1 ? <MoveRight size={14} className="text-yellow-400" /> : <MoveLeft size={14} className="text-yellow-400" />}
              <span className="text-[9px] font-black text-yellow-400 uppercase">{subMode}</span>
           </div>
           <button onClick={() => setShowExitConfirm(true)} className="p-1.5 text-white/40 hover:text-red-500"><LogOut size={16} /></button>
        </div>
        <div className={`flex-1 grid gap-2 items-center justify-items-center ${scale.grid}`}>
          {players.map((p, idx) => (
            <div key={p.id} className={`flex flex-col items-center gap-1 transition-all ${turnIndex === idx && !isGameOver ? 'scale-110' : 'scale-90 opacity-60'}`}>
               <div className="relative">
                  <div className={`absolute -inset-1 rounded-full blur-md ${turnIndex === idx && !isGameOver ? 'bg-yellow-400 opacity-40' : 'opacity-0'}`} />
                  <img src={p.avatar} className={`${scale.avatar} rounded-full border-2 object-cover ${p.isVanished ? 'opacity-20 animate-vanish-pulse grayscale' : 'border-white/20'} ${turnIndex === idx && !isGameOver ? 'border-yellow-400 shadow-lg' : ''}`} />
                  <div className={`absolute -bottom-1 -right-1 bg-zinc-900 border border-white/20 rounded-full px-1.5 py-0.5 text-[8px] font-black ${p.hand.length >= 25 ? 'text-red-500 animate-pulse' : ''}`}>{p.isFinished ? `Rank ${p.rank}` : p.hand.length}</div>
                  {p.isEliminated && <div className="absolute inset-0 bg-black/80 rounded-full flex items-center justify-center text-red-500 font-black text-[10px]">Rank {p.rank}</div>}
                  {p.isVanished && <div className="absolute inset-0 bg-purple-900/40 rounded-full flex items-center justify-center text-purple-400 animate-pulse"><Ghost size={scale.avatar.includes('w-16') ? 24 : 16} /></div>}
               </div>
               <span className={`${scale.name} font-bold uppercase truncate w-16 text-center`}>{p.id === user.id ? 'ME' : p.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Arena Area */}
      <div className="h-[40vh] relative grid grid-cols-3 w-full items-center px-6 overflow-hidden">
        <div className={`w-64 h-64 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 blur-[120px] opacity-20 ${
          currentColor === 'red' ? 'bg-red-600' : currentColor === 'blue' ? 'bg-blue-600' : currentColor === 'green' ? 'bg-green-600' : 'bg-yellow-400'
        }`}></div>
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="relative group cursor-pointer active:scale-90" onClick={() => isUserTurn && executeDraw(user.id)}>
             <CardUI card={{} as any} facedown size="md" className="shadow-2xl relative z-10" />
          </div>
          <span className="text-[8px] font-black text-white/30 uppercase">Central Stack</span>
        </div>
        <div className="col-span-2 flex flex-col items-center justify-center pl-8">
          <div className="relative w-32 h-32 flex items-center justify-center">
            {discardPile.slice(0, 4).map((c, i) => (
              <CardUI 
                key={c.id} 
                card={c} 
                size="lg" 
                className={`absolute transition-all ${
                  i === 0 ? `z-30 scale-110 ${lastPlayedCardId === c.id ? 'animate-card-deploy' : ''}` : 
                  i === 1 ? 'z-20 -translate-x-6 -rotate-12 opacity-50 scale-100' : 
                  'opacity-0 scale-90'
                }`} 
              />
            ))}
          </div>
          <div className="mt-14 text-center">
             <div className="font-game text-3xl text-white tracking-widest">{stackCount > 0 ? `+${stackCount} STACKING` : message.toUpperCase()}</div>
             <div className="flex items-center justify-center gap-3 mt-2">
                <span className={`text-[12px] font-black uppercase px-3 py-0.5 rounded-full border ${
                  currentColor === 'red' ? 'text-red-500 border-red-500/30' : 
                  currentColor === 'blue' ? 'text-blue-500 border-blue-500/30' : 
                  currentColor === 'green' ? 'text-green-500 border-green-500/30' : 
                  'text-yellow-400 border-yellow-400/30'
                }`}>{currentColor}</span>
             </div>
          </div>
        </div>
      </div>

      {/* Hand Area */}
      <div className="h-[30vh] bg-white/[0.02] border-t border-white/5 p-4 backdrop-blur-3xl relative z-[4500] overflow-hidden">
        <div className="flex gap-3 overflow-x-auto pb-8 scrollbar-hide px-2 items-end min-h-[160px]">
          {players.find(p => p.id === user.id)?.hand.map((card) => {
            const playable = isUserTurn && canPlayCard(card, discardPile[0], currentColor, stackCount, isBlackChain, lastPlusValue);
            const isNew = newlyDrawnIds.has(card.id);
            return (
              <CardUI 
                key={card.id} 
                card={card} 
                onClick={() => playable && startDeploymentFlow(card)} 
                disabled={!playable} 
                isPlayable={playable} 
                className={`hover:-translate-y-2 transition-all ${isNew ? 'animate-card-draw' : ''}`} 
              />
            );
          })}
        </div>
      </div>

      {/* FUSION SELECTION */}
      {selectionQueue.length > 0 && (
        <div className="absolute top-0 bottom-[30vh] left-0 right-0 z-[5000] flex items-center justify-center bg-black/95 p-8 backdrop-blur-2xl">
           <div className="bg-zinc-900 border border-white/10 p-8 rounded-[40px] w-full max-sm shadow-2xl text-center">
              <h3 className="font-game text-2xl text-yellow-400 mb-2 uppercase tracking-widest">FUSE COMPONENTS</h3>
              <p className="text-[10px] font-bold text-white/40 uppercase mb-8">Sacrifice 2 items for {selectionQueue[0].value.toUpperCase()}</p>
              <div className="grid grid-cols-4 gap-2 mb-8 h-32 overflow-y-auto pr-1 scrollbar-hide">
                {players.find(p => p.id === user.id)?.hand
                  .filter(c => c.id !== pendingPrimaryCard?.id && c.value !== 'hybrid')
                  .map(c => {
                    const isSelected = hybridSelectedCards.some(s => s.id === c.id);
                    return (
                      <div key={c.id} onClick={() => {
                          if (isSelected) setHybridSelectedCards(prev => prev.filter(s => s.id !== c.id));
                          else if (hybridSelectedCards.length < 2) setHybridSelectedCards(prev => [...prev, c]);
                        }} className={`cursor-pointer transition-all ${isSelected ? 'scale-105 opacity-100' : 'opacity-40'}`}>
                         <CardUI card={c} size="sm" isSelected={isSelected} />
                      </div>
                    );
                  })}
              </div>
              <div className="flex gap-4">
                 <button onClick={() => { setSelectionQueue([]); setHybridSelectedCards([]); setPendingPrimaryCard(null); }} className="flex-1 py-4 bg-white/5 rounded-2xl font-black text-[10px] uppercase">Abort</button>
                 <button disabled={hybridSelectedCards.length !== 2} onClick={() => { handleHybridSacrifice(selectionQueue[0], [...hybridSelectedCards]); setHybridSelectedCards([]); }} className="flex-1 py-4 bg-yellow-400 text-blue-900 rounded-2xl font-black text-[10px] uppercase disabled:opacity-20">Confirm Fusion</button>
              </div>
           </div>
        </div>
      )}

      {/* COLOR PICKER */}
      {showColorPicker && (
        <div className="absolute top-0 bottom-[30vh] left-0 right-0 z-[5200] flex items-center justify-center bg-black/95 backdrop-blur-3xl animate-fade-in text-center">
           <div className={`p-1 flex flex-col items-center transition-all ${isSuperiorMode ? 'w-full max-w-sm' : 'max-w-xs'}`}>
              <div className="mb-12">
                 <h3 className={`font-game mb-2 uppercase italic tracking-tighter ${isSuperiorMode ? 'text-5xl text-yellow-400' : 'text-3xl text-white'}`}>
                   {isSuperiorMode ? 'TARGET FREQUENCY' : 'CHOOSE SPECTRUM'}
                 </h3>
                 {isSuperiorMode && <p className="text-white/40 font-black text-[10px] uppercase tracking-[0.4em]">Chain Draw protocol active for target</p>}
              </div>
              
              <div className="grid grid-cols-2 gap-5 w-full">
                 {(['red', 'blue', 'green', 'yellow'] as CardColor[]).map(c => (
                    <button 
                      key={c} 
                      onClick={() => handleFinalDeployment(c)} 
                      className={`relative group h-32 rounded-[40px] transition-all active:scale-95 shadow-2xl border-4 overflow-hidden ${
                          c === 'red' ? 'bg-red-600 border-red-500/30 hover:border-red-400' : 
                          c === 'blue' ? 'bg-blue-600 border-blue-500/30 hover:border-blue-400' : 
                          c === 'green' ? 'bg-green-600 border-green-500/30 hover:border-green-400' : 
                          'bg-yellow-500 border-yellow-400/30 hover:border-yellow-300'
                      }`}
                    >
                       <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-sm">
                          <Zap size={24} className="text-white mb-2 animate-pulse" />
                          <span className="font-game text-white text-sm tracking-widest">{c.toUpperCase()}</span>
                       </div>
                       <div className="absolute top-4 left-4 text-[10px] font-black text-white/40 uppercase tracking-widest">Deploy</div>
                    </button>
                 ))}
              </div>
           </div>
        </div>
      )}

      {/* GAME OVER */}
      {isGameOver && (
        <div className="absolute inset-0 z-[6000] bg-black/95 flex flex-col items-center justify-center p-8 backdrop-blur-3xl animate-fade-in text-center">
           <Trophy size={60} className="text-yellow-400 mb-4 animate-bounce mx-auto" />
           <h2 className="font-game text-5xl text-white mb-8 italic uppercase tracking-tighter">BATTLE REPORT</h2>
           <div className="w-full max-w-sm space-y-3 mb-10 overflow-y-auto max-h-[50vh] scrollbar-hide">
              {players.sort((a, b) => (a.rank || 99) - (b.rank || 99)).map((p, i) => (
                 <div key={p.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                       <img src={p.avatar} className="w-12 h-12 rounded-full border-2 border-white/20 object-cover" />
                       <div className="font-bold text-sm uppercase">{p.name}</div>
                    </div>
                    <div className="font-game text-2xl text-yellow-400">#{p.rank || players.length}</div>
                 </div>
              ))}
           </div>
           <button onClick={handleFinalExit} className="w-full py-6 bg-yellow-400 text-blue-900 font-game text-2xl rounded-[30px] shadow-3xl uppercase">EXIT TO HUB</button>
        </div>
      )}

      {/* EXIT CONFIRMATION */}
      {showExitConfirm && (
        <div className="absolute top-0 bottom-[30vh] left-0 right-0 z-[2000] flex items-center justify-center bg-black/98 p-10 backdrop-blur-3xl text-center">
          <div className="bg-zinc-900 p-12 rounded-[60px] border border-red-500/20 max-w-xs animate-bounce-in">
            <h3 className="font-game text-4xl mb-6 text-white uppercase italic">ABORT?</h3>
            <div className="flex flex-col gap-4">
                <button onClick={onBack} className="py-6 bg-red-600 text-white rounded-[30px] font-black uppercase text-xs tracking-widest">Confirm Quit</button>
                <button onClick={() => setShowExitConfirm(false)} className="py-6 bg-white/5 rounded-[30px] font-black uppercase text-xs text-white/30 tracking-widest">Continue</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default GameView;
