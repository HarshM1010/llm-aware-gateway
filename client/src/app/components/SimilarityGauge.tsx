"use client";

import { motion } from "framer-motion";

interface SimilarityGaugeProps {
  similarity: number;
}

export function SimilarityGauge({ similarity }: SimilarityGaugeProps) {
  const pct = similarity * 100;
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  const gaugeColor =
    pct >= 90
      ? "#10b981"
      : pct >= 70
        ? "#06b6d4"
        : pct >= 50
          ? "#eab308"
          : "#71717a";

  return (
    <div className="flex items-center gap-4">
      <div className="relative w-24 h-24 shrink-0">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="#27272a"
            strokeWidth="6"
          />
          <motion.circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={gaugeColor}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{
              strokeDashoffset: similarity > 0 ? offset : circumference,
            }}
            transition={{ duration: 1, ease: "easeOut" }}
            style={{ filter: `drop-shadow(0 0 6px ${gaugeColor}40)` }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center flex-col">
          <motion.span
            key={pct}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-lg font-bold"
            style={{ color: gaugeColor }}
          >
            {similarity > 0 ? `${pct.toFixed(0)}%` : "--"}
          </motion.span>
        </div>
      </div>
      <div>
        <div className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest mb-1">
          Cosine Similarity
        </div>
        <div className="text-[10px] text-zinc-600 leading-tight">
          pgvector semantic match score
        </div>
        {similarity > 0.9 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-2 text-[9px] text-emerald-400 font-mono uppercase bg-emerald-500/10 border border-emerald-500/20 rounded px-2 py-0.5 inline-block"
          >
            Cache Hit &gt; 90%
          </motion.div>
        )}
      </div>
    </div>
  );
}
