import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getSocketInstance } from "@/lib/socket-client";
import { useGameStore } from "@/lib/state/game-store";
import { getSkyscannerUrl } from "@/lib/getSkyscannerUrl";

interface PostMinigameScreenProps {
  roomId: string;
  onContinue?: () => void;
}

const PostMinigameScreen: React.FC<PostMinigameScreenProps> = ({ roomId, onContinue }) => {
  const { room, player } = useGameStore();
  const [finishedPlayers, setFinishedPlayers] = useState<{ id: string; name: string }[]>([]);
  const [allFinished, setAllFinished] = useState(false);
  const [showSuspense, setShowSuspense] = useState(false);
  const [destination, setDestination] = useState<string | null>(null);

  useEffect(() => {
    const socket = getSocketInstance();
    const handleProgress = (data: { finishedPlayers: { id: string; name: string }[] }) => {
      setFinishedPlayers(data.finishedPlayers);
    };
    const handleAllFinished = () => {
      setAllFinished(true);
      setShowSuspense(true);
    };
    const handleDestination = (data: { destination: string }) => {
      setDestination(data.destination);
      setShowSuspense(false);
    };
    socket.on("minigame-progress", handleProgress);
    socket.on("minigame-all-finished", handleAllFinished);
    socket.on("destination-decided", handleDestination);
    return () => {
      socket.off("minigame-progress", handleProgress);
      socket.off("minigame-all-finished", handleAllFinished);
      socket.off("destination-decided", handleDestination);
    };
  }, []);

  useEffect(() => {
    let suspenseTimeout: NodeJS.Timeout;
    if (allFinished && showSuspense) {
      suspenseTimeout = setTimeout(() => {
        setShowSuspense(false);
        // Hardcode destination if not set
        if (!destination) setDestination("Barcelona, Spain");
      }, 2500);
    }
    return () => clearTimeout(suspenseTimeout);
  }, [allFinished, showSuspense, destination]);

  useEffect(() => {
    if (destination && onContinue) {
      const timeout = setTimeout(() => {
        onContinue();
      }, 1800); // Give users time to see the destination
      return () => clearTimeout(timeout);
    }
  }, [destination, onContinue]);

  const totalPlayers = room?.players.length || 1;
  const finishedCount = finishedPlayers.length;
  const percent = Math.round((finishedCount / totalPlayers) * 100);

  return (
    <Card className="max-w-md mx-auto mt-12">
      <CardHeader>
        <CardTitle>
          {destination
            ? "Your Destination!"
            : showSuspense
            ? "Deciding Destination..."
            : allFinished
            ? "All Players Finished!"
            : "Waiting for Players"}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        {!allFinished ? (
          <>
            <p className="mb-4">Waiting for everyone in the lobby to finish the minigame...</p>
            <Progress value={percent} className="w-60" />
            <ul className="mt-4 text-sm">
              {room?.players.map((p) => (
                <li key={p.id} className={finishedPlayers.find(fp => fp.id === p.id) ? "text-green-600" : "text-neutral-500"}>
                  {p.name} {finishedPlayers.find(fp => fp.id === p.id) ? "✓" : ""}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-neutral-500">Room ID: {roomId}</p>
          </>
        ) : showSuspense ? (
          <>
            <div className="my-8 animate-pulse text-2xl font-bold text-blue-600">🎲 Deciding...</div>
            <Progress value={100} className="w-60" />
            <p className="mt-4 text-xs text-neutral-500">Room ID: {roomId}</p>
          </>
        ) : destination ? (
          <>
            <div className="my-8 text-3xl font-extrabold text-green-700 animate-fade-in">{destination}</div>
            <div className="mt-4 w-full flex flex-col items-center">
              {/* Show user's own flight info */}
              <div className="mb-2 p-3 bg-blue-50 rounded shadow w-72 flex flex-col items-center">
                <span className="font-semibold">Origin: {player?.departureCity || "-"}</span>
                <span className="font-semibold">Destination: {destination}</span>
                <span className="font-semibold">Price: €123</span>
                <a
                  href={getSkyscannerUrl(player?.departureCity || "", destination || "")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 flex items-center gap-2 text-blue-700 underline hover:text-blue-900"
                >
                  <img src="/skyscanner.png" alt="Skyscanner" className="w-5 h-5 inline-block" />
                  View on Skyscanner
                </a>
              </div>
            </div>
            <p className="mt-4 text-xs text-neutral-500">Room ID: {roomId}</p>
          </>
        ) : (
          <>
            <p className="mb-4">All players have finished the minigame!</p>
            <Progress value={100} className="w-60" />
            <p className="mt-4 text-xs text-neutral-500">Room ID: {roomId}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default PostMinigameScreen;
