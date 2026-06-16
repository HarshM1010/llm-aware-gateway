"use client";

import { motion } from "framer-motion";

interface MetricCardProps {
  label: string;
  value: number;
  unit: string;
  color: "cyan" | "emerald";
}

export function MetricCard({ label, value, unit, color }: MetricCardProps) {
  return (
    <div className="bg-zinc-950/50 border border-zinc-800/50 rounded-xl p-3.5 flex flex-col justify-center">
      <div className="text-[9px] text-zinc-500 font-mono uppercase mb-1.5">
        {label}
      </div>
      <div className="flex items-baseline gap-1">
        <motion.span
          key={value}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className={`text-2xl font-bold ${color === "cyan" ? "text-cyan-400" : "text-emerald-400"}`}
        >
          {value}
        </motion.span>
        <span className="text-[10px] text-zinc-500 font-mono uppercase">
          {unit}
        </span>
      </div>
    </div>
  );
}
