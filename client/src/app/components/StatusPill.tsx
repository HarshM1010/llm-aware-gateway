import { LucideIcon } from "lucide-react";

interface StatusPillProps {
  icon: LucideIcon;
  label: string;
  active: boolean;
  color: "cyan" | "emerald" | "amber";
}

export function StatusPill({
  icon: Icon,
  label,
  active,
  color,
}: StatusPillProps) {
  const colors = {
    cyan: active ? "text-cyan-400 border-cyan-500/30 bg-cyan-500/5" : "",
    emerald: active
      ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/5"
      : "",
    amber: active ? "text-amber-400 border-amber-500/30 bg-amber-500/5" : "",
  };

  return (
    <span
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all ${
        active ? colors[color] : "border-zinc-800/50 bg-zinc-900/30"
      }`}
    >
      <Icon size={11} />
      {label}
    </span>
  );
}
