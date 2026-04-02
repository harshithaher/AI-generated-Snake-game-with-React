import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Terminal, AlertTriangle } from 'lucide-react';

// --- Music Data ---
const TRACKS = [
  {
    id: 1,
    title: "DATA_STREAM_01.WAV",
    artist: "SYS.OP",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    cover: "https://picsum.photos/seed/glitch1/200/200"
  },
  {
    id: 2,
    title: "MEM_LEAK_DETECTED.MP3",
    artist: "KERNEL_PANIC",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    cover: "https://picsum.photos/seed/glitch2/200/200"
  },
  {
    id: 3,
    title: "OVERRIDE_SEQUENCE.FLAC",
    artist: "ROOT_ACCESS",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    cover: "https://picsum.photos/seed/glitch3/200/200"
  }
];

// --- Game Constants ---
const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_DIRECTION = { x: 0, y: -1 };
const GAME_SPEED = 65;

export default function App() {
  // --- Music Player State ---
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // --- Snake Game State ---
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [food, setFood] = useState({ x: 5, y: 5 });
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [highScore, setHighScore] = useState(0);
  
  const directionRef = useRef(direction);

  // --- Music Player Logic ---
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    if (isPlaying && audioRef.current) {
      audioRef.current.play().catch(e => console.error("Audio play error:", e));
    } else if (!isPlaying && audioRef.current) {
      audioRef.current.pause();
    }
  }, [isPlaying, currentTrackIndex]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  
  const skipForward = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
    setIsPlaying(true);
  };
  
  const skipBack = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
    setIsPlaying(true);
  };

  const handleTrackEnd = () => {
    skipForward();
  };

  // --- Snake Game Logic ---
  const generateFood = useCallback(() => {
    let newFood;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };
      // eslint-disable-next-line no-loop-func
      const isOnSnake = snake.some(segment => segment.x === newFood.x && segment.y === newFood.y);
      if (!isOnSnake) break;
    }
    setFood(newFood);
  }, [snake]);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    directionRef.current = INITIAL_DIRECTION;
    setScore(0);
    setGameOver(false);
    setGameStarted(true);
    generateFood();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
        e.preventDefault();
      }

      if (!gameStarted || gameOver) {
        if (e.key === ' ' || e.key === 'Enter') {
          resetGame();
        }
        return;
      }

      const currentDir = directionRef.current;
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (currentDir.y !== 1) directionRef.current = { x: 0, y: -1 };
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (currentDir.y !== -1) directionRef.current = { x: 0, y: 1 };
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (currentDir.x !== 1) directionRef.current = { x: -1, y: 0 };
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (currentDir.x !== -1) directionRef.current = { x: 1, y: 0 };
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStarted, gameOver]);

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const moveSnake = () => {
      setSnake(prevSnake => {
        const head = prevSnake[0];
        const currentDir = directionRef.current;
        const newHead = {
          x: head.x + currentDir.x,
          y: head.y + currentDir.y
        };

        if (
          newHead.x < 0 ||
          newHead.x >= GRID_SIZE ||
          newHead.y < 0 ||
          newHead.y >= GRID_SIZE
        ) {
          setGameOver(true);
          setHighScore(prev => Math.max(prev, score));
          return prevSnake;
        }

        if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
          setGameOver(true);
          setHighScore(prev => Math.max(prev, score));
          return prevSnake;
        }

        const newSnake = [newHead, ...prevSnake];

        if (newHead.x === food.x && newHead.y === food.y) {
          setScore(s => s + 10);
          generateFood();
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    };

    const gameInterval = setInterval(moveSnake, GAME_SPEED);
    return () => clearInterval(gameInterval);
  }, [gameStarted, gameOver, food, score, generateFood]);

  const currentTrack = TRACKS[currentTrackIndex];

  return (
    <div className="min-h-screen bg-black text-[#00fff9] font-digital flex flex-col items-center justify-between p-4 md:p-8 overflow-hidden uppercase screen-tear selection:bg-[#ff00c1] selection:text-black">
      {/* Retro-Futurist Overlays */}
      <div className="bg-noise" />
      <div className="scanlines" />

      {/* Header */}
      <header className="w-full max-w-4xl flex flex-col sm:flex-row items-start sm:items-center justify-between z-10 mb-6 gap-4 border-b-4 border-[#ff00c1] pb-4">
        <div className="flex items-center gap-4">
          <Terminal className="w-10 h-10 text-[#ff00c1] animate-pulse drop-shadow-[0_0_10px_#ff00c1]" />
          <h1 className="text-4xl md:text-5xl glitch-text tracking-widest text-[#00fff9] drop-shadow-[0_0_8px_#00fff9]" data-text="SYS.OP.SNAKE">
            SYS.OP.SNAKE
          </h1>
        </div>
        
        <div className="flex items-center gap-6 border-2 border-[#00fff9] p-3 bg-black/80 shadow-[4px_4px_0px_#ff00c1]">
          <div className="flex flex-col items-end">
            <span className="text-sm text-[#ff00c1] tracking-widest">ALLOC</span>
            <span className="text-4xl glitch-text text-[#00fff9]" data-text={score}>{score}</span>
          </div>
          <div className="w-1 h-12 bg-[#ff00c1]" />
          <div className="flex flex-col items-start">
            <span className="text-sm text-[#ff00c1] tracking-widest">MAX_ALLOC</span>
            <span className="text-4xl glitch-text text-[#00fff9]" data-text={highScore}>{highScore}</span>
          </div>
        </div>
      </header>

      {/* Main Game Area */}
      <main className="flex-1 flex items-center justify-center w-full z-10 relative">
        <div className="relative w-full max-w-[450px] aspect-square border-4 border-[#ff00c1] bg-black shadow-[0_0_30px_rgba(255,0,193,0.4)]">
          {/* Grid Background */}
          <div 
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage: `linear-gradient(to right, #00fff9 1px, transparent 1px), linear-gradient(to bottom, #00fff9 1px, transparent 1px)`,
              backgroundSize: `${100 / GRID_SIZE}% ${100 / GRID_SIZE}%`
            }}
          />

          {/* Snake */}
          {snake.map((segment, index) => {
            const isHead = index === 0;
            const progress = index / snake.length;
            const opacity = Math.max(0.2, 1 - progress);

            return (
              <div
                key={`${segment.x}-${segment.y}-${index}`}
                className="absolute transition-all duration-75 rounded-none"
                style={{
                  left: `${(segment.x / GRID_SIZE) * 100}%`,
                  top: `${(segment.y / GRID_SIZE) * 100}%`,
                  width: `${100 / GRID_SIZE}%`,
                  height: `${100 / GRID_SIZE}%`,
                  backgroundColor: isHead ? '#00fff9' : '#ff00c1',
                  border: '1px solid #000',
                  boxShadow: isHead 
                    ? '0 0 15px #00fff9' 
                    : `0 0 ${10 * opacity}px #ff00c1`,
                  zIndex: 100 - index,
                  opacity: opacity
                }}
              />
            );
          })}

          {/* Food */}
          <div
            className="absolute animate-ping rounded-none"
            style={{
              left: `${(food.x / GRID_SIZE) * 100}%`,
              top: `${(food.y / GRID_SIZE) * 100}%`,
              width: `${100 / GRID_SIZE}%`,
              height: `${100 / GRID_SIZE}%`,
              backgroundColor: '#ff00c1',
              boxShadow: '0 0 20px #ff00c1',
            }}
          />

          {/* Overlays */}
          {!gameStarted && !gameOver && (
            <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-20 p-6 text-center border-4 border-[#00fff9] m-4">
              <Terminal className="w-12 h-12 text-[#00fff9] mb-4 animate-pulse" />
              <h2 className="text-4xl font-bold text-[#ff00c1] mb-4 glitch-text tracking-widest" data-text="AWAITING_INPUT">AWAITING_INPUT</h2>
              <p className="text-[#00fff9] mb-8 text-lg tracking-widest">EXECUTE_MOVEMENT: [W,A,S,D] OR [ARROWS]</p>
              <button 
                onClick={resetGame}
                className="px-8 py-3 border-2 border-[#ff00c1] text-[#ff00c1] hover:bg-[#ff00c1] hover:text-black transition-colors text-2xl font-bold tracking-widest shadow-[4px_4px_0px_#00fff9] hover:shadow-[0px_0px_0px_#00fff9] hover:translate-x-1 hover:translate-y-1"
              >
                INIT()
              </button>
            </div>
          )}

          {gameOver && (
            <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center z-20 p-6 text-center border-4 border-[#ff00c1] m-4">
              <AlertTriangle className="w-16 h-16 text-[#ff00c1] mb-4 animate-pulse" />
              <h2 className="text-5xl font-black text-[#ff00c1] mb-4 glitch-text tracking-widest" data-text="FATAL_ERR">FATAL_ERR</h2>
              <p className="text-2xl text-[#00fff9] mb-8 tracking-widest">DUMP_SIZE: {score}</p>
              <button 
                onClick={resetGame}
                className="px-8 py-3 border-2 border-[#00fff9] text-[#00fff9] hover:bg-[#00fff9] hover:text-black transition-colors text-2xl font-bold tracking-widest shadow-[4px_4px_0px_#ff00c1] hover:shadow-[0px_0px_0px_#ff00c1] hover:translate-x-1 hover:translate-y-1"
              >
                REBOOT()
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Music Player */}
      <footer className="w-full max-w-4xl mt-8 z-10 border-t-4 border-[#00fff9] pt-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          
          {/* Track Info */}
          <div className="flex items-center gap-4 w-full sm:w-1/3">
            <div className="w-16 h-16 border-2 border-[#ff00c1] relative overflow-hidden flex-shrink-0">
              <img 
                src={currentTrack.cover} 
                alt="Cover" 
                className={`w-full h-full object-cover grayscale contrast-200 ${isPlaying ? 'animate-pulse' : ''}`}
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-[#00fff9] mix-blend-overlay opacity-40" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-[#00fff9] font-bold truncate text-xl glitch-text tracking-widest" data-text={currentTrack.title}>{currentTrack.title}</h3>
              <p className="text-[#ff00c1] text-sm truncate tracking-widest">SRC: {currentTrack.artist}</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center w-full sm:w-1/3 gap-8">
            <button 
              onClick={skipBack}
              className="text-[#ff00c1] hover:text-[#00fff9] transition-colors hover:scale-110 drop-shadow-[0_0_8px_#ff00c1]"
            >
              <SkipBack className="w-8 h-8" />
            </button>
            
            <button 
              onClick={togglePlay}
              className="w-14 h-14 flex items-center justify-center border-2 border-[#00fff9] text-[#00fff9] hover:bg-[#00fff9] hover:text-black transition-colors shadow-[4px_4px_0px_#ff00c1] hover:shadow-[0px_0px_0px_#ff00c1] hover:translate-x-1 hover:translate-y-1"
            >
              {isPlaying ? (
                <Pause className="w-8 h-8" fill="currentColor" />
              ) : (
                <Play className="w-8 h-8 ml-1" fill="currentColor" />
              )}
            </button>
            
            <button 
              onClick={skipForward}
              className="text-[#ff00c1] hover:text-[#00fff9] transition-colors hover:scale-110 drop-shadow-[0_0_8px_#ff00c1]"
            >
              <SkipForward className="w-8 h-8" />
            </button>
          </div>

          {/* Volume */}
          <div className="hidden sm:flex items-center justify-end gap-4 w-1/3">
            <button 
              onClick={() => setIsMuted(!isMuted)}
              className="text-[#00fff9] hover:text-[#ff00c1] transition-colors"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-6 h-6" />
              ) : (
                <Volume2 className="w-6 h-6" />
              )}
            </button>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.01" 
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                setVolume(parseFloat(e.target.value));
                if (isMuted) setIsMuted(false);
              }}
              className="w-24"
            />
          </div>
        </div>
      </footer>

      {/* Hidden Audio Element */}
      <audio 
        ref={audioRef}
        src={currentTrack.url}
        onEnded={handleTrackEnd}
        crossOrigin="anonymous"
      />
    </div>
  );
}
