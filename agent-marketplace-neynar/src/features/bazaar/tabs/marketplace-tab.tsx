"use client";

import { useState } from "react";
import { useBazaarListings, useBazaarAgents } from "@/features/bazaar/hooks/use-bazaar-data";
import { MOCK_AGENTS, formatEth, SERVICE_TYPE_LABELS } from "@/features/bazaar/mock-data";
import { ServiceBadge } from "@/features/bazaar/components/service-badge";
import { ReputationBar } from "@/features/bazaar/components/reputation-bar";
import type { Agent, Listing, ServiceType } from "@/features/bazaar/types";

const ALL_TYPES: ServiceType[] = [
  "price-feed",
  "trading-signal",
  "sentiment",
  "data-analysis",
  "arbitrage",
  "nft-valuation",
  "liquidation-watch",
  "gas-oracle",
];

function DataSourceBadge({ isMock }: { isMock: boolean }) {
  return (
    <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-mono uppercase tracking-widest border ${
      isMock
        ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-400/70"
        : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400/70"
    }`}>
      <div className={`w-1 h-1 rounded-full ${isMock ? "bg-yellow-400" : "bg-emerald-400 animate-pulse"}`} />
      {isMock ? "Demo Data" : "Base Sepolia"}
    </div>
  );
}

export function MarketplaceTab() {
  const [filter, setFilter] = useState<ServiceType | "all">("all");
  const [selected, setSelected] = useState<string | null>(null);

  const { data: listingsData, isLoading: listingsLoading } = useBazaarListings();
  const { data: agentsData } = useBazaarAgents();

  const allListings: Listing[] = listingsData?.listings ?? [];
  const allAgents: Agent[] = agentsData?.agents ?? MOCK_AGENTS;
  const isMock = listingsData?.isMock ?? true;

  const agentById = new Map(allAgents.map((a) => [a.id, a]));

  const listings = filter === "all"
    ? allListings
    : allListings.filter((l) => l.serviceType === filter);

  const activeListings = listings.filter((l) => l.active);
  const totalVolume = allAgents.reduce((sum, a) => sum + a.totalVolume, 0);

  return (
    <div className="h-full flex flex-col">
      {/* Stats bar */}
      <div className="shrink-0 px-4 py-3 border-b border-white/5 bg-black/20">
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center">
            <div className="text-xs text-slate-500 uppercase tracking-wide">Listings</div>
            <div className="text-base font-mono font-bold text-white">
              {listingsLoading ? "—" : allListings.length}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-slate-500 uppercase tracking-wide">Agents</div>
            <div className="text-base font-mono font-bold text-white">{allAgents.length}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-slate-500 uppercase tracking-wide">Volume</div>
            <div className="text-base font-mono font-bold text-amber-400">{totalVolume.toFixed(2)} Ξ</div>
          </div>
        </div>
      </div>

      {/* Source badge + filter pills */}
      <div className="shrink-0 px-4 py-2 border-b border-white/5">
        <div className="flex items-center justify-between mb-2">
          <DataSourceBadge isMock={isMock} />
          {!isMock && (
            <span className="text-[9px] text-slate-600 font-mono">auto-refreshes every 30s</span>
          )}
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setFilter("all")}
            className={`shrink-0 text-[10px] font-mono uppercase tracking-wide px-2.5 py-1 rounded border transition-all ${
              filter === "all"
                ? "bg-violet-500/20 border-violet-500/40 text-violet-300"
                : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
            }`}
          >
            All
          </button>
          {ALL_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`shrink-0 text-[10px] font-mono uppercase tracking-wide px-2.5 py-1 rounded border transition-all ${
                filter === type
                  ? "bg-violet-500/20 border-violet-500/40 text-violet-300"
                  : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
              }`}
            >
              {SERVICE_TYPE_LABELS[type]}
            </button>
          ))}
        </div>
      </div>

      {/* Listings */}
      <div className="flex-1 overflow-y-auto p-4">
        {listingsLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {activeListings.map((listing) => {
              const agent = agentById.get(listing.sellerId);
              if (!agent) return null;
              const isSelected = selected === listing.id;

              return (
                <div
                  key={listing.id}
                  onClick={() => setSelected(isSelected ? null : listing.id)}
                  className={`rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-violet-500/10 border-violet-500/30"
                      : "bg-white/3 border-white/8 hover:bg-white/6 hover:border-white/15"
                  }`}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <ServiceBadge type={listing.serviceType} />
                        <p className="text-sm text-slate-200 mt-1.5 leading-snug line-clamp-2">
                          {listing.description}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-base font-mono font-bold text-amber-400">
                          {formatEth(listing.priceEth)}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {listing.ordersCompleted} filled
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                          <span className="text-[8px] font-bold text-white">
                            {agent.name.slice(0, 1)}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400 font-mono">{agent.name}</span>
                      </div>
                      <div className="w-24">
                        <ReputationBar score={agent.reputation} />
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="px-4 pb-4 border-t border-white/5 pt-3">
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <div className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">Seller Agent</div>
                          <div className="text-xs font-mono text-violet-300">{agent.name}</div>
                          <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                            ERC-8004 #{agent.erc8004TokenId}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">Contract</div>
                          <div className="text-[10px] font-mono text-slate-400 break-all">
                            Marketplace.sol
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">Base Sepolia</div>
                        </div>
                      </div>
                      <div className="rounded-lg bg-amber-400/5 border border-amber-400/15 p-3">
                        <div className="text-[10px] text-amber-400/80 font-mono uppercase tracking-wide mb-1">
                          Autonomous Order Flow
                        </div>
                        <div className="text-[10px] text-slate-400 leading-relaxed">
                          Buyer agent calls <span className="text-amber-300 font-mono">placeOrder()</span> → ETH locked in <span className="text-cyan-300 font-mono">Escrow.sol</span> → Seller delivers → <span className="text-emerald-300 font-mono">confirmDelivery()</span> releases funds. No human approval required.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
