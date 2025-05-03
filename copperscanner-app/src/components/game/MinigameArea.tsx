"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FlappyBirdGame } from "./FlappyBirdGame";
import { useGameStore } from "@/lib/state/game-store";
import { getSocketInstance } from "@/lib/socket-client";
import PostMinigameScreen from "./PostMinigameScreen";

interface MinigameAreaProps {
  roomId: string;
}

export default function MinigameArea({ roomId }: MinigameAreaProps) {
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [showPostMinigame, setShowPostMinigame] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const { player } = useGameStore();

  // Save score to profile (placeholder: emits to server, you can adjust as needed)
  const saveScore = (score: number) => {
    setScore(score);
    setGameOver(true);
    setShowPostMinigame(true);
    const socket = getSocketInstance();
    if (player) {
      socket.emit("minigame-score", { roomId, playerId: player.id, score });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Flappy Bird Minigame</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center">
        {showResults ? (
          // Replace with your GameResultsScreen and pass needed props
          <div>Game Results Screen Placeholder</div>
        ) : showPostMinigame ? (
          <PostMinigameScreen roomId={roomId} onContinue={() => setShowResults(true)} />
        ) : !gameStarted ? (
          <Button onClick={() => setGameStarted(true)} className="mt-8">Start</Button>
        ) : !gameOver ? (
          <FlappyBirdGame onGameEnd={saveScore} />
        ) : (
          <div className="flex flex-col items-center">
            <p className="text-xl font-bold mb-2">Your Score: {score}</p>
            <Button className="mt-4" onClick={() => setShowPostMinigame(true)}>
              Continue
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
