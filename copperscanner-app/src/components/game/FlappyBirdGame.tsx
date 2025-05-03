// FlappyBirdGame.tsx
// A simple Flappy Bird-style minigame for one run per player
import React, { useRef, useEffect, useState } from "react";

interface FlappyBirdGameProps {
  onGameEnd: (score: number) => void;
}

const GAME_WIDTH = 400;
const GAME_HEIGHT = 600;
const BIRD_SIZE = 32;
const GRAVITY = 0.6;
const FLAP_STRENGTH = -8;
const PIPE_WIDTH = 60;
const PIPE_GAP = 160;
const INITIAL_PIPE_SPEED = 2;
const SPEED_INCREMENT = 0.15; // How much to increase speed per point
const MIN_PIPE_GAP = 100;

function getRandomPipeY() {
  return Math.floor(Math.random() * (GAME_HEIGHT - PIPE_GAP - 100)) + 50;
}

export const FlappyBirdGame: React.FC<FlappyBirdGameProps> = ({ onGameEnd }) => {
  const [birdY, setBirdY] = useState(GAME_HEIGHT / 2);
  const [velocity, setVelocity] = useState(0);
  const [pipes, setPipes] = useState([
    { x: GAME_WIDTH, y: getRandomPipeY() },
  ]);
  const [score, setScore] = useState(0);
  const [isRunning, setIsRunning] = useState(false); // Start as false
  const [hasPlayed, setHasPlayed] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [pipeSpeed, setPipeSpeed] = useState(INITIAL_PIPE_SPEED);
  const requestRef = useRef<number>();

  // Countdown effect
  useEffect(() => {
    setIsRunning(false);
    setCountdown(5);
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer);
          setIsRunning(true);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Game loop with fixed time step
  useEffect(() => {
    if (!isRunning) return;
    let lastTime = performance.now();
    const FIXED_DT = 1000 / 60; // 60 FPS, 16.67ms
    let accumulator = 0;

    const animate = (now: number) => {
      accumulator += now - lastTime;
      lastTime = now;
      while (accumulator >= FIXED_DT) {
        setBirdY((prev) => Math.max(0, prev + velocity));
        setVelocity((v) => v + GRAVITY);
        setPipes((prevPipes) => {
          let newPipes = prevPipes.map((pipe) => ({ ...pipe, x: pipe.x - pipeSpeed }));
          // Only add one pipe at a time
          if (newPipes[newPipes.length - 1].x < GAME_WIDTH - 200) {
            newPipes.push({ x: GAME_WIDTH, y: getRandomPipeY() });
          }
          // Remove off-screen pipes and increment score by 1
          if (newPipes[0].x < -PIPE_WIDTH) {
            newPipes.shift();
            setScore((s) => s + 1);
            setPipeSpeed((speed) => speed + SPEED_INCREMENT);
          }
          return newPipes;
        });
        accumulator -= FIXED_DT;
      }
      requestRef.current = requestAnimationFrame(animate);
    };
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current!);
  }, [isRunning, velocity, pipeSpeed]);

  // Collision detection
  useEffect(() => {
    if (!isRunning) return;
    const birdBox = { top: birdY, bottom: birdY + BIRD_SIZE };
    for (const pipe of pipes) {
      if (
        pipe.x < 60 + BIRD_SIZE &&
        pipe.x + PIPE_WIDTH > 60 // bird's x is fixed at 60
      ) {
        // Check collision with top pipe
        if (birdBox.top < pipe.y || birdBox.bottom > pipe.y + PIPE_GAP) {
          setIsRunning(false);
          setHasPlayed(true);
          onGameEnd(score);
        }
      }
    }
    // Check ground/ceiling
    if (birdY <= 0 || birdY + BIRD_SIZE >= GAME_HEIGHT) {
      setIsRunning(false);
      setHasPlayed(true);
      onGameEnd(score);
    }
  }, [birdY, pipes, isRunning, score, onGameEnd]);

  // Flap handler
  const handleFlap = () => {
    if (!isRunning || hasPlayed || countdown > 0) return;
    setVelocity(FLAP_STRENGTH);
  };

  // Only allow one play
  useEffect(() => {
    const handleSpace = (e: KeyboardEvent) => {
      if (e.code === "Space") handleFlap();
    };
    window.addEventListener("keydown", handleSpace);
    return () => window.removeEventListener("keydown", handleSpace);
  });

  return (
    <div style={{ width: GAME_WIDTH, height: GAME_HEIGHT, position: "relative", background: "#87ceeb", overflow: "hidden", borderRadius: 12, margin: "0 auto" }}>
      {/* Countdown overlay */}
      {countdown > 0 && (
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10,
          color: "#fff",
          fontSize: 64,
          fontWeight: 700,
        }}>
          {countdown === 0 ? "Go!" : countdown}
        </div>
      )}
      {/* Bird */}
      <div
        style={{
          position: "absolute",
          left: 60,
          top: birdY,
          width: BIRD_SIZE,
          height: BIRD_SIZE,
          background: "yellow",
          borderRadius: "50%",
          border: "2px solid #333",
        }}
      />
      {/* Pipes */}
      {pipes.map((pipe, i) => (
        <React.Fragment key={i}>
          {/* Top pipe */}
          <div
            style={{
              position: "absolute",
              left: pipe.x,
              top: 0,
              width: PIPE_WIDTH,
              height: pipe.y,
              background: "#228B22",
              border: "2px solid #145214",
              borderRadius: 8,
            }}
          />
          {/* Bottom pipe */}
          <div
            style={{
              position: "absolute",
              left: pipe.x,
              top: pipe.y + PIPE_GAP,
              width: PIPE_WIDTH,
              height: GAME_HEIGHT - (pipe.y + PIPE_GAP),
              background: "#228B22",
              border: "2px solid #145214",
              borderRadius: 8,
            }}
          />
        </React.Fragment>
      ))}
      {/* Score */}
      <div style={{ position: "absolute", top: 16, left: 16, fontSize: 24, color: "#fff", textShadow: "1px 1px 2px #333" }}>
        {score}
      </div>
      {/* Overlay when game ends */}
      {!isRunning && hasPlayed && (
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
        }}>
          <h2>Game Over</h2>
          <p>Your score: {score}</p>
          <button onClick={() => onGameEnd(score)} style={{ marginTop: 16, padding: "8px 24px", fontSize: 18, borderRadius: 8, border: "none", background: "#ff9800", color: "#fff", cursor: "pointer" }}>
            Back to Lobby
          </button>
        </div>
      )}
    </div>
  );
};
