import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  color: "cyan" | "emerald" | "amber" | "violet";
  suffix: string;
}

const colorMap = {
  cyan: { text: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
  emerald: { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  amber: { text: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  violet: { text: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20" },
};

export function StatCard({ label, value, icon: Icon, color, suffix }: StatCardProps) {
  const c = colorMap[color];

  return (
    <div className="rounded-2xl border border-zinc-800/60 bg-gradient-to-b from-zinc-900/50 to-zinc-950/80 p-5 flex items-start gap-4">
      <div className={`p-2.5 rounded-xl ${c.bg} ${c.border} border`}>
        <Icon size={18} className={c.text} />
      </div>
      <div>
        <div className="text-[9px] text-zinc-500 font-mono uppercase tracking-widest mb-1">
          {label}
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className={`text-3xl font-bold ${c.text}`}>
            {value.toLocaleString()}
          </span>
          {suffix && (
            <span className="text-[10px] text-zinc-500 font-mono uppercase">{suffix}</span>
          )}
        </div>
      </div>
    </div>
  );
}
