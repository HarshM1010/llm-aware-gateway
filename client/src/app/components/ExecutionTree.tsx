"use client";

import { motion } from "framer-motion";
import {
  ShieldCheck,
  Zap,
  Layers,
  Database,
  BrainCircuit,
  Cloud,
  Server,
  ArrowDownRight,
  CircleDot,
} from "lucide-react";

type NodeState = "idle" | "evaluating" | "hit" | "miss" | "active";


const LLM_MODELS = [
  {
    id: "hf_coder",
    label: "Qwen 2.5 Coder 7B",
    sub: "HF Inference — Code",
    icon: Cloud,
  },
  {
    id: "cloud_llama_70b",
    label: "Llama 3.3 70B",
    sub: "Groq Cloud — Versatile",
    icon: Cloud,
  },
  {
    id: "cloud_llama_8b",
    label: "Llama 3.1 8B",
    sub: "Groq Cloud — Instant",
    icon: Cloud,
  },
  {
    id: "local_llama3",
    label: "Llama 3.2",
    sub: "Ollama — Local",
    icon: Server,
  },
];

const TREE_STAGES = [
  {
    id: "gateway",
    label: "API Gateway",
    sub: "Zod Validate + Sliding Window Rate Limit",
    icon: ShieldCheck,
  },
  {
    id: "l1",
    label: "L1 Redis Cache",
    sub: "SHA-256 Hash → Exact Match",
    icon: Zap,
  },
  {
    id: "embedder",
    label: "Vector Embedder",
    sub: "BAAI/bge-small-en-v1.5 (384d)",
    icon: Layers,
  },
  {
    id: "l2",
    label: "L2 Semantic Cache",
    sub: "pgvector HNSW Cosine Search",
    icon: Database,
  },
  {
    id: "llm",
    label: "LLM Router",
    sub: "Priority Fallback Chain",
    icon: BrainCircuit,
  },
];

function TreeNode({
  label,
  sub,
  icon: Icon,
  state,
  isTerminal,
  terminalLabel,
}: {
  label: string;
  sub: string;
  icon: React.ElementType;
  state: NodeState;
  isTerminal?: boolean;
  terminalLabel?: string;
}) {
  const styles: Record<NodeState, string> = {
    idle: "bg-zinc-900/30 border-zinc-800/60 text-zinc-600",
    evaluating:
      "bg-cyan-950/20 border-cyan-500/40 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.1)]",
    active:
      "bg-cyan-950/20 border-cyan-500/40 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.1)]",
    hit: "bg-emerald-950/20 border-emerald-500/40 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)]",
    miss: "bg-zinc-900/20 border-zinc-800/40 text-zinc-600 opacity-50",
  };

  const statusDot: Record<NodeState, string> = {
    idle: "bg-zinc-700",
    evaluating: "bg-cyan-400 animate-pulse",
    active: "bg-cyan-400",
    hit: "bg-emerald-400",
    miss: "bg-red-400/60",
  };

  const statusLabel: Record<NodeState, string> = {
    idle: "STANDBY",
    evaluating: "CHECKING...",
    active: "EXECUTED",
    hit: "HIT",
    miss: "MISS",
  };

  return (
    <motion.div
      initial={{ opacity: 0.6 }}
      animate={{ opacity: 1 }}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-sm transition-all duration-500 ${styles[state]}`}
    >
      <Icon size={16} className="shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-bold tracking-wider uppercase truncate">
          {label}
        </div>
        <div className="text-[9px] font-mono opacity-60 truncate">
          {terminalLabel || sub}
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <div className={`w-1.5 h-1.5 rounded-full ${statusDot[state]}`} />
        <span className="text-[8px] font-mono tracking-widest uppercase opacity-80">
          {statusLabel[state]}
        </span>
      </div>
    </motion.div>
  );
}

function LLMBranchNode({
  label,
  sub,
  icon: Icon,
  state,
}: {
  label: string;
  sub: string;
  icon: React.ElementType;
  state: NodeState;
}) {
  const styles: Record<NodeState, string> = {
    idle: "bg-zinc-900/20 border-zinc-800/40 text-zinc-600",
    evaluating: "bg-amber-950/20 border-amber-500/30 text-amber-400",
    active: "bg-cyan-950/20 border-cyan-500/30 text-cyan-400",
    hit: "bg-emerald-950/20 border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]",
    miss: "bg-red-950/10 border-red-500/20 text-red-400/70",
  };

  const statusText: Record<NodeState, string> = {
    idle: "",
    evaluating: "TRYING...",
    active: "ACTIVE",
    hit: "SELECTED",
    miss: "FAILED",
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border text-[10px] flex-1 transition-all ${styles[state]}`}
    >
      <Icon size={12} className="shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="font-bold tracking-wider uppercase truncate">
          {label}
        </div>
        <div className="text-[8px] font-mono opacity-50">{sub}</div>
      </div>
      {statusText[state] && (
        <span className="text-[7px] font-mono tracking-widest uppercase opacity-80 shrink-0">
          {statusText[state]}
        </span>
      )}
    </motion.div>
  );
}

interface ExecutionTreeProps {
  source: string;
  activeModel: string;
  failedModels: string[];
}

export function ExecutionTree({
  source,
  activeModel,
  failedModels,
}: ExecutionTreeProps) {
  const isStarted = source !== "WAITING...";

  const l1Hit = source === "redis_cache";
  const l1Miss = source === "postgres_semantic_cache" || source.includes("llm");

  const l2Hit = source === "postgres_semantic_cache";
  const l2Miss = source.includes("llm");

  const llmActive = source.includes("llm");

  const getState = (id: string): NodeState => {
    switch (id) {
      case "gateway":
        return isStarted ? "active" : "idle";
      case "l1":
        return l1Hit
          ? "hit"
          : l1Miss
            ? "miss"
            : isStarted
              ? "evaluating"
              : "idle";
      case "embedder":
        return l1Miss ? "active" : "idle";
      case "l2":
        return l2Hit ? "hit" : l2Miss ? "miss" : l1Miss ? "evaluating" : "idle";
      case "llm":
        return llmActive ? "active" : "idle";
      default:
        return "idle";
    }
  };

  const getModelState = (modelId: string): NodeState => {
    if (activeModel === modelId) return "hit";
    if (failedModels.includes(modelId)) return "miss";
    if (llmActive && !activeModel) return "evaluating";
    return "idle";
  };

  const pathLit = {
    gatewayToL1: isStarted,
    l1ToEmbedder: l1Miss,
    embedderToL2: l1Miss,
    l2ToLlm: l2Miss,
  };

  const connectorKeys = [
    "gatewayToL1",
    "l1ToEmbedder",
    "embedderToL2",
    "l2ToLlm",
  ] as const;

  return (
    <div className="flex flex-col gap-0 w-full py-2">
      {TREE_STAGES.map((stage, i) => {
        const state = getState(stage.id);
        const isTerminal =
          (stage.id === "l1" && l1Hit) || (stage.id === "l2" && l2Hit);
        const showConnector = i < TREE_STAGES.length - 1 && !isTerminal;
        const connectorLit = connectorKeys[i]
          ? pathLit[connectorKeys[i]]
          : false;

        return (
          <div key={stage.id}>
            <TreeNode
              label={stage.label}
              sub={stage.sub}
              icon={stage.icon}
              state={state}
              isTerminal={isTerminal}
              terminalLabel={
                l1Hit && stage.id === "l1"
                  ? "SERVED FROM REDIS"
                  : l2Hit && stage.id === "l2"
                    ? "SERVED FROM PGVECTOR"
                    : undefined
              }
            />

            {/* LLM Branch Tree */}
            {stage.id === "llm" && llmActive && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ duration: 0.4 }}
                className="ml-8 mt-1 mb-2 flex flex-col gap-1"
              >
                {LLM_MODELS.map((model) => {
                  const modelState = getModelState(model.id);
                  return (
                    <div
                      key={model.id}
                      className="flex items-center gap-2 ml-2"
                    >
                      <ArrowDownRight
                        size={12}
                        className={
                          modelState === "hit"
                            ? "text-emerald-500"
                            : modelState === "miss"
                              ? "text-red-400/60"
                              : "text-zinc-700"
                        }
                      />
                      <LLMBranchNode
                        label={model.label}
                        sub={model.sub}
                        icon={model.icon}
                        state={modelState}
                      />
                    </div>
                  );
                })}
              </motion.div>
            )}

            {/* Connector */}
            {showConnector && (
              <div className="flex justify-center">
                <motion.div
                  className="w-[2px] h-5 rounded-full"
                  initial={{ scaleY: 0 }}
                  animate={{
                    scaleY: 1,
                    backgroundColor: connectorLit ? "#06b6d4" : "#27272a",
                  }}
                  transition={{ duration: 0.3, delay: i * 0.15 }}
                  style={{ originY: 0 }}
                />
              </div>
            )}

            {/* Terminal indicator */}
            {isTerminal && (
              <div className="flex justify-center mt-2">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-mono uppercase tracking-widest"
                >
                  <CircleDot size={10} />
                  Response Served
                </motion.div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
