import { Server as NetServer } from 'net';
import { NextApiRequest, NextApiResponse } from 'next';
import { Server as SocketIOServer } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import http from 'http';

// Define interfaces
export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  votes: string[];
  budget: number; // NEW
  preferences: string[]; // NEW
}

export interface Destination {
  id: string;
  name: string;
  country: string;
  price: number;
  image?: string;
  votes: number;
}

export interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  text: string;
  timestamp: number;
}

export interface Room {
  id: string;
  name: string;
  players: Player[];
  currentRound: number;
  totalRounds: number;
  destinations: Destination[];
  messages: ChatMessage[];
  createdAt: Date;
}

// Define a type for the server object expected by Socket.IO
interface HttpServerWithIO extends http.Server {
  io?: SocketIOServer;
}

// Update the NextApiResponseServerIO type
export type NextApiResponseServerIO = NextApiResponse & {
  socket: {
    server: HttpServerWithIO;
  };
};

// In-memory store for rooms
const rooms: Record<string, Room> = {};

// Helper functions
const createRoom = (roomId: string): Room => {
  if (rooms[roomId]) {
    console.warn(`Attempted to create room ${roomId} that already exists.`);
    return rooms[roomId];
  }
  const newRoom: Room = {
    id: roomId,
    name: 'Trip Planning Room',
    players: [],
    currentRound: 0,
    totalRounds: 3,
    destinations: [],
    messages: [],
    createdAt: new Date(),
  };
  rooms[roomId] = newRoom;
  console.log(`[Room Manager] Created new room: ${roomId}`);
  return newRoom;
};

const getRoom = (roomId: string): Room | undefined => {
  return rooms[roomId];
};

// Socket.IO server initialization
export const initSocketServer = (req: NextApiRequest, res: NextApiResponseServerIO) => {
  if (res.socket.server.io) {
    console.log('Socket is already attached');
    return res.socket.server.io;
  }

  console.log('Initializing Socket.IO server...');
  const httpServer: HttpServerWithIO = res.socket.server;
  const io = new SocketIOServer(httpServer, {
    path: '/api/socket',
    cors: { origin: '*', methods: ['GET', 'POST'] },
  });

  res.socket.server.io = io;

  // Log low-level engine errors
  io.engine.on('connection_error', (err) => {
    console.error('[Socket Engine Error]');
    console.error('  Code:', err.code);
    console.error('  Message:', err.message);
    // Log context if available (it might be undefined)
    if (err.context) {
      console.error('  Context:', err.context);
    }
    // Log the full error object for more details
    console.error('  Full Error Object:', err);
  });

  io.on('connection', (socket) => {
    // ADDED: Log immediately upon connection event
    console.log(`[Connection Event] Socket connected: ${socket.id}, Transport: ${socket.conn.transport.name}`);

    console.log(`[Socket Connected] ID: ${socket.id}`); // Keep original log too

    socket.on('error', (err) => {
      console.error(`[Socket Error] ID: ${socket.id}`, err);
    });

    socket.on('join-room', ({ roomId, playerName, isHost, budget, preferences }, callback) => {
      try {
        console.log(`[Join Room] Attempt: ${playerName} (${socket.id}) joining ${roomId}`);
        socket.join(roomId);

        let room = getRoom(roomId);
        if (!room) {
          if (isHost) {
            room = createRoom(roomId);
            console.log(`[Room Created] ID: ${roomId} by Host: ${playerName} (${socket.id})`);
          } else {
            console.warn(`[Join Room] Fail: Room ${roomId} not found for non-host ${playerName} (${socket.id})`);
            if (callback) callback({ success: false, error: 'Room not found' });
            return;
          }
        }

        const isJoiningPlayerHost = room.players.length === 0 || isHost;

        const player: Player = {
          id: socket.id,
          name: playerName,
          isHost: isJoiningPlayerHost,
          votes: [],
          budget: typeof budget === 'number' ? budget : 0, // NEW
          preferences: Array.isArray(preferences) ? preferences : [], // NEW
        };

        const existingPlayerIndex = room.players.findIndex((p) => p.id === socket.id);
        if (existingPlayerIndex === -1) {
          room.players.push(player);
          if (room.players.length === 1) {
            room.players[0].isHost = true;
            player.isHost = true;
          }
          console.log(`[Player Joined] ${player.name} (${player.id}) to room ${roomId}. Host: ${player.isHost}`);
        } else {
          console.log(`[Player Rejoined/Exists] ${playerName} (${socket.id}) in room ${roomId}. Updating details.`);
          room.players[existingPlayerIndex].name = playerName;
          room.players[existingPlayerIndex].budget = typeof budget === 'number' ? budget : 0; // NEW
          room.players[existingPlayerIndex].preferences = Array.isArray(preferences) ? preferences : []; // NEW
          player.isHost = room.players[existingPlayerIndex].isHost;
        }

        socket.to(roomId).emit('player-joined', player);
        // Emit updated room state to all clients in the room (including host)
        io.to(roomId).emit('room-update', room);

        console.log(`[Join Room] Success: Sending room state to ${playerName} (${socket.id})`);
        if (callback) callback({ success: true, player, room, messages: room.messages });

        console.log(`[Room State] ID: ${roomId}, Players:`, room.players.map((p) => `${p.name}(${p.isHost ? 'H' : 'G'})`));
      } catch (error) {
        console.error(`[Join Room] Error: Room ${roomId}, Player ${playerName} (${socket.id})`, error);
        if (callback) callback({ success: false, error: 'Server error occurred while joining room' });
      }
    });

    socket.on('send-message', ({ roomId, playerId, playerName, text }) => {
      try {
        const room = getRoom(roomId);
        if (!room) {
          console.warn(`[Send Message] Room not found: ${roomId}`);
          return;
        }

        const message: ChatMessage = {
          id: uuidv4(),
          playerId,
          playerName,
          text,
          timestamp: Date.now(),
        };
        room.messages.push(message);

        console.log(`[Message Sent] Room: ${roomId}, From: ${playerName}, Text: ${text}`);
        io.to(roomId).emit('new-message', message);
      } catch (error) {
        console.error(`[Send Message] Error: Room ${roomId}, Player ${playerName}`, error);
      }
    });

    socket.on('add-destination', ({ roomId, destination }) => {
      try {
        const room = getRoom(roomId);
        if (!room) {
          console.warn(`[Add Destination] Room not found: ${roomId}`);
          return;
        }

        const newDestination: Destination = {
          id: uuidv4(),
          ...destination,
          votes: 0,
        };
        room.destinations.push(newDestination);

        console.log(`[Destination Added] Room: ${roomId}, Dest: ${newDestination.name}`);
        io.to(roomId).emit('destination-added', newDestination);
        io.to(roomId).emit('room-update', room);
      } catch (error) {
        console.error(`[Add Destination] Error: Room ${roomId}`, error);
      }
    });

    socket.on('vote', ({ roomId, playerId, destinationId }) => {
      try {
        const room = getRoom(roomId);
        const player = room?.players.find((p) => p.id === playerId);
        const destination = room?.destinations.find((d) => d.id === destinationId);

        if (!room || !player || !destination) {
          console.warn(`[Vote] Invalid vote: Room, player, or destination not found. Room: ${roomId}, Player: ${playerId}, Dest: ${destinationId}`);
          return;
        }

        if (!player.votes.includes(destinationId)) {
          player.votes.push(destinationId);
          destination.votes += 1;

          console.log(`[Vote Cast] Room: ${roomId}, Player: ${player.name}, Dest: ${destination.name}`);
          io.to(roomId).emit('room-update', room);
        } else {
          console.log(`[Vote] Player ${player.name} already voted for ${destination.name}`);
        }
      } catch (error) {
        console.error(`[Vote] Error: Room ${roomId}, Player ${playerId}`, error);
      }
    });

    // Start Minigame event
    socket.on('start-minigame', ({ roomId }) => {
      try {
        const room = getRoom(roomId);
        if (!room) {
          console.warn(`[Start Minigame] Room not found: ${roomId}`);
          return;
        }
        // Broadcast to all clients in the room
        io.to(roomId).emit('minigame-started');
        console.log(`[Minigame Started] Room: ${roomId}`);
      } catch (error) {
        console.error(`[Start Minigame] Error: Room ${roomId}`, error);
      }
    });

    // MODIFIED: Added reason parameter and logging
    socket.on('disconnect', (reason) => {
      console.log(`[Disconnect Event] Socket disconnecting: ${socket.id}, Reason: ${reason}`);
      console.log(`[Socket Disconnected] ID: ${socket.id}`); // Keep original log too
      let roomIdToRemoveFrom: string | null = null;
      let playerToRemove: Player | null = null;

      for (const roomId in rooms) {
        const room = rooms[roomId];
        const playerIndex = room.players.findIndex((p) => p.id === socket.id);
        if (playerIndex !== -1) {
          roomIdToRemoveFrom = roomId;
          playerToRemove = { ...room.players[playerIndex] };
          room.players.splice(playerIndex, 1);

          console.log(`[Player Left] ${playerToRemove.name} (${socket.id}) from room ${roomIdToRemoveFrom}`);

          if (playerToRemove.isHost && room.players.length > 0) {
            room.players[0].isHost = true;
            console.log(`[Host Reassigned] New host in room ${roomId}: ${room.players[0].name}`);
          }

          io.to(roomIdToRemoveFrom).emit('player-left', playerToRemove);
          io.to(roomIdToRemoveFrom).emit('room-update', room);

          break;
        }
      }
      if (!roomIdToRemoveFrom) {
        console.log(`[Disconnect] Socket ${socket.id} was not found in any active room.`);
      }
    });
  });

  console.log('Socket.IO server initialized successfully.');
  return io;
};