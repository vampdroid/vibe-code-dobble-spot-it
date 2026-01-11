import { DobbleEngine } from '../utils/dobbleEngine';
import { GameState, GameStatus, Player, SymbolItem, CardData } from '../types';
import { MAX_PLAYERS, AVATARS } from '../constants';

type Listener = (data: any) => void;

class MockServer {
  private state: GameState;
  private engine: DobbleEngine;
  private listeners: Record<string, Listener[]> = {};

  constructor() {
    this.engine = new DobbleEngine();
    this.state = {
      roomId: 'DEMO-123',
      players: [],
      status: GameStatus.LOBBY,
      currentRoundCards: [],
      deckSize: 55,
      lastMatch: null,
      winner: null
    };
  }

  on(event: string, cb: Listener) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(cb);
  }

  emit(event: string, data: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(data));
    }
  }

  joinGame(name: string) {
    const newPlayer: Player = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      score: 0,
      isHost: this.state.players.length === 0,
      avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)]
    };

    if (this.state.players.length >= MAX_PLAYERS) {
      this.emit('error', 'Room is full');
      return;
    }

    this.state.players.push(newPlayer);
    this.broadcastState();
    return newPlayer;
  }

  startGame() {
    if (this.state.players.length < 1) return;
    this.engine = new DobbleEngine();
    this.state.status = GameStatus.PLAYING;
    this.state.deckSize = 55;
    this.state.players.forEach(p => p.score = 0);
    this.state.currentRoundCards = [];
    
    // Initial deal: 9 cards
    this.dealCards(9);
  }

  private dealCards(count: number) {
    const newCards = this.engine.drawCards(count);
    
    if (newCards.length === 0 && this.state.currentRoundCards.length === 0) {
      this.endGame();
      return;
    }

    this.state.currentRoundCards = [...this.state.currentRoundCards, ...newCards];
    this.state.deckSize = this.engine.deck.length;
    this.broadcastState();
  }

  submitGuess(playerId: string, cardIds: number[]) {
    if (this.state.status !== GameStatus.PLAYING) return;
    
    // Find the actual card objects
    const selectedCards = this.state.currentRoundCards.filter(c => c && cardIds.includes(c.id));
    
    if (selectedCards.length !== 3) {
      this.emit('wrongGuess', playerId);
      return;
    }

    const matchSymbol = this.engine.validateTriplet(selectedCards);

    if (matchSymbol) {
      // Correct!
      const player = this.state.players.find(p => p.id === playerId);
      if (player) {
        player.score += 3; 
        this.state.lastMatch = matchSymbol;
        
        this.emit('correctGuess', { playerId, cardIds });
        
        // REPLACEMENT LOGIC: Preserve indices using new Array copy
        // 1. Identify indices of matched cards
        const indicesToReplace: number[] = [];
        this.state.currentRoundCards.forEach((c, idx) => {
            if (c && cardIds.includes(c.id)) {
                indicesToReplace.push(idx);
            }
        });

        // 2. Draw exactly that many new cards
        const newCards = this.engine.drawCards(indicesToReplace.length);
        
        // 3. Create a Copy and Replace
        const nextRoundCards = [...this.state.currentRoundCards];
        indicesToReplace.forEach((gridIndex, i) => {
            if (i < newCards.length) {
                nextRoundCards[gridIndex] = newCards[i];
            }
        });

        // 4. Update State (Filter only if we couldn't replace them because deck is empty)
        // If deck was empty, newCards.length < indicesToReplace.length.
        // The old cards remain in nextRoundCards at those indices.
        // We need to remove them now.
        this.state.currentRoundCards = nextRoundCards.filter(c => 
            // Keep if it's NOT one of the old guessed cards OR if it IS one of the new replacement cards
            !cardIds.includes(c.id) || newCards.some(n => n.id === c.id)
        );

        this.state.deckSize = this.engine.deck.length;

        // Check end game
        if (this.state.currentRoundCards.length < 3 && this.state.deckSize === 0) {
             this.endGame();
        } else {
             this.broadcastState();
        }
      }
    } else {
      // Wrong
      this.emit('wrongGuess', playerId);
    }
  }

  endGame() {
    this.state.status = GameStatus.FINISHED;
    const sorted = [...this.state.players].sort((a, b) => b.score - a.score);
    this.state.winner = sorted[0];
    this.broadcastState();
  }

  private broadcastState() {
    this.emit('gameState', { ...this.state });
  }
}

export const mockServer = new MockServer();