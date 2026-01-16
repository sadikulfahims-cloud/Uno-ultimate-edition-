
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { UserProfile, GameSettings, GameMode, Card, Player, OnlineSubMode, GameRules, Lobby } from './types';
import { INITIAL_USER_ID, AVATARS, SOUNDS } from './constants';
import HomeView from './views/HomeView';
import GameView from './views/GameView';
import ProfileView from './views/ProfileView';
import SettingsView from './views/SettingsView';
import MailboxView from './views/MailboxView';
import AddFriendView from './views/AddFriendView';
import OnlineSetupView from './views/OnlineSetupView';
import LobbyView from './views/LobbyView';
import OfflineSetupView from './views/OfflineSetupView';
import OfflineJoinView from './views/OfflineJoinView';
import OnlineJoinView from './views/OnlineJoinView';
import SplashView from './views/SplashView';
import NotificationToast from './components/NotificationToast';

const App: React.FC = () => {
  const [isInitializing, setIsInitializing] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [view, setView] = useState<'home' | 'game' | 'profile' | 'settings' | 'mailbox' | 'addFriend' | 'onlineSetup' | 'lobby' | 'offlineModeSelect' | 'offlineSetup' | 'offlineJoin' | 'onlineJoin'>('home');
  
  const [user, setUser] = useState<UserProfile>({
    id: INITIAL_USER_ID,
    name: 'Player One',
    avatar: AVATARS[0],
    wins: 12,
    losses: 5,
    friends: ['UID-999-BOT', 'UID-777-KIM', 'UID-555-JOE'],
    requests: []
  });

  const [settings, setSettings] = useState<GameSettings>({
    theme: 'classic',
    sfx: true,
    music: true
  });

  const [gameMode, setGameMode] = useState<GameMode>('OFFLINE');
  const [subMode, setSubMode] = useState<OnlineSubMode>('CLASSIC');
  const [currentLobby, setCurrentLobby] = useState<Lobby | null>(null);
  const [notification, setNotification] = useState<{message: string, type: 'invite', lobbyId: string} | null>(null);

  const bgMusicRef = useRef<HTMLAudioElement | null>(null);
  const clickAudioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize Audio Objects Once
  useEffect(() => {
    // Background Music
    const musicUrl = 'https://assets.mixkit.co/music/preview/mixkit-sun-and-clouds-585.mp3';
    bgMusicRef.current = new Audio(musicUrl);
    bgMusicRef.current.loop = true;
    bgMusicRef.current.volume = 0.3;

    // Pre-load common click SFX
    clickAudioRef.current = new Audio(SOUNDS.click);
    clickAudioRef.current.load();

    return () => {
      if (bgMusicRef.current) {
        bgMusicRef.current.pause();
        bgMusicRef.current = null;
      }
    };
  }, []);

  // Audio Unlocking & Background Music Management
  useEffect(() => {
    const handleGesture = () => {
      if (!hasInteracted) {
        setHasInteracted(true);
        // Start background music if allowed and splash is done
        if (settings.music && !isInitializing && bgMusicRef.current) {
          bgMusicRef.current.play().catch(() => {});
        }
      }
    };

    window.addEventListener('click', handleGesture);
    window.addEventListener('touchstart', handleGesture);

    return () => {
      window.removeEventListener('click', handleGesture);
      window.removeEventListener('touchstart', handleGesture);
    };
  }, [hasInteracted, settings.music, isInitializing]);

  // Handle music toggle in settings
  useEffect(() => {
    if (!bgMusicRef.current) return;
    if (settings.music && hasInteracted && !isInitializing) {
      bgMusicRef.current.play().catch(() => {});
    } else {
      bgMusicRef.current.pause();
    }
  }, [settings.music, hasInteracted, isInitializing]);

  const playSFX = useCallback((sound: keyof typeof SOUNDS) => {
    if (!settings.sfx) return;
    
    // For "click", use the pre-loaded ref for zero-latency
    if (sound === 'click' && clickAudioRef.current) {
      clickAudioRef.current.currentTime = 0;
      clickAudioRef.current.play().catch(() => {});
      return;
    }

    // For other sounds, create new instance
    const audio = new Audio(SOUNDS[sound]);
    audio.play().catch(e => console.log('Audio play failed', e));
  }, [settings.sfx]);

  const handleUpdateProfile = (name: string, avatar: string) => {
    setUser(prev => ({ ...prev, name, avatar }));
  };

  const handleStartGame = (mode: GameMode) => {
    setGameMode(mode);
    playSFX('click');
    if (mode === 'ONLINE') {
      setView('onlineSetup');
    } else {
      setView('offlineModeSelect');
    }
  };

  const createLobby = (rules: GameRules, isLocal: boolean) => {
    setSubMode(rules.subMode);
    const newLobby: Lobby = {
      id: isLocal ? `${user.name}'s Room` : `LOBBY-${Math.floor(Math.random() * 9000) + 1000}`,
      hostId: user.id,
      hostName: user.name,
      players: [{ id: user.id, name: user.name, avatar: user.avatar, isBot: false, hand: [], isReady: true }],
      rules: rules,
      isLocal: isLocal
    };
    setCurrentLobby(newLobby);
    setView('lobby');
    playSFX('click');
  };

  const handleJoinLobby = (room: Lobby) => {
    setSubMode(room.rules.subMode);
    const updatedRoom = {
        ...room,
        players: [...room.players, { id: user.id, name: user.name, avatar: user.avatar, isBot: false, hand: [], isReady: false }]
    };
    setCurrentLobby(updatedRoom);
    setView('lobby');
    playSFX('click');
  };

  useEffect(() => {
    if (view === 'lobby' && currentLobby && !currentLobby.isLocal && currentLobby.hostId === user.id) {
      if (currentLobby.players.length < 4) {
        const timer = setTimeout(() => {
          const fakeNames = ['AceHunter', 'UnoKing', 'WildCard', 'Shadow'];
          const newPlayer: Player = {
            id: `sim-${Math.random()}`,
            name: fakeNames[Math.floor(Math.random() * fakeNames.length)],
            avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)],
            isBot: false, 
            hand: [],
            isReady: true
          };
          setCurrentLobby(prev => prev ? { ...prev, players: [...prev.players, newPlayer] } : null);
          playSFX('click');
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [view, currentLobby, user.id, playSFX]);

  // Initial Permission Requests
  useEffect(() => {
    const requestInitialPermissions = async () => {
      setTimeout(async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach(track => track.stop());
        } catch (e) {}
        if ('Notification' in window && Notification.permission === 'default') {
          try { await Notification.requestPermission(); } catch (e) {}
        }
        try { navigator.geolocation.getCurrentPosition(() => {}, () => {}); } catch (e) {}
      }, 1500);
    };
    requestInitialPermissions();
    const timer = setTimeout(() => setIsInitializing(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  const themeClasses = {
    classic: 'from-blue-900 to-blue-700',
    dark: 'from-zinc-900 to-zinc-800',
    neon: 'from-purple-900 to-pink-900'
  };

  if (isInitializing) return <SplashView onInteract={() => setHasInteracted(true)} />;

  return (
    <div className={`min-h-screen bg-gradient-to-b ${themeClasses[settings.theme]} text-white overflow-hidden relative shadow-2xl`}>
      <div className="max-w-md mx-auto h-screen flex flex-col relative z-0">
        {view === 'home' && (
          <HomeView user={user} setView={(v) => { playSFX('click'); setView(v); }} onStartGame={handleStartGame} />
        )}
        
        {view === 'onlineSetup' && (
          <OnlineSetupView 
            onBack={() => { playSFX('click'); setView('home'); }} 
            onCreateLobby={(rules) => createLobby(rules, false)} 
            onJoinMode={() => { playSFX('click'); setView('onlineJoin'); }}
            playSFX={playSFX}
          />
        )}

        {view === 'onlineJoin' && (
          <OnlineJoinView 
            onBack={() => { playSFX('click'); setView('onlineSetup'); }}
            onJoin={handleJoinLobby}
            playSFX={playSFX}
          />
        )}

        {view === 'offlineModeSelect' && (
          <div className="flex-1 flex flex-col p-6 items-center justify-center bg-black/40 backdrop-blur-xl">
            <h2 className="font-game text-5xl mb-12 tracking-tight text-white drop-shadow-2xl text-center uppercase">Offline</h2>
            <div className="w-full space-y-6">
                <button 
                  onClick={() => { playSFX('click'); setView('offlineSetup'); }}
                  className="w-full py-6 bg-yellow-400 text-blue-900 font-game text-2xl rounded-[30px] shadow-xl active:scale-95 transition-all border-b-8 border-yellow-600"
                >
                    HOST ROOM
                </button>
                <button 
                  onClick={() => { playSFX('click'); setView('offlineJoin'); }}
                  className="w-full py-6 bg-blue-500 text-white font-game text-2xl rounded-[30px] shadow-xl active:scale-95 transition-all border-b-8 border-blue-700"
                >
                    JOIN ROOM
                </button>
            </div>
            <button onClick={() => { playSFX('click'); setView('home'); }} className="mt-12 text-white/50 font-bold uppercase tracking-[0.3em] hover:text-white transition-colors text-[10px]">Return to Hub</button>
          </div>
        )}

        {view === 'game' && (
          <GameView 
            user={user} 
            mode={gameMode} 
            subMode={subMode}
            onBack={() => { setView('home'); setCurrentLobby(null); }} 
            playSFX={playSFX}
            initialPlayers={currentLobby?.players}
            rules={currentLobby?.rules}
            onGameOver={(won) => {
              setUser(prev => ({ ...prev, wins: won ? prev.wins + 1 : prev.wins, losses: won ? prev.losses : prev.losses + 1 }));
              setView('home');
              setCurrentLobby(null);
            }}
          />
        )}

        {view === 'lobby' && currentLobby && (
          <LobbyView 
            user={user} 
            lobby={currentLobby} 
            onBack={() => { playSFX('click'); setView('home'); setCurrentLobby(null); }} 
            onStart={() => {
                playSFX('click');
                setSubMode(currentLobby.rules.subMode);
                setView('game');
            }} 
            playSFX={playSFX}
          />
        )}

        {view === 'profile' && <ProfileView user={user} onUpdate={handleUpdateProfile} onBack={() => { playSFX('click'); setView('home'); }} playSFX={playSFX} />}
        {view === 'settings' && <SettingsView settings={settings} onUpdate={setSettings} onBack={() => { playSFX('click'); setView('home'); }} playSFX={playSFX} />}
        {view === 'mailbox' && <MailboxView requests={user.requests} onAccept={(id) => { playSFX('click'); }} onReject={(id) => { playSFX('click'); }} onBack={() => { playSFX('click'); setView('home'); }} playSFX={playSFX} />}
        {view === 'addFriend' && <AddFriendView onBack={() => { playSFX('click'); setView('home'); }} onInvite={(id) => { playSFX('click'); alert(`Invitation sent to ${id}`); }} playSFX={playSFX} />}
        {view === 'offlineSetup' && <OfflineSetupView onBack={() => { playSFX('click'); setView('offlineModeSelect'); }} onCreateLobby={(rules) => createLobby(rules, true)} playSFX={playSFX} />}
        {view === 'offlineJoin' && <OfflineJoinView onBack={() => { playSFX('click'); setView('offlineModeSelect'); }} onJoin={handleJoinLobby} playSFX={playSFX} />}
      </div>

      {notification && <NotificationToast message={notification.message} onClick={() => { playSFX('click'); }} onClose={() => { playSFX('click'); setNotification(null); }} />}
    </div>
  );
};

export default App;
