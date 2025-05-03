"use client";

import { useEffect, useState } from "react";
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
    let socket: unknown;
    
    const setupSocket = async () => {
      setConnecting(true);
      try {
        // Get socket instance
        socket = getSocketInstance();
        
        // Set up event handlers
        (socket as unknown).on("connect", () => {
          if (!mounted) return;
          
          console.log("Connected to socket server with ID:", (socket as any).id);
          setIsConnected(true);
          
          // Join room
          (socket as unknown).emit("join-room", 
            { roomId, playerName, isHost, budget: initialBudget, preferences: initialPreferences, departureCity }, 
            (response: unknown) => {
              if (!mounted) return;
              
              if ((response as any)?.success) {
                setPlayer((response as any).player);
                setRoom((response as any).room);
                setMessages((response as any).messages || []);
                toast.success(`Joined room: ${roomId}`);
              } else {
                toast.error((response as any)?.error || "Failed to join room");
              }
              setConnecting(false);
            }
          );
        });

        (socket as unknown).on("room-update", (updatedRoom: unknown) => {
          if (!mounted) return;
          setRoom(updatedRoom as any);
        });

        (socket as unknown).on("player-joined", (newPlayer: unknown) => {
          if (!mounted) return;
          toast(`${(newPlayer as any).name} joined the room`, {
            description: `${room?.players?.length || 1} players in the room`,
          });
        });

        (socket as unknown).on("player-left", (leftPlayer: unknown) => {
          if (!mounted) return;
          toast(`${(leftPlayer as any).name} left the room`, {
            description: `${room?.players?.length || 0} players in the room`,
          });
        });

        (socket as unknown).on("new-message", (newMessage: unknown) => {
          if (!mounted) return;
          addMessage(newMessage as any);
        });

        (socket as unknown).on("destination-added", (newDestination: unknown) => {
          if (!mounted) return;
          toast(`New destination added: ${(newDestination as any).name}`);
        });

        (socket as unknown).on("minigame-started", () => {
          setMinigameStarted(true);
          toast("Minigame is starting!");
        });

        (socket as unknown).on("connect_error", (err: unknown) => {
          console.error("Socket connection error:", err);
          if (!mounted) return;
          toast.error("Connection error: " + (err as any).message);
          setConnecting(false);
        });

        (socket as unknown).on("disconnect", () => {
          console.log("Disconnected from socket server");
          if (!mounted) return;
          setIsConnected(false);
          toast.error("Disconnected from server");
        });
        
        // Connect if not already connected
        if (!(socket as any).connected) {
          (socket as unknown).connect();
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
        (socket as unknown).off("connect");
        (socket as unknown).off("room-update");
        (socket as unknown).off("player-joined");
        (socket as unknown).off("player-left");
        (socket as unknown).off("new-message");
        (socket as unknown).off("destination-added");
        (socket as unknown).off("minigame-started");
        (socket as unknown).off("connect_error");
        (socket as unknown).off("disconnect");
      }
      setTimeout(() => reset(), 0);

    };
  }, [roomId, playerName, isHost, initialBudget, initialPreferences, departureCity, setIsConnected, setPlayer, setRoom, setMessages, addMessage, reset]);

  const sendMessage = () => {
    if (!message.trim() || !player) return;
    
    const socket = getSocketInstance();
    (socket as unknown).emit("send-message", {
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
    (socket as unknown).emit("add-destination", {
      roomId,
      destination,
    });
    
    setDestination({ name: "", country: "", price: 0 });
    toast.success(`Destination suggested: ${destination.name}`);
  };

  const handleVote = (destinationId: string) => {
    if (!player) return;
    
    const socket = getSocketInstance();
    (socket as unknown).emit("vote", {
      roomId,
      playerId: player.id,
      destinationId,
    });
    
    vote(destinationId);
    toast.success("Vote recorded!");
  };

  const handleStartMinigame = () => {
    const socket = getSocketInstance();
    (socket as unknown).emit("start-minigame", { roomId });
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
    <div className="min-h-screen bg-neutral-100 p-4">
      <div className="max-w-6xl mx-auto">
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
            
            {/* Destinations */}
            <Card>
              <CardHeader>
                <CardTitle>Destinations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4 space-y-2 p-3 bg-neutral-50 rounded-lg">
                  <h3 className="font-medium">Add Destination</h3>
                  <Input
                    placeholder="Destination Name"
                    value={destination.name}
                    onChange={(e) => setDestination({...destination, name: e.target.value})}
                    className="mb-2"
                  />
                  <Input
                    placeholder="Country"
                    value={destination.country}
                    onChange={(e) => setDestination({...destination, country: e.target.value})}
                    className="mb-2"
                  />
                  <Input
                    type="number"
                    placeholder="Price"
                    value={destination.price || ""}
                    onChange={(e) => setDestination({...destination, price: parseInt(e.target.value) || 0})}
                    className="mb-2"
                  />
                  <Button onClick={addNewDestination} className="w-full">
                    Add Destination
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {room.destinations.length === 0 ? (
                    <p className="text-sm text-neutral-500">No destinations yet.</p>
                  ) : (
                    room.destinations.map((dest) => (
                      <Card key={dest.id} className="overflow-hidden border-neutral-200">
                        <div className="p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">{dest.name}</h3>
                              <p className="text-sm text-neutral-500">{dest.country}</p>
                            </div>
                            <Badge variant="outline">${dest.price}</Badge>
                          </div>
                          <div className="mt-3 flex justify-between items-center">
                            <span className="text-sm">{dest.votes} votes</span>
                            <Button 
                              size="sm" 
                              variant="outline"
                              disabled={player.votes.includes(dest.id)}
                              onClick={() => handleVote(dest.id)}
                            >
                              {player.votes.includes(dest.id) ? "Voted" : "Vote"}
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
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
          </div>
        )}
      </div>
      <Toaster position="bottom-center" />
    </div>
  );
}