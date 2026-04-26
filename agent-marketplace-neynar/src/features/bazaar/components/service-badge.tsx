"use client";

import { SERVICE_TYPE_LABELS, SERVICE_TYPE_COLORS } from "@/features/bazaar/mock-data";
import type { ServiceType } from "@/features/bazaar/types";

interface ServiceBadgeProps {
  type: ServiceType;
  size?: "sm" | "md";
}

export function ServiceBadge({ type, size = "sm" }: ServiceBadgeProps) {
  const label = SERVICE_TYPE_LABELS[type] ?? type;
  const color = SERVICE_TYPE_COLORS[type] ?? "text-slate-400 bg-slate-400/10 border-slate-400/20";
  const sizeClass = size === "sm" ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-1";

  return (
    <span
      className={`inline-flex items-center rounded border font-mono font-medium uppercase tracking-wide ${color} ${sizeClass}`}
    >
      {label}
    </span>
  );
}
