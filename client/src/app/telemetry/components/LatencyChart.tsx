"use client";

import { TrendingUp } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis,
  Tooltip as RechartsTooltip, ResponsiveContainer,
} from "recharts";
import { TOOLTIP_STYLE } from "../constants";

interface LatencyDataPoint {
  time: string;
  latency: number;
  source: string;
  color: string;
}

interface LatencyChartProps {
  data: LatencyDataPoint[];
}

export function LatencyChart({ data }: LatencyChartProps) {
  return (
    <div className="lg:col-span-2 rounded-2xl border border-zinc-800/60 bg-gradient-to-b from-zinc-900/50 to-zinc-950/80 p-5">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp size={15} className="text-cyan-400" />
        <h3 className="text-[11px] font-bold tracking-widest uppercase text-zinc-200">
          Latency Over Time
        </h3>
        <span className="text-[9px] font-mono text-zinc-600 ml-auto">Last 50 requests</span>
      </div>
      <div className="h-[250px]">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="latGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="time"
                tick={{ fill: "#52525b", fontSize: 9 }}
                axisLine={{ stroke: "#27272a" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#52525b", fontSize: 9 }}
                axisLine={{ stroke: "#27272a" }}
                tickLine={false}
                unit="ms"
              />
              <RechartsTooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(v: unknown) => [`${v}ms`, "Latency"]}
              />
              <Area
                type="monotone"
                dataKey="latency"
                stroke="#06b6d4"
                strokeWidth={2}
                fill="url(#latGrad)"
                dot={(props: Record<string, unknown>) => {
                  const idx = props.index as number;
                  const color = data[idx]?.color || "#06b6d4";
                  return (
                    <circle
                      key={idx}
                      cx={props.cx as number}
                      cy={props.cy as number}
                      r={3}
                      fill={color}
                      stroke="none"
                    />
                  );
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex items-center justify-center h-full text-zinc-700 text-[10px] font-mono">
      No data available yet
    </div>
  );
}
