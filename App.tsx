
import React, { useState, useCallback, useEffect } from 'react';
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
import NotificationToast from './components/NotificationToast';

const App: React.FC = () => {
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
    sfx: true
  });

  const [gameMode, setGameMode] = useState<GameMode>('OFFLINE');
  const [subMode, setSubMode] = useState<OnlineSubMode>('CLASSIC');
  const [currentLobby, setCurrentLobby] = useState<Lobby | null>(null);
  const [notification, setNotification] = useState<{message: string, type: 'invite', lobbyId: string} | null>(null);

  const playSFX = useCallback((sound: keyof typeof SOUNDS) => {
    if (!settings.sfx) return;
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

  // Simulate players joining online lobbies to make the demo feel "Online"
  useEffect(() => {
    if (view === 'lobby' && currentLobby && !currentLobby.isLocal && currentLobby.hostId === user.id) {
      if (currentLobby.players.length < 4) {
        const timer = setTimeout(() => {
          const fakePlayerNames = ['AceHunter', 'UnoKing', 'WildCard', 'ShadowPlayer', 'GeminiFan'];
          const newPlayer: Player = {
            id: `sim-${Math.random()}`,
            name: fakePlayerNames[Math.floor(Math.random() * fakePlayerNames.length)],
            avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)],
            isBot: false, // Simulated as a real player joining
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

  const themeClasses = {
    classic: 'from-blue-900 to-blue-700',
    dark: 'from-zinc-900 to-zinc-800',
    neon: 'from-purple-900 to-pink-900'
  };

  return (
    <div className={`min-h-screen bg-gradient-to-b ${themeClasses[settings.theme]} text-white overflow-hidden relative`}>
      <div className="max-w-md mx-auto h-screen flex flex-col relative z-0 shadow-2xl">
        {view === 'home' && (
          <HomeView user={user} setView={setView} onStartGame={handleStartGame} />
        )}
        
        {view === 'onlineSetup' && (
          <OnlineSetupView 
            onBack={() => setView('home')} 
            onCreateLobby={(rules) => createLobby(rules, false)} 
            onJoinMode={() => setView('onlineJoin')}
          />
        )}

        {view === 'onlineJoin' && (
          <OnlineJoinView 
            onBack={() => setView('onlineSetup')}
            onJoin={handleJoinLobby}
          />
        )}

        {view === 'offlineModeSelect' && (
          <div className="flex-1 flex flex-col p-6 items-center justify-center bg-black/20">
            <h2 className="font-game text-4xl mb-12 tracking-tight text-yellow-400 text-center uppercase">Offline Room</h2>
            <div className="w-full space-y-6">
                <button 
                  onClick={() => setView('offlineSetup')}
                  className="w-full py-6 bg-yellow-400 text-blue-900 font-game text-2xl rounded-3xl shadow-xl active:scale-95 transition-all border-b-8 border-yellow-600"
                >
                    HOST ROOM
                </button>
                <button 
                  onClick={() => setView('offlineJoin')}
                  className="w-full py-6 bg-blue-500 text-white font-game text-2xl rounded-3xl shadow-xl active:scale-95 transition-all border-b-8 border-blue-700"
                >
                    JOIN ROOM
                </button>
            </div>
            <button onClick={() => setView('home')} className="mt-12 text-white/50 font-bold uppercase tracking-widest hover:text-white transition-colors">Back to Home</button>
          </div>
        )}

        {view === 'game' && (
          <GameView 
            user={user} 
            mode={gameMode} 
            subMode={subMode}
            onBack={() => setView('home')} 
            playSFX={playSFX}
            initialPlayers={currentLobby?.players}
            rules={currentLobby?.rules}
            onGameOver={(won) => {
              setUser(prev => ({ ...prev, wins: won ? prev.wins + 1 : prev.wins, losses: won ? prev.losses : prev.losses + 1 }));
              setView('home');
            }}
          />
        )}

        {view === 'lobby' && currentLobby && (
          <LobbyView 
            user={user} 
            lobby={currentLobby} 
            onBack={() => { setView('home'); setCurrentLobby(null); }} 
            onStart={() => {
                setSubMode(currentLobby.rules.subMode);
                setView('game');
            }} 
          />
        )}

        {view === 'profile' && <ProfileView user={user} onUpdate={handleUpdateProfile} onBack={() => setView('home')} />}
        {view === 'settings' && <SettingsView settings={settings} onUpdate={setSettings} onBack={() => setView('home')} />}
        {view === 'mailbox' && <MailboxView requests={user.requests} onAccept={() => {}} onReject={() => {}} onBack={() => setView('home')} />}
        {view === 'addFriend' && <AddFriendView onBack={() => setView('home')} onInvite={(id) => alert(`Invitation sent to ${id}`)} />}
        {view === 'offlineSetup' && <OfflineSetupView onBack={() => setView('offlineModeSelect')} onCreateLobby={(rules) => createLobby(rules, true)} />}
        {view === 'offlineJoin' && <OfflineJoinView onBack={() => setView('offlineModeSelect')} onJoin={handleJoinLobby} />}
      </div>

      {notification && <NotificationToast message={notification.message} onClick={() => {}} onClose={() => setNotification(null)} />}
    </div>
  );
};

export default App;
