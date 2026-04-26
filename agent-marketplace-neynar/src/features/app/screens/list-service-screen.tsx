"use client";

import { useState } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESSES, MARKETPLACE_ABI, ethToWei } from "@/lib/contracts";
import { getWallet, waitForTx } from "@/lib/wallet";
import type { Screen } from "@/features/app/screens/screen-types";

const SERVICE_TYPES = [
  { value: "price-feed",        label: "Price Feed",         icon: "◈", desc: "Real-time asset pricing" },
  { value: "trading-signal",    label: "Trading Signal",     icon: "⟁", desc: "Buy/sell signal generation" },
  { value: "data-analysis",     label: "Data Analysis",      icon: "⬡", desc: "On-chain analytics" },
  { value: "sentiment",         label: "Sentiment",          icon: "◎", desc: "Market sentiment scoring" },
  { value: "arbitrage",         label: "Arbitrage",          icon: "⇄", desc: "Cross-DEX opportunity detection" },
  { value: "nft-valuation",     label: "NFT Valuation",      icon: "◆", desc: "NFT price estimation" },
  { value: "liquidation-watch", label: "Liquidation Watch",  icon: "⚠", desc: "Monitor liquidation thresholds" },
  { value: "gas-oracle",        label: "Gas Oracle",         icon: "⬢", desc: "Gas price forecasting" },
  { value: "custom",            label: "Custom",             icon: "✦", desc: "Custom agent service" },
];

interface ListServiceScreenProps {
  agentId: number | null;
  onNavigate: (screen: Screen) => void;
  onBack: () => void;
}

export function ListServiceScreen({ agentId, onNavigate, onBack }: ListServiceScreenProps) {
  const [serviceType, setServiceType] = useState("price-feed");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (agentId === null) {
    return (
      <div className="flex flex-col h-full">
        <div className="px-4 pt-4 pb-3 shrink-0 flex items-center gap-3 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <button onClick={onBack} className="text-gray-400 active:text-white p-1 -ml-1">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M11 14L6 9L11 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
          <h2 className="text-base font-bold text-white">List a Service</h2>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-5">
          <div className="w-16 h-16 rounded-3xl flex items-center justify-center text-2xl"
            style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
            ⚠
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-bold text-white">Agent identity required</p>
            <p className="text-xs text-gray-500">Register your ERC-8004 identity NFT first to list services on the marketplace.</p>
          </div>
          <button
            onClick={() => onNavigate({ id: "register" })}
            className="w-full max-w-xs py-3 rounded-xl text-sm font-bold bg-violet-600 text-white active:bg-violet-700"
          >
            Register as Agent →
          </button>
        </div>
      </div>
    );
  }

  async function handleList() {
    if (loading) return;
    if (!price || parseFloat(price) <= 0) {
      setError("Enter a valid price greater than 0");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      setStatus("Connecting wallet...");
      const { signer } = await getWallet();
      setStatus("Submitting listing...");
      const marketplace = new ethers.Contract(CONTRACT_ADDRESSES.marketplace, MARKETPLACE_ABI, signer);
      const priceWei = ethToWei(price);
      const tokenId = agentId ?? 0;
      console.log("[List] price entered:", price, "ETH → priceWei:", priceWei.toString(), "tokenId:", tokenId);
      const tx = await marketplace.listService(serviceType, priceWei, tokenId, { gasLimit: 300000n });
      console.log("[List] tx hash:", tx.hash);
      setStatus("Confirming on-chain...");
      const receipt = await waitForTx(tx.hash);
      console.log("[List] receipt status:", receipt?.status);
      if (receipt && receipt.status === 0) {
        throw new Error("Listing transaction reverted. Check https://sepolia.basescan.org/tx/" + tx.hash);
      }
      let listingId = "?";
      try {
        if (receipt?.logs?.[0]?.data) {
          listingId = String(parseInt(receipt.logs[0].data.slice(0, 66), 16));
        }
      } catch { /* no-op */ }
      setStatus(`Listed! Listing ID: #${listingId}`);
      setTimeout(() => onNavigate({ id: "home" }), 2000);
    } catch (err: unknown) {
      setLoading(false);
      setStatus(null);
      console.error("[ListService] error:", err);
      if (err instanceof Error) {
        if (err.message.includes("user rejected") || err.message.includes("User rejected")) {
          setError("Transaction cancelled");
        } else if (err.message.includes("No wallet") || err.message.includes("Open in Warpcast")) {
          setError("No wallet found — open in Warpcast or connect MetaMask");
        } else {
          setError(err.message.slice(0, 300));
        }
      } else {
        setError(`Transaction failed: ${JSON.stringify(err)}`);
      }
    }
  }

  const selectedType = SERVICE_TYPES.find((t) => t.value === serviceType);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-3 shrink-0 flex items-center gap-3 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <button onClick={onBack} className="text-gray-400 active:text-white p-1 -ml-1">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 14L6 9L11 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
        <h2 className="text-base font-bold text-white">List a Service</h2>
        <div className="ml-auto flex items-center gap-1.5 border border-violet-500/30 rounded-full px-2.5 py-1 bg-violet-500/10">
          <div className="w-1 h-1 rounded-full bg-violet-400" />
          <span className="text-[10px] font-mono text-violet-300">Agent #{agentId}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

        {/* Service type picker */}
        <div>
          <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">Service Type</label>
          <div className="grid grid-cols-3 gap-2">
            {SERVICE_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => setServiceType(t.value)}
                className="rounded-xl p-2.5 text-center transition-all"
                style={{
                  background: serviceType === t.value ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.03)",
                  border: serviceType === t.value ? "1px solid rgba(124,58,237,0.5)" : "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div className="text-lg mb-0.5" style={{ color: serviceType === t.value ? "#A78BFA" : "#6B7280" }}>
                  {t.icon}
                </div>
                <p className="text-[9px] font-semibold leading-tight" style={{ color: serviceType === t.value ? "#C4B5FD" : "#6B7280" }}>
                  {t.label}
                </p>
              </button>
            ))}
          </div>
          {selectedType && (
            <p className="text-[10px] text-gray-600 mt-2 font-mono">{selectedType.desc}</p>
          )}
        </div>

        {/* Price input */}
        <div>
          <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">Price (ETH)</label>
          <div className="relative">
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.001"
              step="0.001"
              min="0"
              className="w-full rounded-xl px-4 py-3 pr-14 text-sm text-white placeholder:text-gray-700 focus:outline-none"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-amber-400/60 font-mono">ETH</span>
          </div>
          {price && parseFloat(price) > 0 && (
            <p className="text-[10px] text-gray-600 mt-1.5 font-mono">
              ≈ ${(parseFloat(price) * 3000).toFixed(2)} USD at $3000/ETH
            </p>
          )}
        </div>

        {error && (
          <div className="rounded-xl px-4 py-3 flex gap-2" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}>
            <span className="text-rose-400 shrink-0">✕</span>
            <p className="text-xs text-rose-300">{error}</p>
          </div>
        )}

        {status && !error && (
          <div className="rounded-xl px-4 py-3 flex items-center gap-2.5" style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.25)" }}>
            {loading && <div className="w-3.5 h-3.5 border border-violet-400/30 border-t-violet-400 rounded-full animate-spin shrink-0" />}
            <p className="text-xs text-violet-300">{status}</p>
          </div>
        )}

        <button
          onClick={handleList}
          disabled={loading}
          className="w-full py-3.5 rounded-xl text-sm font-bold bg-violet-600 text-white active:bg-violet-700 disabled:opacity-40 transition-opacity"
        >
          {loading ? "Listing..." : `List ${selectedType?.label ?? "Service"}`}
        </button>

        <p className="text-center text-[10px] text-gray-700">
          Buyers pay into escrow · payment released on delivery confirmation
        </p>
      </div>
    </div>
  );
}
