import { create } from 'zustand';
import { Player, Room, ChatMessage } from '@/server/socket';

interface GameState {
  // Player info
  player: Player | null;
  room: Room | null;
  messages: ChatMessage[];
  isConnected: boolean;
  
  // Actions
  setPlayer: (player: Player) => void;
  setRoom: (room: Room) => void;
  addMessage: (message: ChatMessage) => void;
  setMessages: (messages: ChatMessage[]) => void;
  setIsConnected: (isConnected: boolean) => void;
  vote: (destinationId: string) => void;
  reset: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  // Initial state
  player: null,
  room: null,
  messages: [],
  isConnected: false,
  
  // Actions
  setPlayer: (player) => set({ player }),
  setRoom: (room) => set({ room }),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  setMessages: (messages) => set({ messages }),
  setIsConnected: (isConnected) => set({ isConnected }),
  vote: (destinationId) => set((state) => {
    if (!state.player || !state.room) return state;
    
    // Add vote to player's votes
    const updatedPlayer = {
      ...state.player,
      votes: [...state.player.votes, destinationId],
    };
    
    // Update destination vote count in room
    const updatedRoom = {
      ...state.room,
      destinations: state.room.destinations.map((dest) => 
        dest.id === destinationId
          ? { ...dest, votes: dest.votes + 1 }
          : dest
      ),
    };
    
    return {
      player: updatedPlayer,
      room: updatedRoom,
    };
  }),
  reset: () => set({ player: null, room: null, messages: [], isConnected: false }),
}));