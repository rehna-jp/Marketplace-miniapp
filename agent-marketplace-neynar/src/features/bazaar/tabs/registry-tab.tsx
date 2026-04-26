"use client";

import { useState } from "react";
import { useBazaarAgents } from "@/features/bazaar/hooks/use-bazaar-data";
import { formatAddress, formatEth } from "@/features/bazaar/mock-data";
import { ServiceBadge } from "@/features/bazaar/components/service-badge";
import { AgentStatusDot } from "@/features/bazaar/components/status-dot";
import { ReputationBar } from "@/features/bazaar/components/reputation-bar";
import type { Agent } from "@/features/bazaar/types";

function BaseScanLink({ address }: { address: string }) {
  if (!address || address === "0x0000000000000000000000000000000000000000") return null;
  return (
    <a
      href={`https://sepolia.basescan.org/address/${address}`}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="text-xs font-mono text-violet-300 bg-violet-500/5 border border-violet-500/15 rounded-lg px-3 py-2 break-all hover:border-violet-500/40 transition-colors"
    >
      {formatAddress(address)}
    </a>
  );
}

function AgentCard({ agent, isLive }: { agent: Agent; isLive: boolean }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      onClick={() => setExpanded((e) => !e)}
      className="rounded-xl border bg-white/3 border-white/8 hover:bg-white/5 hover:border-white/15 transition-all cursor-pointer"
    >
      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 via-indigo-600 to-purple-700 flex items-center justify-center shadow-lg shadow-violet-500/20">
                <span className="text-base font-bold text-white">{agent.name.slice(0, 2)}</span>
              </div>
              <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0F0F23] ${
                agent.status === "ACTIVE" ? "bg-emerald-400" :
                agent.status === "BUSY" ? "bg-amber-400" :
                "bg-slate-500"
              }`} />
            </div>
            <div>
              <div className="text-sm font-bold text-white">{agent.name}</div>
              <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                ERC-8004 #{agent.erc8004TokenId}
              </div>
            </div>
          </div>
          <AgentStatusDot status={agent.status} />
        </div>

        {/* Reputation */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-wide">Reputation</span>
            <span className="text-[10px] text-slate-500">{agent.serviceCount} services</span>
          </div>
          <ReputationBar score={agent.reputation} />
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-between">
          <ServiceBadge type={agent.specialization} />
          <div className="text-right">
            <div className="text-sm font-mono font-bold text-amber-400">{formatEth(agent.totalVolume)}</div>
            <div className="text-[10px] text-slate-500">total volume</div>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-3">
          {/* Wallet address — links to BaseScan if live */}
          <div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">Privy Wallet</div>
            {isLive ? (
              <BaseScanLink address={agent.walletAddress} />
            ) : (
              <div className="text-xs font-mono text-violet-300 bg-violet-500/5 border border-violet-500/15 rounded-lg px-3 py-2 break-all">
                {formatAddress(agent.walletAddress)}
              </div>
            )}
          </div>

          {/* Identity details */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-black/20 rounded-lg p-2.5">
              <div className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">Standard</div>
              <div className="text-xs font-mono text-cyan-400">ERC-8004</div>
              <div className="text-[10px] text-slate-600 mt-0.5">Identity NFT</div>
            </div>
            <div className="bg-black/20 rounded-lg p-2.5">
              <div className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">Chain</div>
              <div className="text-xs font-mono text-sky-400">Base Sepolia</div>
              <div className="text-[10px] text-slate-600 mt-0.5">Testnet</div>
            </div>
          </div>

          {/* Privy wallet id */}
          {agent.privyWalletId && (
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">Privy Wallet ID</div>
              <div className="text-[10px] font-mono text-slate-400 bg-black/20 rounded-lg px-3 py-2 break-all">
                {agent.privyWalletId}
              </div>
            </div>
          )}

          <div className="rounded-lg bg-violet-500/5 border border-violet-500/15 p-2.5">
            <div className="text-[10px] text-violet-400 font-mono">
              {isLive
                ? "✓ Live onchain identity — ERC-8004 verified"
                : "✓ Autonomous signing enabled — no human approval required"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function RegistryTab() {
  const { data: agentsData, isLoading } = useBazaarAgents();

  const allAgents: Agent[] = agentsData?.agents ?? [];
  const isMock = agentsData?.isMock ?? true;
  const privyConnected = agentsData?.privyConnected ?? false;
  const privyWalletCount = agentsData?.privyWalletCount ?? 0;

  const activeAgents = allAgents.filter((a) => a.status === "ACTIVE").length;
  const busyAgents = allAgents.filter((a) => a.status === "BUSY").length;
  const avgReputation = allAgents.length > 0
    ? Math.round(allAgents.reduce((sum, a) => sum + a.reputation, 0) / allAgents.length)
    : 0;

  return (
    <div className="h-full flex flex-col">
      {/* Stats */}
      <div className="shrink-0 px-4 py-3 border-b border-white/5 bg-black/20">
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center">
            <div className="text-xs text-slate-500 uppercase tracking-wide">Active</div>
            <div className="text-base font-mono font-bold text-emerald-400">{activeAgents}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-slate-500 uppercase tracking-wide">Busy</div>
            <div className="text-base font-mono font-bold text-amber-400">{busyAgents}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-slate-500 uppercase tracking-wide">Avg Rep</div>
            <div className="text-base font-mono font-bold text-cyan-400">{avgReputation}</div>
          </div>
        </div>
      </div>

      {/* ERC-8004 badge + Privy status */}
      <div className="shrink-0 px-4 py-2 border-b border-white/5">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[10px] font-mono text-violet-400 uppercase tracking-widest">ERC-8004</span>
          <div className="flex-1 h-px bg-violet-500/20" />
          <span className="text-[10px] text-slate-600 font-mono">{allAgents.length} agents</span>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-mono border ${
            isMock
              ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-400/70"
              : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400/70"
          }`}>
            <div className={`w-1 h-1 rounded-full ${isMock ? "bg-yellow-400" : "bg-emerald-400 animate-pulse"}`} />
            {isMock ? "Demo" : "Base Sepolia"}
          </div>
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-mono border ${
            privyConnected
              ? "bg-violet-500/10 border-violet-500/20 text-violet-400/70"
              : "bg-white/5 border-white/10 text-slate-500"
          }`}>
            <div className={`w-1 h-1 rounded-full ${privyConnected ? "bg-violet-400 animate-pulse" : "bg-slate-500"}`} />
            {privyConnected ? `Privy: ${privyWalletCount} wallets` : "Privy: not configured"}
          </div>
        </div>
      </div>

      {/* Agent list */}
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
            {allAgents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} isLive={!isMock} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
