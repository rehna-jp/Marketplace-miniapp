"use client";

import { useState, useEffect } from "react";
import { useBazaarOrders, useBazaarAgents } from "@/features/bazaar/hooks/use-bazaar-data";
import { MOCK_AGENTS, formatEth, timeAgo } from "@/features/bazaar/mock-data";
import { ServiceBadge } from "@/features/bazaar/components/service-badge";
import { OrderStatusBadge } from "@/features/bazaar/components/status-dot";
import type { Agent, Order } from "@/features/bazaar/types";

function formatTxHash(hash: string): string {
  if (!hash || hash.length < 14) return hash;
  return `${hash.slice(0, 8)}...${hash.slice(-6)}`;
}

function TxLink({ hash }: { hash: string }) {
  if (!hash) return null;
  return (
    <a
      href={`https://sepolia.basescan.org/tx/${hash}`}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="text-[10px] font-mono text-slate-600 hover:text-violet-400 transition-colors"
    >
      {formatTxHash(hash)}
    </a>
  );
}

function OrderCard({
  order,
  agentById,
  isNew,
}: {
  order: Order;
  agentById: Map<string, Agent>;
  isNew: boolean;
}) {
  const buyer = agentById.get(order.buyerId);
  const seller = agentById.get(order.sellerId);
  const buyerName = buyer?.name ?? order.buyerId.slice(0, 10);
  const sellerName = seller?.name ?? order.sellerId.slice(0, 10);

  return (
    <div
      className={`rounded-xl border p-4 transition-all ${
        isNew
          ? "bg-violet-500/10 border-violet-500/30"
          : order.status === "SETTLED"
          ? "bg-emerald-500/5 border-emerald-500/15"
          : order.status === "PENDING"
          ? "bg-yellow-500/5 border-yellow-500/15"
          : order.status === "ESCROWED"
          ? "bg-sky-500/5 border-sky-500/15"
          : "bg-white/3 border-white/8"
      }`}
    >
      {/* Header: Status + time */}
      <div className="flex items-center justify-between mb-3">
        <OrderStatusBadge status={order.status} />
        <span className="text-[10px] text-slate-500 font-mono">{timeAgo(order.createdAt)}</span>
      </div>

      {/* Agent flow */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shrink-0">
            <span className="text-[9px] font-bold text-white">{buyerName.slice(0, 1)}</span>
          </div>
          <span className="text-xs font-mono text-slate-300 truncate">{buyerName}</span>
        </div>

        <div className="shrink-0 flex items-center gap-0.5">
          <div className="w-6 h-px bg-gradient-to-r from-sky-400/50 to-violet-400/50" />
          <div className={`w-1.5 h-1.5 rounded-full ${
            order.status === "SETTLED" ? "bg-emerald-400" :
            order.status === "PENDING" ? "bg-yellow-400 animate-pulse" :
            "bg-violet-400 animate-pulse"
          }`} />
          <div className="w-6 h-px bg-gradient-to-r from-violet-400/50 to-amber-400/50" />
        </div>

        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0">
            <span className="text-[9px] font-bold text-white">{sellerName.slice(0, 1)}</span>
          </div>
          <span className="text-xs font-mono text-slate-300 truncate">{sellerName}</span>
        </div>

        <div className="ml-auto shrink-0">
          <span className="text-sm font-mono font-bold text-amber-400">{formatEth(order.priceEth)}</span>
        </div>
      </div>

      {/* Service type + tx hash */}
      <div className="flex items-center justify-between">
        <ServiceBadge type={order.serviceType} />
        <TxLink hash={order.txHash} />
      </div>

      {/* Escrow info if present */}
      {order.escrowTxHash && (
        <div className="mt-2 pt-2 border-t border-white/5">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-600 font-mono uppercase tracking-wide">Escrow</span>
            <div className="flex-1 h-px bg-white/5" />
            <TxLink hash={order.escrowTxHash} />
          </div>
        </div>
      )}
    </div>
  );
}

export function OrderFeedTab() {
  const { data: ordersData, isLoading, dataUpdatedAt } = useBazaarOrders();
  const { data: agentsData } = useBazaarAgents();

  const [newOrderId, setNewOrderId] = useState<string | null>(null);
  const [prevOrderCount, setPrevOrderCount] = useState(0);

  const rawOrders = ordersData?.orders ?? [];
  const allAgents: Agent[] = agentsData?.agents ?? MOCK_AGENTS;
  const isMock = ordersData?.isMock ?? true;

  const agentById = new Map(allAgents.map((a) => [a.id, a]));

  // Detect new orders arriving from onchain polling
  useEffect(() => {
    if (rawOrders.length > prevOrderCount && prevOrderCount > 0) {
      const newest = rawOrders[0];
      if (newest) {
        setNewOrderId(newest.id);
        setTimeout(() => setNewOrderId(null), 2500);
      }
    }
    setPrevOrderCount(rawOrders.length);
  }, [rawOrders.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalVolume = rawOrders.reduce(
    (sum, o) => sum + (o.status === "SETTLED" ? o.priceEth : 0),
    0
  );
  const settledCount = rawOrders.filter((o) => o.status === "SETTLED").length;
  const activeCount = rawOrders.filter(
    (o) => o.status === "PENDING" || o.status === "ESCROWED" || o.status === "DELIVERED"
  ).length;

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : null;

  return (
    <div className="h-full flex flex-col">
      {/* Live stats */}
      <div className="shrink-0 px-4 py-3 border-b border-white/5 bg-black/20">
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center">
            <div className="text-xs text-slate-500 uppercase tracking-wide">Active</div>
            <div className="flex items-center justify-center gap-1.5 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
              <div className="text-base font-mono font-bold text-white">{activeCount}</div>
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-slate-500 uppercase tracking-wide">Settled</div>
            <div className="text-base font-mono font-bold text-emerald-400">{settledCount}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-slate-500 uppercase tracking-wide">Settled Ξ</div>
            <div className="text-base font-mono font-bold text-amber-400">{totalVolume.toFixed(3)}</div>
          </div>
        </div>
      </div>

      {/* Live indicator */}
      <div className="shrink-0 px-4 py-2 border-b border-white/5 flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${isMock ? "bg-yellow-400" : "bg-emerald-400 animate-pulse"}`} />
        <span className={`text-[10px] font-mono uppercase tracking-widest ${isMock ? "text-yellow-400/70" : "text-emerald-400"}`}>
          {isMock ? "Demo Feed" : "Live — Base Sepolia"}
        </span>
        {lastUpdated && !isMock && (
          <span className="text-[10px] text-slate-600 ml-auto font-mono">
            {lastUpdated}
          </span>
        )}
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {rawOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                agentById={agentById}
                isNew={order.id === newOrderId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
