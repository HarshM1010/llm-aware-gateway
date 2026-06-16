"use client";

import { Database } from "lucide-react";
import {
  PieChart, Pie, Cell, Legend,
  Tooltip as RechartsTooltip, ResponsiveContainer,
} from "recharts";
import { TOOLTIP_STYLE } from "../constants";

interface PieDataPoint {
  name: string;
  value: number;
  color: string;
}

interface SourcePieChartProps {
  data: PieDataPoint[];
}

export function SourcePieChart({ data }: SourcePieChartProps) {
  return (
    <div className="rounded-2xl border border-zinc-800/60 bg-gradient-to-b from-zinc-900/50 to-zinc-950/80 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Database size={15} className="text-emerald-400" />
        <h3 className="text-[11px] font-bold tracking-widest uppercase text-zinc-200">
          Source Distribution
        </h3>
      </div>
      <div className="h-[250px]">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="45%"
                innerRadius={50}
                outerRadius={80}
                dataKey="value"
                stroke="none"
                paddingAngle={3}
              >
                {data.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <RechartsTooltip 
                contentStyle={TOOLTIP_STYLE} 
                itemStyle={{ color: "#e4e4e7" }} 
              />
              <Legend
                verticalAlign="bottom"
                formatter={(value: string) => (
                  <span className="text-[10px] text-zinc-400">{value}</span>
                )}
              />
            </PieChart>
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
