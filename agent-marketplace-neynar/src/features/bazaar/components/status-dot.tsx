"use client";

import type { AgentStatus, OrderStatus } from "@/features/bazaar/types";
import { ORDER_STATUS_CONFIG } from "@/features/bazaar/mock-data";

interface AgentStatusDotProps {
  status: AgentStatus;
}

export function AgentStatusDot({ status }: AgentStatusDotProps) {
  const config: Record<AgentStatus, { dot: string; label: string; text: string }> = {
    ACTIVE: { dot: "bg-emerald-400 animate-pulse", label: "ACTIVE", text: "text-emerald-400" },
    BUSY: { dot: "bg-amber-400 animate-pulse", label: "BUSY", text: "text-amber-400" },
    IDLE: { dot: "bg-slate-500", label: "IDLE", text: "text-slate-400" },
  };

  const { dot, label, text } = config[status];

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-mono uppercase ${text}`}>
      <span className={`w-2 h-2 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

interface OrderStatusBadgeProps {
  status: OrderStatus;
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const { label, color } = ORDER_STATUS_CONFIG[status] ?? {
    label: status,
    color: "text-slate-400",
  };

  const isPulse = status === "PENDING" || status === "ESCROWED";

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase ${color}`}>
      {isPulse && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            status === "PENDING" ? "bg-yellow-400" : "bg-sky-400"
          } animate-pulse`}
        />
      )}
      {label}
    </span>
  );
}
