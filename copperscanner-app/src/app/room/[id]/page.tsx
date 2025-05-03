"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useGameStore } from "@/lib/state/game-store";
import { getSocketInstance } from "@/lib/socket-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import MinigameArea from "@/components/game/MinigameArea";

// Add this for playing sound
const playCopperSound = () => {
  const audio = new Audio("/copperscanner-sound.mp3");
  audio.currentTime = 5; // start at 5 seconds
  audio.play();
  setTimeout(() => audio.pause(), 2000); // play for 2 seconds
};

export default function RoomPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const roomId = params.id as string;
  const playerName = searchParams.get("name") || "Guest";
  const isHost = searchParams.get("host") === "true";
  const initialBudget = Number(searchParams.get("budget")) || 0;
  const initialPreferences = (searchParams.get("preferences") || "").split(",").filter(Boolean);
  const departureCity = searchParams.get("departureCity") || "";

  const [message, setMessage] = useState("");
  const [destination, setDestination] = useState({ name: "", country: "", price: 0 });
  const [connecting, setConnecting] = useState(true);
  const [minigameStarted, setMinigameStarted] = useState(false);
  const [copperMemes, setCopperMemes] = useState<{ id: string; text: string; votes: number; voters: string[] }[]>([]);
  const [copperText, setCopperText] = useState("");
  const memeInputRef = useRef<HTMLInputElement>(null);

  const preferenceOptions = [
    "Beach",
    "Mountains",
    "City",
    "Adventure",
    "Culture",
    "Relaxation",
    "Nightlife",
    "Nature",
  ];

  const { 
    player, 
    room, 
    messages, 
    isConnected,
    setPlayer,
    setRoom,
    setMessages,
    addMessage,
    setIsConnected,
    vote,
    reset
  } = useGameStore();

  useEffect(() => {
    let mounted = true;
    let socket: any;
    
    const setupSocket = async () => {
      setConnecting(true);
      try {
        // Get socket instance
        socket = getSocketInstance();
        
        // Set up event handlers
        socket.on("connect", () => {
          if (!mounted) return;
          
          console.log("Connected to socket server with ID:", socket.id);
          setIsConnected(true);
          
          // Debug: log join-room payload
          console.log('JOIN ROOM PAYLOAD', { roomId, playerName, isHost, budget: initialBudget, preferences: initialPreferences, departureCity });
          // Join room
          socket.emit("join-room", 
            { roomId, playerName, isHost, budget: initialBudget, preferences: initialPreferences, departureCity }, 
            (response: any) => {
              if (!mounted) return;
              
              if (response?.success) {
                setPlayer(response.player);
                setRoom(response.room);
                setMessages(response.messages || []);
                toast.success(`Joined room: ${roomId}`);
              } else {
                toast.error(response?.error || "Failed to join room");
              }
              setConnecting(false);
            }
          );

          socket.emit('get-copper-memes', { roomId });
        });

        socket.on("room-update", (updatedRoom: any) => {
          if (!mounted) return;
          setRoom(updatedRoom);
        });

        socket.on("player-joined", (newPlayer: any) => {
          if (!mounted) return;
          toast(`${newPlayer.name} joined the room`, {
            description: `${room?.players?.length || 1} players in the room`,
          });
        });

        socket.on("player-left", (leftPlayer: any) => {
          if (!mounted) return;
          toast(`${leftPlayer.name} left the room`, {
            description: `${room?.players?.length || 0} players in the room`,
          });
        });

        socket.on("new-message", (newMessage: any) => {
          if (!mounted) return;
          addMessage(newMessage);
        });

        socket.on("destination-added", (newDestination: any) => {
          if (!mounted) return;
          toast(`New destination added: ${newDestination.name}`);
        });

        socket.on("minigame-started", () => {
          setMinigameStarted(true);
          toast("Minigame is starting!");
        });

        socket.on('copper-memes-update', (memes) => {
          if (!mounted) return;
          setCopperMemes(memes);
        });

        socket.on("connect_error", (err: any) => {
          console.error("Socket connection error:", err);
          if (!mounted) return;
          toast.error("Connection error: " + err.message);
          setConnecting(false);
        });

        socket.on("disconnect", () => {
          console.log("Disconnected from socket server");
          if (!mounted) return;
          setIsConnected(false);
          toast.error("Disconnected from server");
        });
        
        // Connect if not already connected
        if (!socket.connected) {
          socket.connect();
        }
      } catch (error) {
        console.error("Error setting up socket:", error);
        if (mounted) {
          toast.error("Failed to setup connection");
          setConnecting(false);
        }
      }
    };

    setupSocket();

    // Cleanup
    return () => {
      mounted = false;
      if (socket) {
        socket.off("connect");
        socket.off("room-update");
        socket.off("player-joined");
        socket.off("player-left");
        socket.off("new-message");
        socket.off("destination-added");
        socket.off("minigame-started");
        socket.off("copper-memes-update");
        socket.off("connect_error");
        socket.off("disconnect");
      }
      setTimeout(() => reset(), 0);

    };
  }, []);

  useEffect(() => {
    // Play sound if any meme reaches 2 votes
    const memeWithEnoughVotes = copperMemes.find(meme => meme.votes === 2);
    if (memeWithEnoughVotes) {
      playCopperSound();
    }
  }, [copperMemes]);

  const sendMessage = () => {
    if (!message.trim() || !player) return;
    
    const socket = getSocketInstance();
    socket.emit("send-message", {
      roomId,
      playerId: player.id,
      playerName: player.name,
      text: message,
    });
    
    setMessage("");
  };

  const addNewDestination = () => {
    if (!destination.name || !destination.country || !player) return;
    
    const socket = getSocketInstance();
    socket.emit("add-destination", {
      roomId,
      destination,
    });
    
    setDestination({ name: "", country: "", price: 0 });
    toast.success(`Destination suggested: ${destination.name}`);
  };

  const handleVote = (destinationId: string) => {
    if (!player) return;
    
    const socket = getSocketInstance();
    socket.emit("vote", {
      roomId,
      playerId: player.id,
      destinationId,
    });
    
    vote(destinationId);
    toast.success("Vote recorded!");
  };

  const handleStartMinigame = () => {
    const socket = getSocketInstance();
    socket.emit("start-minigame", { roomId });
  };

  const handleAddCopper = () => {
    if (!copperText.trim()) return;
    const socket = getSocketInstance();
    socket.emit('add-copper-meme', {
      roomId,
      meme: { text: copperText.trim() },
    });
    setCopperText('');
    memeInputRef.current?.focus();
  };

  const handleVoteCopper = (id: string, voterId: string, delta: number) => {
    const socket = getSocketInstance();
    socket.emit('vote-copper-meme', {
      roomId,
      memeId: id,
      voterId,
      delta,
    });
  };

  if (!player || !room || connecting) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Progress value={30} className="w-60" />
        <p className="mt-2">Connecting to room...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100 p-4 relative overflow-hidden">
      {/* Animated background layer */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 w-full h-full"
        style={{
          background: 'url("/background.avif") center center / cover no-repeat',
          opacity: 0.35,
        }}
      />
      <div className="max-w-6xl mx-auto relative z-10">
        <header className="mb-6">
          <h1 className="text-3xl font-bold">Trip Planning Room</h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline">Room ID: {roomId}</Badge>
            <Badge>{isConnected ? "Connected" : "Disconnected"}</Badge>
            <Badge variant="secondary">{player.isHost ? "Host" : "Guest"}</Badge>
          </div>
          {player.isHost && !minigameStarted && (
            <Button className="mt-4" onClick={handleStartMinigame}>
              Start Minigame
            </Button>
          )}
        </header>
        
        {minigameStarted ? (
          <MinigameArea roomId={roomId} onBackToLobby={() => setMinigameStarted(false)} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Players List */}
            <Card>
              <CardHeader>
                <CardTitle>Players ({room.players.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {room.players.map((p) => (
                    <div key={p.id} className="flex items-center gap-2">
                      <Avatar>
                        <AvatarFallback>
                          {p.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span>{p.name}</span>
                      <span className="text-xs text-neutral-500 ml-2">{p.departureCity ? `from ${p.departureCity}` : null}</span>
                      {p.isHost && <Badge variant="secondary">Host</Badge>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            {/* Chat */}
            <Card>
              <CardHeader>
                <CardTitle>Chat</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-md h-80 mb-3 p-3 overflow-y-auto flex flex-col">
                  {messages.length === 0 ? (
                    <p className="text-neutral-500 text-sm">No messages yet.</p>
                  ) : (
                    messages.map((msg) => (
                      <div key={msg.id} className={`mb-2 max-w-[80%] ${msg.playerId === player.id ? 'self-end' : 'self-start'}`}>
                        <div className={`rounded-lg p-2 text-sm ${msg.playerId === player.id ? 'bg-blue-100' : 'bg-neutral-100'}`}>
                          {msg.playerId !== player.id && (
                            <p className="font-medium text-xs text-neutral-600">{msg.playerName}</p>
                          )}
                          <p>{msg.text}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  />
                  <Button onClick={sendMessage}>Send</Button>
                </div>
              </CardContent>
            </Card>
            {/* Copper Meme Card */}
            <Card className="bg-yellow-50 border-yellow-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🏺 Copper Quality Board
                </CardTitle>
                <p className="text-xs text-neutral-600 mt-1">Add your copper (meme/joke) in honor of Ea-Nasir. Vote on the quality!</p>
                <p className="text-xs text-yellow-700 mt-2 flex items-center gap-1">
                  <span className="font-bold">*</span> The one with the best copper will have a bigger impact on getting their trip chosen!
                </p>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-3">
                  <Input
                    ref={memeInputRef}
                    placeholder="Add your copper..."
                    value={copperText}
                    onChange={e => setCopperText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddCopper()}
                  />
                  <Button onClick={handleAddCopper} variant="secondary">Add</Button>
                </div>
                <div className="space-y-3">
                  {copperMemes.length === 0 ? (
                    <div className="text-xs text-neutral-500">No copper yet. Be the first to add!</div>
                  ) : (
                    copperMemes.map(meme => (
                      <div key={meme.id} className="border rounded p-2 bg-white flex flex-col gap-1">
                        <span className="text-sm">{meme.text}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <Button size="sm" variant="outline" onClick={() => handleVoteCopper(meme.id, player.id, 1)} disabled={meme.voters.includes(player.id)}>
                            Good Copper
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleVoteCopper(meme.id, player.id, -1)} disabled={meme.voters.includes(player.id)}>
                            Bad Copper
                          </Button>
                          <span className="text-xs ml-2">Quality: <b>{meme.votes}</b></span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      <Toaster position="bottom-center" />
    </div>
  );
}