"use client";

import { useState } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESSES, MARKETPLACE_ABI, formatAddress, weiToEth, formatEthAmount } from "@/lib/contracts";
import { getWallet, waitForTx } from "@/lib/wallet";
import type { OnchainOrder, Screen } from "@/features/app/screens/screen-types";

interface ConfirmDeliveryScreenProps {
  orderId: number;
  order: OnchainOrder;
  onNavigate: (screen: Screen) => void;
  onBack: () => void;
}

const STAR_LABELS: Record<number, string> = {
  1: "Poor",
  2: "Below average",
  3: "Average",
  4: "Good",
  5: "Excellent",
};

export function ConfirmDeliveryScreen({ orderId, order, onNavigate, onBack }: ConfirmDeliveryScreenProps) {
  const [score, setScore] = useState(5);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    if (loading) return;
    try {
      setLoading(true);
      setError(null);
      setStatus("Connecting wallet...");
      const { signer } = await getWallet();
      setStatus("Releasing escrow to seller...");
      const marketplace = new ethers.Contract(CONTRACT_ADDRESSES.marketplace, MARKETPLACE_ABI, signer);
      console.log("[ConfirmDelivery] orderId:", orderId, "score:", score, "caller:", await signer.getAddress(), "order.buyer:", order.buyer, "order.seller:", order.seller);
      const tx = await marketplace.confirmDelivery(orderId, score, { gasLimit: 300000n });
      setStatus("Confirming on-chain...");
      const receipt = await waitForTx(tx.hash);
      if (receipt && receipt.status === 0) {
        throw new Error("Transaction reverted on-chain. The order may not be in the correct state.");
      }
      setStatus("Payment released! Reputation score posted onchain.");
      setTimeout(() => onNavigate({ id: "home" }), 2500);
    } catch (err: unknown) {
      setLoading(false);
      setStatus(null);
      if (err instanceof Error) {
        if (err.message.includes("user rejected") || err.message.includes("User rejected")) {
          setError("Transaction cancelled");
        } else {
          setError(err.message.slice(0, 200));
        }
      } else {
        setError("Transaction failed");
      }
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-3 shrink-0 flex items-center gap-3 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <button onClick={onBack} className="text-gray-400 active:text-white p-1 -ml-1">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 14L6 9L11 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
        <h2 className="text-base font-bold text-white">Confirm Delivery</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

        {/* Order card */}
        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(16,185,129,0.25)" }}>
          <div className="px-4 py-3 flex items-center gap-2" style={{ background: "rgba(16,185,129,0.1)" }}>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <p className="text-[10px] font-mono text-emerald-400/80 uppercase tracking-widest">Order #{orderId} — Pending Delivery</p>
          </div>
          <div className="px-4 py-3 space-y-2.5" style={{ background: "rgba(8,8,16,0.8)" }}>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Seller</span>
              <span className="text-xs font-mono text-gray-300">{formatAddress(order.seller)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Escrowed</span>
              <div>
                <span className="text-lg font-black text-amber-400">{formatEthAmount(order.price)}</span>
                <span className="text-xs font-bold text-amber-400/60 ml-1">ETH</span>
              </div>
            </div>
          </div>
        </div>

        {/* Star rating */}
        <div className="rounded-2xl px-4 py-4 space-y-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-gray-300">Rate this service</p>
            <span className="text-xs text-gray-500 font-mono">{STAR_LABELS[score]}</span>
          </div>
          <div className="flex gap-2 justify-center">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                onClick={() => setScore(s)}
                className="w-12 h-12 rounded-xl text-2xl transition-all active:scale-95"
                style={{
                  background: s <= score ? "rgba(245,158,11,0.15)" : "rgba(255,255,255,0.04)",
                  border: s <= score ? "1px solid rgba(245,158,11,0.4)" : "1px solid rgba(255,255,255,0.07)",
                  color: s <= score ? "#F59E0B" : "#374151",
                }}
              >
                ★
              </button>
            ))}
          </div>
          <p className="text-center text-[10px] text-gray-600 font-mono">
            {score}/5 · This score is posted onchain to the reputation registry
          </p>
        </div>

        {/* Warning */}
        <div className="rounded-xl px-4 py-3 flex gap-3" style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)" }}>
          <span className="text-amber-400 shrink-0">⚠</span>
          <p className="text-[11px] text-amber-300/70 leading-relaxed">
            This releases <span className="font-bold text-amber-400">{formatEthAmount(order.price)} ETH</span> from escrow to the seller. This action is permanent and cannot be undone.
          </p>
        </div>

        {error && (
          <div className="rounded-xl px-4 py-3 flex gap-2" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}>
            <span className="text-rose-400 shrink-0">✕</span>
            <p className="text-xs text-rose-300">{error}</p>
          </div>
        )}

        {status && !error && (
          <div className="rounded-xl px-4 py-3 flex items-center gap-2.5" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
            {loading && <div className="w-3.5 h-3.5 border border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin shrink-0" />}
            <p className="text-xs text-emerald-300">{status}</p>
          </div>
        )}

        <button
          onClick={handleConfirm}
          disabled={loading}
          className="w-full py-3.5 rounded-xl text-sm font-bold text-white active:opacity-80 disabled:opacity-40 transition-opacity"
          style={{ background: "linear-gradient(135deg, #10B981, #059669)" }}
        >
          {loading ? "Processing..." : "Confirm & Release Payment"}
        </button>
      </div>
    </div>
  );
}
