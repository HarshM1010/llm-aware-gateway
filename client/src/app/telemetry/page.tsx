"use client";

import { useState, useEffect, useMemo, lazy, Suspense, useDeferredValue, useTransition } from "react";
import {
  BarChart3, Clock, Zap, Activity, RefreshCw, Layers, AlertCircle,
} from "lucide-react";
import type { TelemetryStats, TelemetryLog } from "./constants";
import { SOURCE_LABELS, SOURCE_COLORS } from "./constants";
import { StatCard } from "./components/StatCard";
import { SourceBreakdown } from "./components/SourceBreakdown";
import { RequestLogTable } from "./components/RequestLogTable";
 

// Lazy-load heavy chart components — they pull in recharts which is large
const LatencyChart = lazy(() =>
  import("./components/LatencyChart").then((m) => ({ default: m.LatencyChart }))
);
const SourcePieChart = lazy(() =>
  import("./components/SourcePieChart").then((m) => ({ default: m.SourcePieChart }))
);
const HourlyVolumeChart = lazy(() =>
  import("./components/HourlyVolumeChart").then((m) => ({ default: m.HourlyVolumeChart }))
);

function ChartSkeleton({ height = "h-[250px]" }: { height?: string }) {
  return (
    <div className={`rounded-2xl border border-zinc-800/60 bg-zinc-900/30 p-5 ${height} animate-pulse`}>
      <div className="h-3 w-32 bg-zinc-800 rounded mb-4" />
      <div className="h-full bg-zinc-800/30 rounded-xl" />
    </div>
  );
}

export default function TelemetryPage() {
  const [stats, setStats] = useState<TelemetryStats | null>(null);
  const [logs, setLogs] = useState<TelemetryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // Defer filter/search values so typing doesn't block rendering
  const deferredFilter = useDeferredValue(filter);
  const deferredSearch = useDeferredValue(searchQuery);

  const fetchData = () => {
    setLoading(true);
    setError(null);
    startTransition(async () => {
      try {
        const [statsRes, logsRes] = await Promise.all([
          fetch(`${API_URL}/api/telemetry/stats`),
          fetch(`${API_URL}/api/telemetry`),
        ]);
        if (!statsRes.ok || !logsRes.ok) throw new Error("Failed to fetch telemetry data");
        setStats(await statsRes.json());
        setLogs(await logsRes.json());
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load telemetry");
      } finally {
        setLoading(false);
      }
    });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredLogs = useMemo(() => {
    let result = logs;
    if (deferredFilter !== "all") result = result.filter((l) => l.source === deferredFilter);
    if (deferredSearch.trim()) {
      const q = deferredSearch.toLowerCase();
      result = result.filter((l) => l.prompt.toLowerCase().includes(q));
    }
    return result;
  }, [logs, deferredFilter, deferredSearch]);

  // Pre-compute chart data
  const pieData = useMemo(() => {
    if (!stats) return [];
    return stats.sourceDistribution.map((s) => ({
      name: SOURCE_LABELS[s._id] || s._id,
      value: s.count,
      color: SOURCE_COLORS[s._id] || "#71717a",
    }));
  }, [stats]);

  const latencyTrend = useMemo(() => {
    if (!stats) return [];
    return stats.latencyOverTime.map((item) => ({
      time: new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      latency: item.latency_ms,
      source: SOURCE_LABELS[item.source] || item.source,
      color: SOURCE_COLORS[item.source] || "#71717a",
    }));
  }, [stats]);

  const volumeData = useMemo(() => {
    if (!stats) return [];
    return stats.hourlyVolume.map((h) => ({
      hour: h._id.split(" ")[1] || h._id,
      requests: h.count,
      avgLatency: Math.round(h.avgLatency),
    }));
  }, [stats]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-50 flex items-center justify-center">
        <RefreshCw size={24} className="text-cyan-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={40} className="text-red-500 mx-auto mb-4" />
          <p className="text-zinc-400 text-sm mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs font-mono transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-cyan-500/30">
      <main className="max-w-450 mx-auto p-4 pb-8 space-y-4">
        {/* PAGE HEADER */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <BarChart3 size={20} className="text-cyan-400" />
            <div>
              <h1 className="text-lg font-bold tracking-tight">Telemetry Dashboard</h1>
              <p className="text-[11px] text-zinc-500 font-mono">
                {stats?.totalRequests || 0} total requests logged
              </p>
            </div>
          </div>
          <button
            onClick={fetchData}
            disabled={isPending}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-xs font-mono text-zinc-400 hover:text-zinc-200 transition-all disabled:opacity-50"
          >
            <RefreshCw size={12} className={isPending ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* STAT CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Requests"
            value={stats?.totalRequests || 0}
            icon={Activity}
            color="cyan"
            suffix=""
          />
          <StatCard
            label="Avg Latency"
            value={Math.round(stats?.avgLatency || 0)}
            icon={Clock}
            color="emerald"
            suffix="ms"
          />
          <StatCard
            label="Cache Hit Rate"
            value={Math.round(stats?.cacheHitRate || 0)}
            icon={Zap}
            color="amber"
            suffix="%"
          />
          <StatCard
            label="Sources Active"
            value={stats?.sourceDistribution?.length || 0}
            icon={Layers}
            color="violet"
            suffix=""
          />
        </div>

        {/* CHARTS ROW — lazy loaded */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Suspense fallback={<ChartSkeleton />}>
            <LatencyChart data={latencyTrend} />
          </Suspense>
          <Suspense fallback={<ChartSkeleton />}>
            <SourcePieChart data={pieData} />
          </Suspense>
        </div>

        {/* HOURLY VOLUME — lazy loaded */}
        <Suspense fallback={<ChartSkeleton height="h-[200px]" />}>
          <HourlyVolumeChart data={volumeData} />
        </Suspense>

        {/* SOURCE BREAKDOWN CARDS */}
        {stats && (
          <SourceBreakdown
            sourceDistribution={stats.sourceDistribution}
            totalRequests={stats.totalRequests}
          />
        )}

        {/* REQUEST LOG TABLE */}
        <RequestLogTable
          logs={filteredLogs}
          filter={filter}
          onFilterChange={setFilter}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </main>
    </div>
  );
}