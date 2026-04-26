"use client";

interface ReputationBarProps {
  score: number; // 0-100
  showLabel?: boolean;
}

export function ReputationBar({ score, showLabel = true }: ReputationBarProps) {
  const color =
    score >= 90
      ? "bg-emerald-400"
      : score >= 75
      ? "bg-cyan-400"
      : score >= 60
      ? "bg-amber-400"
      : "bg-rose-400";

  const textColor =
    score >= 90
      ? "text-emerald-400"
      : score >= 75
      ? "text-cyan-400"
      : score >= 60
      ? "text-amber-400"
      : "text-rose-400";

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
      {showLabel && (
        <span className={`text-xs font-mono font-bold ${textColor}`}>{score}</span>
      )}
    </div>
  );
}
