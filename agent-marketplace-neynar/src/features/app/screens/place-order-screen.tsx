"use client";

import { useState } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESSES, MARKETPLACE_ABI, formatAddress, weiToEth, formatEthAmount } from "@/lib/contracts";
import { getWallet, waitForTx } from "@/lib/wallet";
import type { OnchainListing, Screen } from "@/features/app/screens/screen-types";

interface PlaceOrderScreenProps {
  listingId: number;
  listing: OnchainListing;
  agentId: number | null;
  connectedAddress: string | null;
  onNavigate: (screen: Screen) => void;
  onBack: () => void;
}

export function PlaceOrderScreen({ listingId, listing, agentId, connectedAddress, onNavigate, onBack }: PlaceOrderScreenProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const priceBigInt = BigInt(listing.price.toString());
  const priceEth = weiToEth(priceBigInt);
  console.log("[PlaceOrder] listing.price raw:", listing.price, "typeof:", typeof listing.price, "priceBigInt:", priceBigInt.toString());

  async function handlePlaceOrder() {
    if (loading) return;
    if (!agentId) { onNavigate({ id: "register" }); return; }
    if (!listing.active) { setError("This listing is no longer active"); return; }
    if (connectedAddress && connectedAddress.toLowerCase() === listing.seller.toLowerCase()) {
      setError("You can't buy your own listing");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      setStatus("Connecting wallet...");
      const { signer, address } = await getWallet();
      if (address.toLowerCase() === listing.seller.toLowerCase()) {
        setError("You can't buy your own listing");
        setLoading(false);
        setStatus(null);
        return;
      }
      setStatus("Locking ETH in escrow...");
      const marketplace = new ethers.Contract(CONTRACT_ADDRESSES.marketplace, MARKETPLACE_ABI, signer);
      const tx = await marketplace.placeOrder(listingId, agentId, {
        value: priceBigInt,
        gasLimit: 400000n,
      });
      setStatus("Confirming on-chain...");
      const receipt = await waitForTx(tx.hash);
      if (receipt && receipt.status === 0) {
        throw new Error("Transaction reverted — check you have enough ETH and the listing is still active.");
      }
      console.log("[PlaceOrder] receipt logs:", receipt?.logs);
      let orderId = "?";
      try {
        if (receipt?.logs?.[0]?.topics?.[1]) {
          orderId = String(parseInt(receipt.logs[0].topics[1], 16));
        }
      } catch { /* no-op */ }
      setStatus(`Order #${orderId} placed! ETH locked in escrow.`);
      setTimeout(() => onNavigate({ id: "dashboard" }), 2500);
    } catch (err: unknown) {
      setLoading(false);
      setStatus(null);
      console.error("[PlaceOrder] error:", err);
      if (err instanceof Error) {
        if (err.message.includes("user rejected") || err.message.includes("User rejected")) {
          setError("Transaction cancelled");
        } else if (err.message.toLowerCase().includes("insufficient")) {
          setError("Not enough ETH to place this order");
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

  const serviceLabel = listing.serviceType.replace(/-/g, " ");

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-3 shrink-0 flex items-center gap-3 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <button onClick={onBack} className="text-gray-400 active:text-white p-1 -ml-1">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 14L6 9L11 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
        <h2 className="text-base font-bold text-white">Place an Order</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

        {/* Order summary card */}
        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(124,58,237,0.3)" }}>
          {/* Header */}
          <div className="px-4 py-3" style={{ background: "rgba(124,58,237,0.12)" }}>
            <p className="text-[10px] font-mono text-violet-400/70 uppercase tracking-widest">Order Summary</p>
          </div>
          {/* Rows */}
          <div className="px-4 py-3 space-y-3" style={{ background: "rgba(8,8,16,0.8)" }}>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Service</span>
              <span className="text-xs font-bold text-white capitalize">{serviceLabel}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Listing</span>
              <span className="text-xs font-mono text-gray-300">#{listingId}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Seller</span>
              <span className="text-xs font-mono text-gray-300">{formatAddress(listing.seller)}</span>
            </div>
            <div className="h-px" style={{ background: "rgba(124,58,237,0.15)" }} />
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-gray-300">Total</span>
              <div className="text-right">
                <span className="text-xl font-black text-amber-400">{formatEthAmount(listing.price)}</span>
                <span className="text-sm font-bold text-amber-400/70 ml-1">ETH</span>
              </div>
            </div>
          </div>
        </div>

        {/* Escrow note */}
        <div className="rounded-xl px-4 py-3 flex gap-3" style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)" }}>
          <span className="text-amber-400 shrink-0 mt-0.5">🔒</span>
          <p className="text-[11px] text-amber-300/70 leading-relaxed">
            ETH is held in escrow and only released when you confirm delivery. If undelivered, you can claim a full refund after the deadline.
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
          onClick={handlePlaceOrder}
          disabled={loading}
          className="w-full py-3.5 rounded-xl text-sm font-bold text-black active:opacity-80 disabled:opacity-40 transition-opacity"
          style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)" }}
        >
          {loading ? "Processing..." : `Pay ${formatEthAmount(listing.price)} ETH`}
        </button>

        <p className="text-center text-[10px] text-gray-700">
          Your wallet will prompt you to sign · funds go into escrow
        </p>
      </div>
    </div>
  );
}
