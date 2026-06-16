"use client";

import { useState, useEffect } from "react";
import { Clock, Search } from "lucide-react";
import { SOURCE_COLORS, SOURCE_LABELS } from "../constants";
import type { TelemetryLog } from "../constants";

interface RequestLogTableProps {
  logs: TelemetryLog[];
  filter: string;
  onFilterChange: (value: string) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

export function RequestLogTable({
  logs,
  filter,
  onFilterChange,
  searchQuery,
  onSearchChange,
}: RequestLogTableProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState<number>(50);

  useEffect(() => {
    setVisibleCount(50);
  }, [filter, searchQuery]);

  return (
    <div className="rounded-2xl border border-zinc-800/60 bg-gradient-to-b from-zinc-900/50 to-zinc-950/80 p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Clock size={15} className="text-zinc-400" />
          <h3 className="text-[11px] font-bold tracking-widest uppercase text-zinc-200">
            Request Log
          </h3>
          <span className="text-[9px] font-mono text-zinc-600">
            ({Math.min(visibleCount, logs.length)} / {logs.length} entries shown)
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search prompts..."
              className="pl-8 pr-3 py-1.5 bg-zinc-900/50 border border-zinc-800/50 rounded-lg text-[11px] text-zinc-300 focus:outline-none focus:border-cyan-500/40 w-48 placeholder:text-zinc-700"
            />
          </div>
          {/* Filter */}
          <select
            value={filter}
            onChange={(e) => onFilterChange(e.target.value)}
            className="px-3 py-1.5 bg-zinc-900/50 border border-zinc-800/50 rounded-lg text-[11px] text-zinc-300 focus:outline-none focus:border-cyan-500/40 appearance-none cursor-pointer"
          >
            <option value="all">All Sources</option>
            <option value="redis_cache">Redis Cache</option>
            <option value="postgres_semantic_cache">Semantic Cache</option>
            <option value="llm_generated_hf_coder">Qwen Coder 7B</option>
            <option value="llm_generated_cloud_llama_70b">Llama 70B</option>
            <option value="llm_generated_cloud_llama_8b">Llama 8B</option>
            <option value="llm_generated_local_llama3">Local Llama</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[9px] font-mono uppercase tracking-widest text-zinc-500 border-b border-zinc-800/50">
              <th className="pb-3 pr-4 font-medium">Timestamp</th>
              <th className="pb-3 pr-4 font-medium">Prompt</th>
              <th className="pb-3 pr-4 font-medium">Source</th>
              <th className="pb-3 pr-4 font-medium text-right">Latency</th>
              <th className="pb-3 font-medium text-right">Similarity</th>
            </tr>
          </thead>
          <tbody>
            {logs.slice(0, visibleCount).map((log) => {
              const color = SOURCE_COLORS[log.source] || "#71717a";
              const isExpanded = expandedRow === log._id;
              return (
                <LogRow
                  key={log._id}
                  log={log}
                  color={color}
                  isExpanded={isExpanded}
                  onToggle={() => setExpandedRow(isExpanded ? null : log._id)}
                />
              );
            })}
          </tbody>
        </table>

        {logs.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <p className="text-zinc-600 text-xs font-mono">No matching telemetry entries</p>
          </div>
        )}

        {visibleCount < logs.length && (
          <div className="flex justify-center py-4 border-t border-zinc-800/50">
            <button
              onClick={() => setVisibleCount((prev) => prev + 50)}
              className="px-4 py-2 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg text-xs font-mono text-zinc-300 transition-colors"
            >
              Load More
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function LogRow({
  log,
  color,
  isExpanded,
  onToggle,
}: {
  log: TelemetryLog;
  color: string;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr
        className="border-b border-zinc-800/30 hover:bg-zinc-800 cursor-pointer transition-colors group"
        onClick={onToggle}
      >
        <td className="py-3 pr-4 text-[10px] text-zinc-500 group-hover:text-zinc-300 font-mono whitespace-nowrap">
          {new Date(log.timestamp).toLocaleString([], {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}
        </td>
        <td className="py-3 pr-4 text-[11px] text-zinc-300 group-hover:text-zinc-100 max-w-[300px] truncate">
          {log.prompt}
        </td>
        <td className="py-3 pr-4">
          <span
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] font-mono uppercase tracking-wider"
            style={{
              backgroundColor: `${color}15`,
              color,
              border: `1px solid ${color}30`,
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
            {SOURCE_LABELS[log.source] || log.source}
          </span>
        </td>
        <td className="py-3 pr-4 text-right text-[11px] font-mono text-zinc-400 group-hover:text-zinc-200">
          {log.latency_ms}
          <span className="text-zinc-600 group-hover:text-zinc-400 text-[9px] ml-0.5">ms</span>
        </td>
        <td className="py-3 text-right text-[11px] font-mono text-zinc-400 group-hover:text-zinc-200">
          {log.similarity_score
            ? `${(log.similarity_score * 100).toFixed(1)}%`
            : "—"}
        </td>
      </tr>

      {/* Expanded Row */}
      {isExpanded && (
        <tr>
          <td colSpan={5} className="px-4 py-4 bg-zinc-900/30">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-[9px] text-zinc-500 font-mono uppercase mb-2">
                  Full Prompt
                </div>
                <div className="text-[11px] text-zinc-300 bg-zinc-950/50 rounded-lg p-3 border border-zinc-800/30 max-h-[120px] overflow-y-auto custom-scrollbar">
                  {log.prompt}
                </div>
              </div>
              <div>
                <div className="text-[9px] text-zinc-500 font-mono uppercase mb-2">
                  Response Preview
                </div>
                <div className="text-[11px] text-zinc-400 bg-zinc-950/50 rounded-lg p-3 border border-zinc-800/30 max-h-[120px] overflow-y-auto custom-scrollbar">
                  {log.response.slice(0, 500)}
                  {log.response.length > 500 ? "..." : ""}
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
