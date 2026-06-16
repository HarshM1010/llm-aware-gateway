"use client";

import { BarChart3 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Cell,
  Tooltip as RechartsTooltip, ResponsiveContainer,
} from "recharts";
import { TOOLTIP_STYLE } from "../constants";

interface VolumeDataPoint {
  hour: string;
  requests: number;
  avgLatency: number;
}

interface HourlyVolumeChartProps {
  data: VolumeDataPoint[];
}

export function HourlyVolumeChart({ data }: HourlyVolumeChartProps) {
  return (
    <div className="rounded-2xl border border-zinc-800/60 bg-gradient-to-b from-zinc-900/50 to-zinc-950/80 p-5">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 size={15} className="text-amber-400" />
        <h3 className="text-[11px] font-bold tracking-widest uppercase text-zinc-200">
          Hourly Request Volume
        </h3>
        <span className="text-[9px] font-mono text-zinc-600 ml-auto">Last 24 hours</span>
      </div>
      <div className="h-[200px]">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis
                dataKey="hour"
                tick={{ fill: "#52525b", fontSize: 9 }}
                axisLine={{ stroke: "#27272a" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#52525b", fontSize: 9 }}
                axisLine={{ stroke: "#27272a" }}
                tickLine={false}
              />
              <RechartsTooltip
                contentStyle={TOOLTIP_STYLE}
                itemStyle={{ color: "#e4e4e7" }}
                cursor={{ fill: "transparent" }}
                formatter={(v: unknown, name: unknown) => [
                  name === "requests" ? `${v} reqs` : `${v}ms`,
                  name === "requests" ? "Requests" : "Avg Latency",
                ]}
              />
              <Bar dataKey="requests" radius={[6, 6, 0, 0]} activeBar={false}>
                {data.map((_, i) => (
                  <Cell key={i} fill={i === data.length - 1 ? "#06b6d4" : "#27272a"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-zinc-700 text-[10px] font-mono">
            No data available yet
          </div>
        )}
      </div>
    </div>
  );
}
