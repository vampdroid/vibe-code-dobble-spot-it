export interface Player {
  id: string;
  name: string;
  score: number;
  isHost: boolean;
  avatar: string;
}

export type SymbolItem = string; // Emojis

export interface CardData {
  id: number;
  symbols: SymbolItem[];
  rotation: number;
}

export enum GameStatus {
  LOBBY = 'LOBBY',
  PLAYING = 'PLAYING',
  FINISHED = 'FINISHED',
}

export interface GameState {
  roomId: string;
  players: Player[];
  status: GameStatus;
  currentRoundCards: CardData[];
  deckSize: number;
  // targetSymbol is no longer a single truth for the round in 3x3 mode, 
  // as multiple triplets might exist. We remove strict target tracking 
  // or keep it null.
  lastMatch: SymbolItem | null; 
  winner: Player | null;
}

export interface LobbyProps {
  onJoin: (name: string, roomId?: string) => void;
  onCreate: (name: string) => void;
}

// Socket Event Types
export interface ServerToClientEvents {
  gameState: (state: GameState) => void;
  error: (msg: string) => void;
  correctGuess: (data: { playerId: string, cardIds: number[] }) => void;
  wrongGuess: (playerId: string) => void;
}

export interface ClientToServerEvents {
  joinRoom: (data: { name: string; roomId: string }) => void;
  createRoom: (data: { name: string }) => void;
  startGame: (roomId: string) => void;
  submitGuess: (data: { roomId: string; cardIds: number[] }) => void;
}