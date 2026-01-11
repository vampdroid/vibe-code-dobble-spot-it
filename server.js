/**
 * REAL BACKEND SERVER CODE
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const EMOJI_SYMBOLS = [
  '🍎', '🍌', '🍒', '🍇', '🍉', '🍓', '🍑', '🍍', 
  '🥝', '🥥', '🥑', '🍆', '🥔', '🥕', '🌽', '🌶️', 
  '🥒', '🥦', '🍄', '🥜', '🥐', '🥖', '🥨', '🥞', 
  '🧀', '🍖', '🍗', '🥩', '🥓', '🍔', '🍟', '🍕', 
  '🌭', '🥪', '🌮', '🌯', '🍳', '🥘', '🍲', '🥣', 
  '🥗', '🍿', '🧂', '🥫', '🍱', '🍘', '🍙', '🍚', 
  '🍛', '🍜', '🍝', '🍠', '🍢', '🍣', '🍤', '🍥', 
  '🍦', '🍧'
];

class DobbleEngine {
  constructor() {
    this.deck = [];
    this.generateDeck();
  }

  generateDeck() {
    const N = 7;
    const cardsFinal = [];
    
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
                c.push(N + 1 + N*k + (i*k + j) % N);
            }
            cardsFinal.push(c);
        }
    }
    
    this.deck = cardsFinal.map((cardIndices, idx) => ({
        id: idx,
        rotation: Math.random() * 360,
        symbols: cardIndices.map(i => EMOJI_SYMBOLS[i % EMOJI_SYMBOLS.length])
    }));
    
    this.deck.sort(() => Math.random() - 0.5);
  }

  drawCards(count) {
    if (this.deck.length === 0) return [];
    return this.deck.splice(0, count);
  }
  
  validateTriplet(cards) {
    if (cards.length !== 3) return null;
    const [c1, c2, c3] = cards;
    const intersection12 = c1.symbols.filter(s => c2.symbols.includes(s));
    const intersectionAll = intersection12.filter(s => c3.symbols.includes(s));
    if (intersectionAll.length === 1) return intersectionAll[0];
    return null;
  }
}
// ----------------------------------------------------------------

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

const rooms = {}; 

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('joinRoom', ({ name, roomId }) => {
    if (!rooms[roomId]) {
      rooms[roomId] = {
        roomId,
        players: [],
        status: 'LOBBY',
        engine: new DobbleEngine(),
        currentRoundCards: [],
        lastMatch: null,
        winner: null
      };
    }

    const room = rooms[roomId];
    if (room.status === 'PLAYING') {
        socket.emit('error', 'Game already in progress');
        return;
    }
    if (room.players.length >= 8) {
        socket.emit('error', 'Room full');
        return;
    }

    const player = {
        id: socket.id,
        name: name,
        score: 0,
        isHost: room.players.length === 0,
        avatar: '👤' 
    };
    
    room.players.push(player);
    socket.join(roomId);
    
    io.to(roomId).emit('gameState', sanitizeState(room));
  });

  socket.on('startGame', (roomId) => {
    const room = rooms[roomId];
    if (room && room.players.find(p => p.id === socket.id)?.isHost) {
        room.status = 'PLAYING';
        room.engine = new DobbleEngine(); 
        room.players.forEach(p => p.score = 0);
        room.currentRoundCards = room.engine.drawCards(9);
        io.to(roomId).emit('gameState', sanitizeState(room));
    }
  });

  socket.on('submitGuess', ({ roomId, cardIds }) => {
    const room = rooms[roomId];
    if (!room || room.status !== 'PLAYING') return;

    // Validate logic
    const selectedCards = room.currentRoundCards.filter(c => cardIds.includes(c.id));
    if (selectedCards.length !== 3) return;

    const matchSymbol = room.engine.validateTriplet(selectedCards);

    if (matchSymbol) {
        const player = room.players.find(p => p.id === socket.id);
        if (player) {
            player.score += 3;
            room.lastMatch = matchSymbol;
            
            // Replacement Logic: Keep positions
            const indicesToReplace = [];
            room.currentRoundCards.forEach((c, idx) => {
                if (c && cardIds.includes(c.id)) indicesToReplace.push(idx);
            });
            
            const newCards = room.engine.drawCards(indicesToReplace.length);
            
            // Create a copy to work on
            const nextRoundCards = [...room.currentRoundCards];
            
            indicesToReplace.forEach((gridIndex, i) => {
                if (i < newCards.length) {
                    nextRoundCards[gridIndex] = newCards[i];
                }
            });
            
            // Final update (filter out old ones if we couldn't replace)
            room.currentRoundCards = nextRoundCards.filter(c => !cardIds.includes(c.id) || newCards.some(n => n.id === c.id));
            
            // Check end game
            if (room.currentRoundCards.length < 3 && room.engine.deck.length === 0) {
                 room.status = 'FINISHED';
                 room.players.sort((a, b) => b.score - a.score);
                 room.winner = room.players[0];
            }

            io.to(roomId).emit('correctGuess', { playerId: socket.id, cardIds });
            io.to(roomId).emit('gameState', sanitizeState(room));
        }
    } else {
        io.to(roomId).emit('wrongGuess', socket.id);
    }
  });

  socket.on('disconnect', () => {
     // Cleanup handled if needed
  });
});

function sanitizeState(room) {
    const { engine, ...safeState } = room;
    return {
        ...safeState,
        deckSize: engine.deck.length
    };
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});