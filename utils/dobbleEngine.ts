import { EMOJI_SYMBOLS } from '../constants';
import { CardData, SymbolItem } from '../types';

// Order of the projective plane (Prime number). 
// 7 = 8 symbols per card, 57 cards total.
const N = 7; 

export class DobbleEngine {
  deck: CardData[] = [];
  
  constructor() {
    this.generateDeck();
  }

  private generateDeck() {
    const cardsFinal: number[][] = [];
    
    // 1. First card
    const c1 = [];
    for(let i=0; i<=N; i++) c1.push(i);
    cardsFinal.push(c1);
    
    // 2. N cards
    for (let j=0; j<N; j++) {
        const c = [0];
        for (let k=0; k<N; k++) {
            c.push(N + 1 + N*j + k);
        }
        cardsFinal.push(c);
    }
    
    // 3. N x N cards
    for (let i=0; i<N; i++) {
        for (let j=0; j<N; j++) {
            const c = [i + 1];
            for (let k=0; k<N; k++) {
                // The magic formula for affine plane lines
                c.push(N + 1 + N*k + (i*k + j) % N);
            }
            cardsFinal.push(c);
        }
    }
    
    // Map numbers to Emojis and structure
    this.deck = cardsFinal.map((cardIndices, idx) => ({
        id: idx,
        rotation: Math.random() * 360,
        symbols: cardIndices.map(i => EMOJI_SYMBOLS[i % EMOJI_SYMBOLS.length])
    }));
    
    // Shuffle deck
    this.deck.sort(() => Math.random() - 0.5);
  }

  // Draw N cards from the top of the deck
  public drawCards(count: number): CardData[] {
    if (this.deck.length === 0) return [];
    const drawn = this.deck.splice(0, count);
    return drawn;
  }

  // Validate if 3 cards share exactly one symbol
  public validateTriplet(cards: CardData[]): SymbolItem | null {
    if (cards.length !== 3) return null;

    const [c1, c2, c3] = cards;
    
    // Find intersection of c1 and c2
    const intersection12 = c1.symbols.filter(s => c2.symbols.includes(s));
    
    // Find intersection of that result with c3
    const intersectionAll = intersection12.filter(s => c3.symbols.includes(s));

    // Exactly one common symbol
    if (intersectionAll.length === 1) {
        return intersectionAll[0];
    }
    
    return null;
  }
}