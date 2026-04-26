"use client";

import { useEffect, useState, useCallback } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESSES, MARKETPLACE_ABI, formatAddress, weiToEth, formatEthAmount, ORDER_STATUS } from "@/lib/contracts";
import { getReadProvider, getWallet, waitForTx } from "@/lib/wallet";
import type { OnchainListing, OnchainOrder, Screen } from "@/features/app/screens/screen-types";

interface DashboardScreenProps {
  agentId: number | null;
  connectedAddress: string | null;
  onNavigate: (screen: Screen) => void;
  onBack: () => void;
}

type Tab = "buying" | "selling";

export function DashboardScreen({ agentId, connectedAddress, onNavigate, onBack }: DashboardScreenProps) {
  const [tab, setTab] = useState<Tab>("buying");
  const [myOrders, setMyOrders] = useState<OnchainOrder[]>([]);
  const [myListings, setMyListings] = useState<OnchainListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [txLoading, setTxLoading] = useState<number | null>(null);
  const [txError, setTxError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!connectedAddress) {
      // Address not ready yet — don't spin forever, just show empty
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const provider = await getReadProvider();
      const marketplace = new ethers.Contract(CONTRACT_ADDRESSES.marketplace, MARKETPLACE_ABI, provider);
      const [orderCount, listingCount]: [bigint, bigint] = await Promise.all([
        marketplace.orderCount(),
        marketplace.listingCount(),
      ]);
      const addr = connectedAddress.toLowerCase();
      const orders: OnchainOrder[] = [];
      for (let i = 1; i <= Number(orderCount); i++) {
        const o = await marketplace.orders(i);
        const buyer = String(o.buyer ?? o[1]);
        if (buyer.toLowerCase() === addr) {
          orders.push({
            id: i,
            listingId: BigInt(o.listingId ?? o[0]),
            buyer,
            buyerTokenId: BigInt(o.buyerTokenId ?? o[2]),
            seller: String(o.seller ?? o[3]),
            sellerTokenId: BigInt(o.sellerTokenId ?? o[4]),
            price: BigInt(o.price ?? o[5]),
            deadline: BigInt(o.deadline ?? o[6]),
            status: Number(o.status ?? o[7]),
          });
        }
      }
      const listings: OnchainListing[] = [];
      for (let i = 1; i <= Number(listingCount); i++) {
        const l = await marketplace.listings(i);
        const seller = String(l.seller ?? l[0]);
        if (seller.toLowerCase() === addr) {
          listings.push({
            id: i,
            seller,
            sellerTokenId: BigInt(l.sellerTokenId ?? l[1]),
            serviceType: String(l.serviceType ?? l[2]),
            price: BigInt(l.price ?? l[3]),
            active: Boolean(l.active ?? l[4]),
          });
        }
      }
      setMyOrders(orders);
      setMyListings(listings);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [connectedAddress]);

  // Re-run when connectedAddress becomes available
  useEffect(() => { loadData(); }, [loadData]);

  async function handleClaimRefund(orderId: number) {
    try {
      setTxLoading(orderId);
      setTxError(null);
      const { signer } = await getWallet();
      const marketplace = new ethers.Contract(CONTRACT_ADDRESSES.marketplace, MARKETPLACE_ABI, signer);
      const tx = await marketplace.claimRefund(orderId, { gasLimit: 200000n });
      await waitForTx(tx.hash);
      await loadData();
    } catch (err: unknown) {
      setTxError(err instanceof Error ? err.message.slice(0, 100) : "Transaction failed");
    } finally {
      setTxLoading(null);
    }
  }

  async function handleDeactivate(listingId: number) {
    try {
      setTxLoading(listingId);
      setTxError(null);
      const { signer } = await getWallet();
      const marketplace = new ethers.Contract(CONTRACT_ADDRESSES.marketplace, MARKETPLACE_ABI, signer);
      const tx = await marketplace.deactivateListing(listingId, { gasLimit: 200000n });
      await waitForTx(tx.hash);
      await loadData();
    } catch (err: unknown) {
      setTxError(err instanceof Error ? err.message.slice(0, 100) : "Transaction failed");
    } finally {
      setTxLoading(null);
    }
  }

  const now = Math.floor(Date.now() / 1000);

  const statusConfig: Record<string, { color: string; bg: string; border: string; dot: string }> = {
    NONE:      { color: "#6B7280", bg: "rgba(107,114,128,0.08)", border: "rgba(107,114,128,0.2)", dot: "#6B7280" },
    PENDING:   { color: "#FCD34D", bg: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.2)",  dot: "#F59E0B" },
    DELIVERED: { color: "#A78BFA", bg: "rgba(124,58,237,0.08)",  border: "rgba(124,58,237,0.2)",  dot: "#7C3AED" },
    REFUNDED:  { color: "#FCA5A5", bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.2)",   dot: "#EF4444" },
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 shrink-0 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-3 mb-3">
          <button onClick={onBack} className="text-gray-400 active:text-white p-1 -ml-1">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M11 14L6 9L11 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
          <h2 className="text-base font-bold text-white">Dashboard</h2>
          {agentId !== null && (
            <div className="ml-auto flex items-center gap-1.5 border border-violet-500/30 rounded-full px-2.5 py-1 bg-violet-500/10">
              <div className="w-1 h-1 rounded-full bg-violet-400" />
              <span className="text-[10px] font-mono text-violet-300">Agent #{agentId}</span>
            </div>
          )}
        </div>
        <button
          onClick={() => onNavigate({ id: "list-service" })}
          className="w-full py-2.5 rounded-xl text-xs font-bold bg-violet-600 text-white active:bg-violet-700"
        >
          + List a New Service
        </button>
      </div>

      {/* Tabs */}
      <div className="flex shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        {(["buying", "selling"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 py-3 text-xs font-bold capitalize transition-colors relative"
            style={{ color: tab === t ? "#A78BFA" : "#6B7280" }}
          >
            {t === "buying" ? "Buying" : "Selling"}
            {tab === t && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-violet-500" />
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        {!connectedAddress && !loading && (
          <div className="flex flex-col items-center justify-center h-36 gap-3">
            <div className="w-8 h-8 rounded-xl bg-gray-800 flex items-center justify-center text-gray-600">⬡</div>
            <p className="text-xs text-gray-600">Waiting for wallet...</p>
            <button onClick={loadData} className="text-xs text-violet-400 border border-violet-500/30 rounded-lg px-3 py-1.5">Retry</button>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center h-36 gap-3">
            <div className="relative w-7 h-7">
              <div className="absolute inset-0 rounded-full border-2 border-violet-500/20" />
              <div className="absolute inset-0 rounded-full border-2 border-t-violet-500 animate-spin" />
            </div>
            <p className="text-xs text-gray-600 font-mono">Loading your activity...</p>
          </div>
        )}

        {txError && (
          <div className="mb-3 rounded-xl px-4 py-3 flex gap-2" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}>
            <span className="text-rose-400 shrink-0">✕</span>
            <p className="text-xs text-rose-300">{txError}</p>
          </div>
        )}

        {/* Buying tab */}
        {!loading && tab === "buying" && (
          <div className="space-y-3 pt-1">
            {myOrders.length === 0 && (
              <div className="flex flex-col items-center justify-center h-40 gap-3 text-center">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  ⇄
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500">No orders yet</p>
                  <p className="text-[10px] text-gray-700 mt-0.5">Buy a service from the marketplace to get started.</p>
                </div>
              </div>
            )}
            {myOrders.map((order) => {
              const statusLabel = ORDER_STATUS[order.status] ?? "UNKNOWN";
              const cfg = statusConfig[statusLabel] ?? statusConfig.NONE;
              const deadlinePassed = Number(order.deadline) > 0 && now > Number(order.deadline);
              const isPending = order.status === 1;
              return (
                <div key={order.id} className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${cfg.border}` }}>
                  {/* Status bar */}
                  <div className="px-4 py-2.5 flex items-center justify-between" style={{ background: cfg.bg }}>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wide" style={{ color: cfg.color }}>{statusLabel}</span>
                    </div>
                    <span className="text-[10px] font-mono text-gray-600">Order #{order.id}</span>
                  </div>
                  {/* Body */}
                  <div className="px-4 py-3 space-y-2.5" style={{ background: "rgba(8,8,16,0.7)" }}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Seller</span>
                      <span className="text-xs font-mono text-gray-300">{formatAddress(order.seller)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Amount</span>
                      <span className="text-sm font-bold text-amber-400">{formatEthAmount(order.price)} ETH</span>
                    </div>
                    {Number(order.deadline) > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-gray-600 font-mono">Deadline</span>
                        <span className="text-[10px] text-gray-600 font-mono">{new Date(Number(order.deadline) * 1000).toLocaleDateString()}</span>
                      </div>
                    )}
                    {isPending && !deadlinePassed && (
                      <button
                        onClick={() => onNavigate({ id: "confirm-delivery", orderId: order.id, order })}
                        className="w-full py-2.5 rounded-xl text-xs font-bold text-white mt-1 active:opacity-80"
                        style={{ background: "linear-gradient(135deg, #10B981, #059669)" }}
                      >
                        Confirm Delivery →
                      </button>
                    )}
                    {isPending && deadlinePassed && (
                      <button
                        onClick={() => handleClaimRefund(order.id)}
                        disabled={txLoading === order.id}
                        className="w-full py-2.5 rounded-xl text-xs font-bold mt-1 active:opacity-80 disabled:opacity-50"
                        style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#FCA5A5" }}
                      >
                        {txLoading === order.id ? "Processing..." : "Claim Refund"}
                      </button>
                    )}
                    {order.status === 2 && (
                      <div className="text-center py-1">
                        <span className="text-xs text-violet-400 font-bold">✓ Delivered & Complete</span>
                      </div>
                    )}
                    {order.status === 3 && (
                      <div className="text-center py-1">
                        <span className="text-xs text-rose-400 font-bold">↩ Refunded</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Selling tab */}
        {!loading && tab === "selling" && (
          <div className="space-y-3 pt-1">
            {myListings.length === 0 && (
              <div className="flex flex-col items-center justify-center h-40 gap-3 text-center">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  ✦
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500">No listings yet</p>
                  <p className="text-[10px] text-gray-700 mt-0.5">List a service to start earning ETH.</p>
                </div>
              </div>
            )}
            {myListings.map((listing) => (
              <div key={listing.id} className="rounded-2xl overflow-hidden"
                style={{ border: listing.active ? "1px solid rgba(16,185,129,0.2)" : "1px solid rgba(255,255,255,0.07)" }}>
                {/* Status bar */}
                <div className="px-4 py-2.5 flex items-center justify-between"
                  style={{ background: listing.active ? "rgba(16,185,129,0.08)" : "rgba(255,255,255,0.03)" }}>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: listing.active ? "#10B981" : "#4B5563" }} />
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wide"
                      style={{ color: listing.active ? "#6EE7B7" : "#6B7280" }}>
                      {listing.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-gray-600">Listing #{listing.id}</span>
                </div>
                {/* Body */}
                <div className="px-4 py-3 space-y-2" style={{ background: "rgba(8,8,16,0.7)" }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white capitalize">{listing.serviceType.replace(/-/g, " ")}</span>
                    <span className="text-sm font-bold text-amber-400">{formatEthAmount(listing.price)} ETH</span>
                  </div>
                  {listing.active && (
                    <button
                      onClick={() => handleDeactivate(listing.id)}
                      disabled={txLoading === listing.id}
                      className="w-full py-2 rounded-xl text-xs font-bold mt-1 active:opacity-80 disabled:opacity-50"
                      style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#FCA5A5" }}
                    >
                      {txLoading === listing.id ? "Deactivating..." : "Deactivate Listing"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
