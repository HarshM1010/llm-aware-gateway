import { Database, Layers } from "lucide-react";
import { SOURCE_COLORS, SOURCE_LABELS, SOURCE_ICONS } from "../constants";

interface SourceBreakdownProps {
  sourceDistribution: { _id: string; count: number; avgLatency: number }[];
  totalRequests: number;
}

export function SourceBreakdown({ sourceDistribution, totalRequests }: SourceBreakdownProps) {
  if (sourceDistribution.length === 0) return null;

  return (
    <div>
      <h3 className="text-[11px] font-bold tracking-widest uppercase text-zinc-400 mb-3 flex items-center gap-2">
        <Layers size={13} />
        Source Breakdown
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {sourceDistribution.map((src) => {
          const Icon = SOURCE_ICONS[src._id] || Database;
          const color = SOURCE_COLORS[src._id] || "#71717a";
          const pct = totalRequests > 0 ? ((src.count / totalRequests) * 100).toFixed(1) : "0";

          return (
            <div
              key={src._id}
              className="rounded-xl border border-zinc-800/60 bg-zinc-900/30 p-4 hover:border-zinc-700/60 transition-all"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${color}15` }}>
                  <Icon size={14} style={{ color }} />
                </div>
                <span className="text-[10px] font-bold tracking-wider uppercase text-zinc-300 truncate">
                  {SOURCE_LABELS[src._id] || src._id}
                </span>
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-2xl font-bold" style={{ color }}>{src.count}</span>
                <span className="text-[10px] text-zinc-500 font-mono">{pct}%</span>
              </div>
              <div className="w-full bg-zinc-800/50 rounded-full h-1.5 mb-2">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{ backgroundColor: color, width: `${pct}%` }}
                />
              </div>
              <div className="text-[9px] text-zinc-500 font-mono">
                Avg: {Math.round(src.avgLatency)}ms
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
