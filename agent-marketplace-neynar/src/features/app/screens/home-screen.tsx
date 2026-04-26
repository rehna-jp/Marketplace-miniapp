"use client";

import { useEffect, useState, useCallback } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESSES, MARKETPLACE_ABI, formatAddress, weiToEth, formatEthAmount } from "@/lib/contracts";
import { getReadProvider } from "@/lib/wallet";
import type { OnchainListing, Screen } from "@/features/app/screens/screen-types";

const SERVICE_ICONS: Record<string, string> = {
  "price-feed": "◈",
  "trading-signal": "⟁",
  "data-analysis": "⬡",
  "sentiment": "◎",
  "arbitrage": "⇄",
  "nft-valuation": "◆",
  "liquidation-watch": "⚠",
  "gas-oracle": "⬢",
  "custom": "✦",
};

const SERVICE_COLORS: Record<string, { border: string; bg: string; text: string; dot: string }> = {
  "price-feed":        { border: "rgba(6,182,212,0.3)",   bg: "rgba(6,182,212,0.08)",   text: "#06B6D4", dot: "#06B6D4" },
  "trading-signal":    { border: "rgba(124,58,237,0.3)",  bg: "rgba(124,58,237,0.08)",  text: "#A78BFA", dot: "#7C3AED" },
  "data-analysis":     { border: "rgba(245,158,11,0.3)",  bg: "rgba(245,158,11,0.08)",  text: "#FCD34D", dot: "#F59E0B" },
  "sentiment":         { border: "rgba(236,72,153,0.3)",  bg: "rgba(236,72,153,0.08)",  text: "#F9A8D4", dot: "#EC4899" },
  "arbitrage":         { border: "rgba(16,185,129,0.3)",  bg: "rgba(16,185,129,0.08)",  text: "#6EE7B7", dot: "#10B981" },
  "nft-valuation":     { border: "rgba(249,115,22,0.3)",  bg: "rgba(249,115,22,0.08)",  text: "#FED7AA", dot: "#F97316" },
  "liquidation-watch": { border: "rgba(239,68,68,0.3)",   bg: "rgba(239,68,68,0.08)",   text: "#FCA5A5", dot: "#EF4444" },
  "gas-oracle":        { border: "rgba(99,102,241,0.3)",  bg: "rgba(99,102,241,0.08)",  text: "#C7D2FE", dot: "#6366F1" },
  "custom":            { border: "rgba(124,58,237,0.2)",  bg: "rgba(124,58,237,0.05)",  text: "#C4B5FD", dot: "#7C3AED" },
};

function getServiceColor(st: string) {
  return SERVICE_COLORS[st] ?? SERVICE_COLORS["custom"];
}

interface HomeScreenProps {
  agentId: number | null;
  connectedAddress: string | null;
  onNavigate: (screen: Screen) => void;
}

export function HomeScreen({ agentId, connectedAddress, onNavigate }: HomeScreenProps) {
  const [listings, setListings] = useState<OnchainListing[]>([]);
  const [deliveredListingIds, setDeliveredListingIds] = useState<Set<number>>(new Set());
  const [pendingListingIds, setPendingListingIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const loadListings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const provider = await getReadProvider();
      const marketplace = new ethers.Contract(CONTRACT_ADDRESSES.marketplace, MARKETPLACE_ABI, provider);
      const count: bigint = await marketplace.listingCount();
      const all: OnchainListing[] = [];
      for (let i = 1; i <= Number(count); i++) {
        const l = await marketplace.listings(i);
        const price = BigInt(l.price ?? l[3]);
        const active = Boolean(l.active ?? l[4]);
        if (active) {
          all.push({
            id: i,
            seller: String(l.seller ?? l[0]),
            sellerTokenId: BigInt(l.sellerTokenId ?? l[1]),
            serviceType: String(l.serviceType ?? l[2]),
            price,
            active,
          });
        }
      }
      setListings(all);

      // Load orders to track delivered/pending listings
      try {
        const orderCount: bigint = await marketplace.orderCount();
        const delivered = new Set<number>();
        const pending = new Set<number>();
        for (let i = 1; i <= Number(orderCount); i++) {
          const o = await marketplace.orders(i);
          const listingId = Number(o.listingId ?? o[0]);
          const status = Number(o.status ?? o[7]);
          if (status === 2) {
            delivered.add(listingId);
            pending.delete(listingId); // delivered always wins over pending
          } else if (status === 1 && !delivered.has(listingId)) {
            pending.add(listingId);
          }
        }
        setDeliveredListingIds(delivered);
        setPendingListingIds(pending);
      } catch {
        // Orders unavailable — proceed without status badges
      }
    } catch (err) {
      setError("Failed to load listings");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadListings(); }, [loadListings]);

  return (
    <div className="flex flex-col h-full relative">

      {/* Top action bar */}
      <div className="px-4 pt-3 pb-3 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-mono text-gray-400">
              {connectedAddress ? formatAddress(connectedAddress) : "not connected"}
            </span>
            <span className="text-[9px] font-mono text-cyan-400/80 border border-cyan-400/20 rounded px-1.5 py-0.5 bg-cyan-400/5">
              Base Sepolia
            </span>
          </div>
          {agentId !== null && (
            <div className="flex items-center gap-1.5 border border-violet-500/30 rounded-full px-2.5 py-1 bg-violet-500/10">
              <div className="w-1 h-1 rounded-full bg-violet-400" />
              <span className="text-[10px] font-mono text-violet-300 font-semibold">Agent #{agentId}</span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onNavigate({ id: "register" })}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold border border-violet-500/40 text-violet-300 bg-violet-500/10 active:bg-violet-500/20 transition-colors"
          >
            {agentId ? "⬡  My Agent" : "+ Register Agent"}
          </button>
          <button
            onClick={() => onNavigate({ id: "list-service" })}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold border border-amber-500/30 text-amber-300 bg-amber-500/8 active:bg-amber-500/15 transition-colors"
            style={{ background: "rgba(245,158,11,0.06)" }}
          >
            + List Service
          </button>
          <button
            onClick={() => onNavigate({ id: "dashboard" })}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold border border-white/10 text-gray-400 bg-white/4 active:bg-white/8 transition-colors"
            style={{ background: "rgba(255,255,255,0.04)" }}
          >
            Dashboard
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px mx-4 shrink-0" style={{ background: "rgba(124,58,237,0.12)" }} />

      {/* Listings */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {loading && (
          <div className="flex flex-col items-center justify-center h-44 gap-3">
            <div className="relative w-8 h-8">
              <div className="absolute inset-0 rounded-full border-2 border-violet-500/20" />
              <div className="absolute inset-0 rounded-full border-2 border-t-violet-500 animate-spin" />
            </div>
            <p className="text-xs text-gray-600 font-mono tracking-wide">Scanning marketplace...</p>
          </div>
        )}

        {error && !loading && (
          <div className="flex flex-col items-center justify-center h-44 gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 text-lg">✕</div>
            <p className="text-xs text-rose-400">{error}</p>
            <button onClick={loadListings} className="text-xs text-violet-400 border border-violet-500/30 rounded-lg px-3 py-1.5 active:bg-violet-500/10">
              Retry
            </button>
          </div>
        )}

        {!loading && !error && listings.length === 0 && (
          <div className="flex flex-col items-center justify-center h-52 gap-4">
            <div
              className="w-16 h-16 rounded-3xl flex items-center justify-center text-3xl"
              style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)" }}
            >
              ⬡
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-semibold text-gray-300">No active listings</p>
              <p className="text-xs text-gray-600">Register as an agent and list your first service.</p>
            </div>
            <button
              onClick={() => onNavigate({ id: agentId ? "list-service" : "register" })}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-violet-600 text-white active:bg-violet-700"
            >
              {agentId ? "List a Service" : "Get Started"}
            </button>
          </div>
        )}

        {!loading && !error && listings.length > 0 && (
          <div className="space-y-3 pt-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">
                {listings.length} Active Listing{listings.length !== 1 ? "s" : ""}
              </p>
              <button onClick={loadListings} className="text-[10px] text-gray-600 active:text-gray-400 font-mono">
                ↻ refresh
              </button>
            </div>

            {listings.map((listing) => {
              const col = getServiceColor(listing.serviceType);
              const icon = SERVICE_ICONS[listing.serviceType] ?? "✦";
              const isOwn = connectedAddress?.toLowerCase() === listing.seller.toLowerCase();
              return (
                <div
                  key={listing.id}
                  className="rounded-2xl p-4"
                  style={{ border: `1px solid ${col.border}`, background: `linear-gradient(135deg, ${col.bg}, rgba(8,8,16,0.9))` }}
                >
                  {/* Header row */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0"
                        style={{ background: col.bg, border: `1px solid ${col.border}`, color: col.text }}
                      >
                        {icon}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white capitalize">{listing.serviceType.replace(/-/g, " ")}</p>
                        <p className="text-[10px] font-mono mt-0.5" style={{ color: col.text }}>
                          Listing #{listing.id}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <p className="text-base font-bold text-amber-400 leading-none">{formatEthAmount(listing.price)}</p>
                      <p className="text-[10px] text-amber-400/60 font-mono mt-0.5">ETH</p>
                    </div>
                  </div>

                  {/* Footer row */}
                  <div className="flex items-center justify-between pt-2.5" style={{ borderTop: `1px solid ${col.border}` }}>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1 h-1 rounded-full" style={{ background: col.dot }} />
                      <span className="text-[10px] font-mono text-gray-500">
                        {isOwn ? "your listing" : formatAddress(listing.seller)}
                      </span>
                    </div>
                    {deliveredListingIds.has(listing.id) ? (
                      <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30 rounded-lg px-2.5 py-1 bg-emerald-500/8">
                        ✓ Delivered
                      </span>
                    ) : pendingListingIds.has(listing.id) ? (
                      <span className="flex items-center gap-1.5 text-[10px] font-bold text-amber-400 border border-amber-500/30 rounded-lg px-2.5 py-1 bg-amber-500/8">
                        ⏳ In Progress
                      </span>
                    ) : isOwn ? (
                      <span className="text-[10px] font-mono text-gray-600 border border-white/8 rounded-lg px-2.5 py-1" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                        Your listing
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          if (!connectedAddress) { showToast("Connect a wallet first"); return; }
                          if (!agentId) { onNavigate({ id: "register" }); return; }
                          onNavigate({ id: "place-order", listingId: listing.id, listing });
                        }}
                        className="px-4 py-1.5 rounded-xl text-xs font-bold text-white active:opacity-80 transition-opacity"
                        style={{ background: `linear-gradient(135deg, ${col.dot}, rgba(124,58,237,0.8))` }}
                      >
                        Buy →
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="absolute bottom-4 left-4 right-4 z-50 rounded-2xl px-4 py-3 flex items-center gap-2.5 shadow-xl"
          style={{ background: "rgba(20,20,40,0.95)", border: "1px solid rgba(245,158,11,0.3)", backdropFilter: "blur(12px)" }}>
          <span className="text-amber-400 text-sm shrink-0">⚠</span>
          <p className="text-xs text-amber-200 font-medium">{toast}</p>
        </div>
      )}
    </div>
  );
}
