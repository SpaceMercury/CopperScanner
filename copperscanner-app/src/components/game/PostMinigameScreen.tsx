import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getSocketInstance } from "@/lib/socket-client";
import { useGameStore } from "@/lib/state/game-store";

interface PostMinigameScreenProps {
  roomId: string;
  onContinue?: () => void;
}

const PostMinigameScreen: React.FC<PostMinigameScreenProps> = ({ roomId, onContinue }) => {
  const { room, player } = useGameStore();
  const [finishedPlayers, setFinishedPlayers] = useState<{ id: string; name: string }[]>([]);
  const [allFinished, setAllFinished] = useState(false);

  useEffect(() => {
    const socket = getSocketInstance();
    const handleProgress = (data: { finishedPlayers: { id: string; name: string }[] }) => {
      setFinishedPlayers(data.finishedPlayers);
    };
    const handleAllFinished = () => {
      setAllFinished(true);
    };
    socket.on("minigame-progress", handleProgress);
    socket.on("minigame-all-finished", handleAllFinished);
    // Request current progress in case of late join
    // (optional: you can emit a request here if you add a handler on the backend)
    return () => {
      socket.off("minigame-progress", handleProgress);
      socket.off("minigame-all-finished", handleAllFinished);
    };
  }, []);

  // Auto-advance when all players are finished
  useEffect(() => {
    if (allFinished && onContinue) {
      const timeout = setTimeout(() => {
        onContinue();
      }, 1200); // 1.2s delay for UX
      return () => clearTimeout(timeout);
    }
  }, [allFinished, onContinue]);

  const totalPlayers = room?.players.length || 1;
  const finishedCount = finishedPlayers.length;
  const percent = Math.round((finishedCount / totalPlayers) * 100);

  return (
    <Card className="max-w-md mx-auto mt-12">
      <CardHeader>
        <CardTitle>
          {allFinished ? "All Players Finished!" : "Waiting for Players"}
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
        ) : (
          <>
            <p className="mb-4">All players have finished the minigame!</p>
            <Progress value={100} className="w-60" />
            <p className="mt-4 text-xs text-neutral-500">Room ID: {roomId}</p>
            {/* Add a Continue button or auto-advance here */}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default PostMinigameScreen;
