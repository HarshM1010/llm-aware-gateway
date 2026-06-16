import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Hexagon, Cpu, Loader2 } from "lucide-react";

const BOOT_MESSAGES = [
  "Initializing Memoria Gateway...",
  "Waking up edge compute container...",
  "Connecting to PostgreSQL & pgvector...",
  "Establishing Redis L1 Cache link...",
  "Connecting to MongoDB for logging...",
  "Mounting Semantic Router...",
];

interface BootScreenProps {
  onBootComplete: () => void;
}

export function BootScreen({ onBootComplete }: BootScreenProps) {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const textInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % BOOT_MESSAGES.length);
    }, 3000);

    const pollServer = async () => {
      const API_URL = "http://localhost:3000";
      let isAwake = false;
      let attempts = 0;
      const maxAttempts = 20;

      while (!isAwake && attempts < maxAttempts) {
        try {
          const response = await fetch(`${API_URL}/api/health`, {
            cache: "no-store",
          });

          if (response.ok) {
            isAwake = true;
            clearInterval(textInterval);
            onBootComplete();
            break;
          }
        } catch (error) {
          console.log(
            `Render cold start in progress. Attempt ${attempts + 1}/${maxAttempts}`
          );
        }

        attempts++;
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }

      if (!isAwake) {
        console.warn("Polling timed out, but proceeding to dashboard.");
        clearInterval(textInterval);
        onBootComplete();
      }
    };

    pollServer();
    return () => clearInterval(textInterval);
  }, [onBootComplete]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950 font-mono text-cyan-400 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 z-0 flex items-center justify-center opacity-20 pointer-events-none">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 60, ease: "linear" }}
          className="absolute rounded-full border border-cyan-500/20 w-[600px] h-[600px]"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
          className="absolute rounded-full border border-cyan-500/30 w-[450px] h-[450px]"
        />
      </div>

      {/* Central Hexagon Loader */}
      <div className="relative z-10 flex flex-col items-center justify-center mb-12">
        <div className="relative flex items-center justify-center">
          {/* Outer spinning hexagon */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
            className="absolute text-cyan-500/30"
          >
            <Hexagon size={160} strokeWidth={1} />
          </motion.div>

          {/* Middle pulsing hexagon */}
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            className="absolute text-cyan-400/50"
          >
            <Hexagon size={130} strokeWidth={1.5} />
          </motion.div>

          {/* Inner rotating hexagon */}
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
            className="absolute text-cyan-300/80 shadow-cyan-500/50 drop-shadow-[0_0_15px_rgba(6,182,212,0.8)]"
          >
            <Hexagon size={100} strokeWidth={2} />
          </motion.div>

          {/* Center Icon */}
          <motion.div
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{
              repeat: Infinity,
              duration: 1.5,
              ease: "easeInOut",
            }}
            className="relative text-cyan-200"
          >
            <Cpu
              size={40}
              className="drop-shadow-[0_0_8px_rgba(6,182,212,1)]"
            />
          </motion.div>
        </div>
      </div>

      {/* Loading Text */}
      <div className="z-10 flex flex-col items-center gap-4 text-center px-4 max-w-lg mt-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-4"
        >
          <Loader2 size={18} className="animate-spin text-cyan-400" />
          <h1 className="text-xl font-bold tracking-[0.2em] text-zinc-100">
            SYSTEM INITIALIZATION
          </h1>
        </motion.div>

        <motion.p
          key={messageIndex}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.3 }}
          className="text-sm tracking-wide text-cyan-300/90 h-6"
        >
          {BOOT_MESSAGES[messageIndex]}
        </motion.p>

        <div className="w-full h-1 bg-zinc-900 rounded-full mt-2 mb-6 overflow-hidden relative">
          <motion.div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-600 to-cyan-400"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 45, ease: "linear" }}
          />
        </div>

        <p className="text-[10px] uppercase tracking-widest text-zinc-600 leading-relaxed border border-zinc-800 bg-zinc-900/40 p-3 rounded-lg backdrop-blur-sm shadow-xl">
          Cold Start Protection Active
          <br />
          <span className="text-zinc-500 mt-1 block">
            Backend Service is spinning up from cold state. Establishing secure
            links.
            <br />
            This sequence typically requires ~45 seconds.
          </span>
        </p>
      </div>
    </div>
  );
}
