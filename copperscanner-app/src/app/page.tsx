"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { v4 as uuidv4 } from "uuid";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Home() {
  const [playerName, setPlayerName] = useState("");
  const [roomId, setRoomId] = useState("");
  const router = useRouter();

  const handleCreateRoom = () => {
    if (!playerName) {
      toast.error("Please enter your name");
      return;
    }

    const newRoomId = uuidv4().substring(0, 8);
    router.push(`/room/${newRoomId}?name=${encodeURIComponent(playerName)}&host=true`);
  };

  const handleJoinRoom = () => {
    if (!playerName) {
      toast.error("Please enter your name");
      return;
    }

    if (!roomId) {
      toast.error("Please enter a room ID");
      return;
    }

    router.push(`/room/${roomId}?name=${encodeURIComponent(playerName)}&host=false`);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-neutral-100 to-neutral-200">
      <div className="max-w-md w-full">
        <Card className="shadow-lg border-neutral-200">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center">CopperScanner</CardTitle>
            <CardDescription className="text-center">
              Collaborative Trip Planning
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="create" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="create">Create Room</TabsTrigger>
                <TabsTrigger value="join">Join Room</TabsTrigger>
              </TabsList>
              
              <TabsContent value="create">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="createName" className="block text-sm font-medium mb-2">
                      Your Name
                    </label>
                    <Input
                      id="createName"
                      placeholder="Enter your name"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                    />
                  </div>
                  <Button className="w-full" onClick={handleCreateRoom}>
                    Create New Room
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="join">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="joinName" className="block text-sm font-medium mb-2">
                      Your Name
                    </label>
                    <Input
                      id="joinName"
                      placeholder="Enter your name"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="roomId" className="block text-sm font-medium mb-2">
                      Room ID
                    </label>
                    <Input
                      id="roomId"
                      placeholder="Enter room ID"
                      value={roomId}
                      onChange={(e) => setRoomId(e.target.value)}
                    />
                  </div>
                  <Button className="w-full" onClick={handleJoinRoom}>
                    Join Room
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex flex-col text-xs text-neutral-500">
            <p>Plan trips with friends in real-time</p>
          </CardFooter>
        </Card>
      </div>
      <Toaster position="bottom-center" />
    </main>
  );
}
