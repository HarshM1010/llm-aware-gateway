"use client";

import { useState, FormEvent, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Terminal,
  Database,
  Cpu,
  Loader2,
  Timer,
  Fingerprint,
  Layers,
  GitMerge,
  Activity,
  Send,
  ChevronRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";

import { StatusPill } from "./components/StatusPill";
import { MetricCard } from "./components/MetricCard";
import { SimilarityGauge } from "./components/SimilarityGauge";
import { ExecutionTree } from "./components/ExecutionTree";
import { MarkdownRenderer } from "./components/MarkdownRenderer";
import dotenv from "dotenv";
import { BootScreen } from "./components/BootScreen";
dotenv.config();

let hasAppBooted = false;

export default function Dashboard() {
  const [isBooting, setIsBooting] = useState(!hasAppBooted);

  const handleBootComplete = () => {
    hasAppBooted = true;
    setIsBooting(false);
  };

  const [prompt, setPrompt] = useState("");
  const [output, setOutput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Telemetry state
  const [source, setSource] = useState<string>("WAITING...");
  const [ttft, setTtft] = useState<number>(0);
  const [velocity, setVelocity] = useState<number>(0);
  const [similarity, setSimilarity] = useState<number>(0);
  const [vector, setVector] = useState<number[]>([]);
  const [activeModel, setActiveModel] = useState<string>("");
  const [failedModels, setFailedModels] = useState<string[]>([]);

  // Sparkline data
  const [sparkData, setSparkData] = useState<{ t: number; v: number }[]>([]);

  const outputEndRef = useRef<HTMLDivElement>(null);

  const API_URL = process.env.CLIENT_ENV === "production"
        ? "https://llm-aware-gateway.onrender.com"
        : "http://localhost:3000";

  useEffect(() => {
    outputEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [output]);

  const handleExecute = async (e: FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setOutput("");
    setSource("ROUTING...");
    setTtft(0);
    setVelocity(0);
    setSimilarity(0);
    setVector([]);
    setActiveModel("");
    setFailedModels([]);
    setSparkData([]);

    const reqStartTime = Date.now();
    let tokenCount = 0;

    try {
      const res = await fetch(
        `${API_URL}/api/generate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt }),
        },
      );

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        if (errorData && errorData.error) {
          let errorMsg = `\n\n[SYS_ERROR] ${errorData.error}`;
          if (errorData.details && Array.isArray(errorData.details)) {
            errorData.details.forEach((err: any) => {
              errorMsg += `\n- ${err.message}`;
            });
          }
          throw new Error(errorMsg);
        }
        throw new Error("\n\n[SYS_ERROR] Gateway failed to respond.");
      }
      const reader = res.body?.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith("data: ")) {
              const dataStr = trimmedLine.slice(6);
              if (dataStr === "[DONE]") {
                setIsGenerating(false);
                break;
              }
              try {
                const parsed = JSON.parse(dataStr);

                if (parsed.event === "metadata") {
                  setTtft(Date.now() - reqStartTime);
                  setSource(parsed.source);
                  if (parsed.similarity) setSimilarity(parsed.similarity);
                  if (parsed.vector) setVector(parsed.vector);

                  // Extract model name from source
                  if (parsed.source?.startsWith("llm_generated_")) {
                    setActiveModel(parsed.source.replace("llm_generated_", ""));
                  }
                } else if (parsed.event === "fallback_triggered") {
                  if (parsed.failed_model) {
                    setFailedModels((prev) => [...prev, parsed.failed_model]);
                  }
                } else if (parsed.text) {
                  setOutput((prev) => prev + parsed.text);
                  tokenCount++;
                  const elapsed = (Date.now() - reqStartTime) / 1000;
                  if (elapsed > 0) {
                    const vel = Math.round(tokenCount / elapsed);
                    setVelocity(vel);
                    setSparkData((prev) => [
                      ...prev,
                      { t: Math.round(elapsed * 100) / 100, v: vel },
                    ]);
                  }
                }
              } catch {
                // skip parse errors
              }
            }
          }
        }
      }
    } catch (error: any) {
      console.error(error);
      const msg = error.message || "\n\n[SYS_ERROR] Connection to Gateway Failed.";
      setOutput((prev) => prev + (msg.includes("[SYS_ERROR]") ? msg : `\n\n[SYS_ERROR] ${msg}`));
    } finally {
      setIsGenerating(false);
    }
  };

  const isCacheHit = source.includes("cache");
  const displaySource =
    source === "redis_cache"
      ? "L1: Redis Exact"
      : source === "postgres_semantic_cache"
        ? "L2: pgvector Semantic"
        : source.startsWith("llm_generated_")
          ? "LLM: " + source.replace("llm_generated_", "")
          : source;

  if (isBooting) {
    return <BootScreen onBootComplete={handleBootComplete} />;
  }

  return (
    <div className="h-[calc(100vh-60px)] overflow-hidden bg-zinc-950 text-zinc-50 font-sans selection:bg-cyan-500/30">
      {/* MAIN LAYOUT */}
      <main className="max-w-450 mx-auto p-4 grid grid-cols-1 lg:grid-cols-11 gap-4 h-full overflow-hidden">
        {/* LEFT */}
        <section className="col-span-1 lg:col-span-3 flex flex-col h-full overflow-hidden">
          <div className="flex-1 rounded-2xl border border-zinc-800/60 bg-linear-to-b from-zinc-900/50 to-zinc-950/80 p-5 flex flex-col relative overflow-hidden">
            <div className="flex items-center gap-2 mb-4 z-10">
              <GitMerge size={15} className="text-cyan-400" />
              <h2 className="text-[11px] font-bold tracking-widest uppercase text-zinc-200">
                Execution Pipeline
              </h2>
            </div>
            <div className="flex-1 w-full relative overflow-y-auto custom-scrollbar">
              <ExecutionTree
                source={source}
                activeModel={activeModel}
                failedModels={failedModels}
              />
            </div>
          </div>
        </section>

        {/* CENTER: PLAYGROUND*/}
        <section className="col-span-1 lg:col-span-5 flex flex-col gap-4 h-full overflow-hidden">
          {/* Prompt */}
          <form
            onSubmit={handleExecute}
            className="rounded-2xl border bg-zinc-900/40 shadow-2xl flex flex-col transition-all border-cyan-500/40 focus-within:shadow-cyan-500/5 shrink-0"
          >
            <div className="flex items-center px-5 py-4 gap-3">
              <ChevronRight size={16} className="text-cyan-500 shrink-0" />
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isGenerating}
                placeholder="Enter your prompt here..."
                className="w-full bg-transparent text-sm focus:outline-none text-zinc-100 placeholder:text-zinc-600 font-medium disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={isGenerating || !prompt.trim()}
                className="cursor-pointer ml-2 px-5 py-2.5 bg-linear-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:from-zinc-800 disabled:to-zinc-800 disabled:text-zinc-500 text-white text-xs font-bold tracking-widest rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-cyan-500/10 shrink-0"
              >
                {isGenerating ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Send size={14} />
                )}
                {isGenerating ? "..." : "EXEC"}
              </button>
            </div>

            {/* Status Bar */}
            <div className="flex items-center gap-2 px-5 py-2.5 bg-zinc-950/50 border-t border-zinc-800/30 text-[10px] font-mono uppercase tracking-wider text-zinc-500 overflow-x-auto rounded-b-2xl">
              <StatusPill
                icon={Database}
                label={isCacheHit ? displaySource : "Cache"}
                active={isCacheHit}
                color="emerald"
              />
              <StatusPill
                icon={Cpu}
                label={source.includes("llm") ? displaySource : "LLM"}
                active={source.includes("llm")}
                color="cyan"
              />
              <StatusPill
                icon={Activity}
                label={`${velocity} t/s`}
                active={velocity > 0}
                color="amber"
              />
            </div>
          </form>

          {/* Output */}
          <div className="flex-1 min-h-0 rounded-2xl border border-zinc-800/40 bg-zinc-900/20 p-6 overflow-y-auto relative font-sans text-sm text-zinc-300 leading-relaxed shadow-inner custom-scrollbar">
            {!output && !isGenerating ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Terminal size={32} className="text-zinc-700 mx-auto mb-3" />
                  <p className="text-zinc-600 font-mono text-xs">
                    Response will appear here...
                  </p>
                </div>
              </div>
            ) : (
              <div className="prose prose-invert prose-zinc max-w-none text-zinc-300">
                <MarkdownRenderer content={output} />
                {isGenerating && (
                  <motion.span
                    className="inline-block w-2 h-4 ml-1 bg-cyan-500 align-middle rounded-sm"
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                  />
                )}
              </div>
            )}
            <div ref={outputEndRef} />
          </div>
        </section>

        {/* RIGHT: METRICS */}
        <section className="col-span-1 lg:col-span-3 flex flex-col gap-4 h-full overflow-hidden">
          {/* Latency & Velocity */}
          <div className="flex-5 rounded-2xl border border-zinc-800/60 bg-linear-to-b from-zinc-900/50 to-zinc-950/80 p-3 flex flex-col min-h-0">
            <div className="flex items-center gap-2 mb-4">
              <Timer size={15} className="text-emerald-400" />
              <h2 className="text-[11px] font-bold tracking-widest uppercase text-zinc-200">
                Performance
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <MetricCard label="TTFT" value={ttft} unit="ms" color="cyan" />
              <MetricCard
                label="Throughput"
                value={velocity}
                unit="t/s"
                color="emerald"
              />
            </div>

            {/* Sparkline */}
            <div className="flex-1 rounded-xl border border-zinc-800/50 bg-zinc-950/50 p-3 min-h-20">
              <div className="text-[9px] text-zinc-500 font-mono uppercase mb-2">
                Token Velocity (real-time)
              </div>
              {sparkData.length > 1 ? (
                <ResponsiveContainer width="100%" height="85%">
                  <AreaChart data={sparkData}>
                    <defs>
                      <linearGradient
                        id="sparkGrad"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#06b6d4"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="100%"
                          stopColor="#06b6d4"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="t" hide />
                    <YAxis hide domain={["auto", "auto"]} />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: "#18181b",
                        border: "1px solid #27272a",
                        borderRadius: "8px",
                        fontSize: "10px",
                        color: "#a1a1aa",
                      }}
                      labelFormatter={(v: any) => `${v}s`}
                      formatter={(v: any) => [`${v} t/s`, "Velocity"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="v"
                      stroke="#06b6d4"
                      strokeWidth={2}
                      fill="url(#sparkGrad)"
                      dot={false}
                      animationDuration={300}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[85%] text-zinc-700 text-[10px] font-mono">
                  Waiting for stream data...
                </div>
              )}
            </div>
          </div>

          {/* Semantic Engine */}
          <div className="flex-5 rounded-2xl border border-zinc-800/60 bg-linear-to-b from-zinc-900/50 to-zinc-950/80 p-3 flex flex-col min-h-0">
            <div className="flex items-center gap-2 mb-3">
              <Fingerprint size={15} className="text-cyan-400" />
              <h2 className="text-[11px] font-bold tracking-widest uppercase text-zinc-200">
                Vector Engine
              </h2>
            </div>

            <div className="flex flex-col gap-3 h-full">
              {/* Similarity Gauge */}
              <SimilarityGauge similarity={similarity} />

              {/* Embedding Preview */}
              <div className="flex-1 rounded-xl border border-zinc-800/50 bg-zinc-950/50 p-4 overflow-hidden relative flex flex-col">
                <div className="text-[9px] text-zinc-500 font-mono uppercase mb-3 flex items-center justify-between">
                  <span>EMBEDDING DIM[384]</span>
                  <Layers size={12} />
                </div>

                {/* Mini heatmap visualization */}
                {vector.length > 0 ? (
                  <div className="flex-1 overflow-hidden">
                    <div className="flex flex-wrap gap-0.5 mb-3">
                      {vector.slice(0, 60).map((v, i) => (
                        <div
                          key={i}
                          className="w-1.5 h-1.5 rounded-[1px] transition-all"
                          style={{
                            backgroundColor: `hsl(${180 + v * 60}, 70%, ${40 + Math.abs(v) * 30}%)`,
                            opacity: 0.4 + Math.abs(v) * 0.6,
                          }}
                          title={`dim[${i}]: ${v.toFixed(4)}`}
                        />
                      ))}
                    </div>
                    <div className="text-[10px] text-zinc-600 font-mono break-all leading-relaxed overflow-y-auto custom-scrollbar max-h-[80px]">
                      [{vector.map((v) => v.toFixed(3)).join(", ")}...]
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-zinc-700 text-[10px] font-mono">
                    Awaiting embedding generation
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
