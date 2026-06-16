import { Database, Zap, Cloud, Server } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface TelemetryLog {
  _id: string;
  prompt: string;
  response: string;
  source: string;
  latency_ms: number;
  similarity_score?: number;
  timestamp: string;
}

export interface TelemetryStats {
  totalRequests: number;
  avgLatency: number;
  cacheHitRate: number;
  sourceDistribution: { _id: string; count: number; avgLatency: number }[];
  latencyOverTime: {
    source: string;
    latency_ms: number;
    timestamp: string;
    similarity_score?: number;
  }[];
  hourlyVolume: { _id: string; count: number; avgLatency: number }[];
}

export const SOURCE_COLORS: Record<string, string> = {
  redis_cache: "#10b981",
  postgres_semantic_cache: "#06b6d4",
  llm_generated_hf_coder: "#3b82f6",
  llm_generated_cloud_llama_70b: "#8b5cf6",
  llm_generated_cloud_llama_8b: "#f59e0b",
  llm_generated_local_llama3: "#ec4899",
};

export const SOURCE_LABELS: Record<string, string> = {
  redis_cache: "L1 Redis Cache",
  postgres_semantic_cache: "L2 Semantic Cache",
  llm_generated_hf_coder: "Qwen 2.5 Coder 7B (HF)",
  llm_generated_cloud_llama_70b: "Llama 3.3 70B (Groq)",
  llm_generated_cloud_llama_8b: "Llama 3.1 8B (Groq)",
  llm_generated_local_llama3: "Llama 3.2 (Local)",
};

export const SOURCE_ICONS: Record<string, LucideIcon> = {
  redis_cache: Zap,
  postgres_semantic_cache: Database,
  llm_generated_hf_coder: Cloud,
  llm_generated_cloud_llama_70b: Cloud,
  llm_generated_cloud_llama_8b: Cloud,
  llm_generated_local_llama3: Server,
};

export const TOOLTIP_STYLE = {
  backgroundColor: "#18181b",
  border: "1px solid #27272a",
  borderRadius: "12px",
  fontSize: "11px",
  color: "#e4e4e7",
} as const;
