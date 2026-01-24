
export type CardColor = 'red' | 'blue' | 'green' | 'yellow' | 'wild';

export type CardValue = 
  | '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' 
  | 'skip' | 'reverse' | 'draw2' | 'wild' | 'draw4' 
  | 'draw6' | 'draw10' | 'reverse4' | 'vanishing' | 'ghostswap' 
  | 'elitereverse' | 'hybrid' | 'all4' | 'allIn' | 'again';

export interface Card {
  id: string;
  color: CardColor;
  value: CardValue;
  secondaryValue?: CardValue; 
  components?: Card[]; 
}

export type GameMode = 'OFFLINE' | 'ONLINE';
export type OnlineSubMode = 'CLASSIC' | 'NO_MERCY' | 'SUPERIOR';

export interface GameRules {
  subMode: OnlineSubMode;
  initialCards: number;
}

export interface Player {
  id: string;
  name: string;
  avatar: string;
  isBot: boolean;
  hand: Card[];
  finalHand?: Card[];
  isReady?: boolean;
  isEliminated?: boolean;
  isFinished?: boolean;
  isVanished?: boolean;
  rank?: number;
}

export interface FriendRequest {
  id: string;
  fromId: string;
  fromName: string;
  timestamp: number;
}

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  wins: number;
  losses: number;
  friends: string[];
  requests: FriendRequest[];
}

export interface GameSettings {
  theme: 'classic' | 'dark' | 'neon';
  sfx: boolean;
  music: boolean;
}

export interface Lobby {
  id: string;
  hostId: string;
  hostName: string;
  players: Player[];
  rules: GameRules;
  isLocal: boolean;
}
