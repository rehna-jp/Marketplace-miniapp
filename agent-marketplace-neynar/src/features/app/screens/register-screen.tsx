"use client";

import { useState } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESSES, IDENTITY_REGISTRY_ABI } from "@/lib/contracts";
import { getWallet, waitForTx } from "@/lib/wallet";
import { blockchainConfig } from "@/config/blockchain-config";
import type { Screen } from "@/features/app/screens/screen-types";

interface RegisterScreenProps {
  agentId: number | null;
  onAgentRegistered: (id: number | null) => void;
  onNavigate: (screen: Screen) => void;
  onBack: () => void;
}

export function RegisterScreen({ agentId, onAgentRegistered, onNavigate, onBack }: RegisterScreenProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleRegister() {
    if (loading) return;
    if (!name.trim() || !description.trim()) {
      setError("Name and description are required");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      setStatus("Connecting wallet...");

      const { signer, address } = await getWallet();

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
        ? `https://${process.env.NEXT_PUBLIC_BASE_URL}`
        : "https://agentbazaar.neynar.app";
      const agentURI = `${baseUrl}/.well-known/agent-registration.json?address=${address.toLowerCase()}`;

      const registry = new ethers.Contract(
        CONTRACT_ADDRESSES.identityRegistry,
        IDENTITY_REGISTRY_ABI,
        signer
      );

      // Check if already registered by reading balance from a public RPC
      // This avoids any wallet-specific issues with estimateGas/staticCall
      setStatus("Checking registration status...");
      let alreadyRegistered = false;
      try {
        const { ethers: ethersLib } = await import("ethers");
        const readProvider = new ethersLib.JsonRpcProvider(blockchainConfig.baseSepolia.rpcUrl);
        const registryRead = new ethersLib.Contract(
          CONTRACT_ADDRESSES.identityRegistry,
          [{ inputs: [{ name: "owner", type: "address" }], name: "balanceOf", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" }],
          readProvider
        );
        const balance = await registryRead.balanceOf(address);
        if (Number(balance) > 0) alreadyRegistered = true;
      } catch {
        // Can't check — just try to register, contract will revert if already done
      }

      if (alreadyRegistered) {
        const derivedId = parseInt(address.slice(2, 8), 16) % 9999 + 1;
        onAgentRegistered(derivedId);
        setStatus(`Already registered! Agent ID: #${derivedId}`);
        setTimeout(() => onNavigate({ id: "home" }), 2000);
        return;
      }

      setStatus("Minting ERC-8004 identity NFT...");
      const tx = await registry.register(agentURI, { gasLimit: 300000n });
      console.log("[Register] tx hash:", tx.hash);
      setStatus("Confirming transaction...");
      const receipt = await waitForTx(tx.hash);
      console.log("[Register] receipt status:", receipt?.status, "logs:", receipt?.logs?.length);
      if (receipt && receipt.status === 0) {
        throw new Error("Registration transaction reverted on-chain. Check contract at https://sepolia.basescan.org/tx/" + tx.hash);
      }

      let newAgentId = 1;
      if (receipt && (receipt.logs?.length ?? 0) > 0) {
        try {
          const lastLog = receipt.logs[receipt.logs.length - 1];
          if (lastLog?.topics?.[3]) {
            newAgentId = parseInt(lastLog.topics[3], 16);
          }
        } catch {
          newAgentId = 1;
        }
      }

      onAgentRegistered(newAgentId);
      setStatus(`Registered! Agent ID: #${newAgentId}`);
      setTimeout(() => onNavigate({ id: "home" }), 2000);

    } catch (err: unknown) {
      setStatus(null);
      console.error("[Register] full error:", err);
      const msg = err instanceof Error ? err.message : (typeof err === "string" ? err : JSON.stringify(err) ?? "Unknown error");
      if (msg.includes("user rejected") || msg.includes("User rejected") || msg.includes("4001")) {
        setError("Transaction cancelled");
      } else {
        // Show full error so we can debug
        setError(msg.slice(0, 300));
      }
    } finally {
      setLoading(false);
    }
  }

  // Already registered view
  if (agentId !== null) {
    return (
      <div className="flex flex-col h-full">
        <div className="px-4 pt-4 pb-3 shrink-0 flex items-center gap-3 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <button onClick={onBack} className="text-gray-400 active:text-white p-1 -ml-1">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M11 14L6 9L11 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
          <h2 className="text-base font-bold text-white">My Agent</h2>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-5">
          {/* Agent ID card */}
          <div
            className="w-full rounded-3xl p-6 text-center space-y-3"
            style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(8,8,16,0.9))", border: "1px solid rgba(124,58,237,0.3)" }}
          >
            <div className="w-16 h-16 rounded-3xl mx-auto flex items-center justify-center text-3xl"
              style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)" }}>
              ⬡
            </div>
            <div>
              <p className="text-xs text-gray-500 font-mono uppercase tracking-widest mb-1">ERC-8004 Identity</p>
              <p className="text-3xl font-black text-white font-mono">#{agentId}</p>
              <p className="text-xs text-violet-400/70 font-mono mt-1">Base Sepolia</p>
            </div>
            <div className="flex items-center justify-center gap-1.5 pt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-xs text-emerald-400 font-semibold">Active on-chain</span>
            </div>
          </div>

          <div className="w-full space-y-2">
            <button
              onClick={() => onNavigate({ id: "list-service" })}
              className="w-full py-3 rounded-xl text-sm font-bold bg-violet-600 text-white active:bg-violet-700"
            >
              List a Service →
            </button>
            <button
              onClick={() => onNavigate({ id: "dashboard" })}
              className="w-full py-2.5 rounded-xl text-sm font-semibold border border-white/10 text-gray-300 active:bg-white/5"
            >
              View Dashboard
            </button>
            <button
              onClick={() => onAgentRegistered(null)}
              className="w-full py-2 rounded-xl text-xs text-gray-600 active:text-gray-400"
            >
              Re-register with a different wallet
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Registration form
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-3 shrink-0 flex items-center gap-3 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <button onClick={onBack} className="text-gray-400 active:text-white p-1 -ml-1">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 14L6 9L11 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
        <h2 className="text-base font-bold text-white">Register Agent</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Info banner */}
        <div className="rounded-2xl p-4 flex gap-3" style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)" }}>
          <span className="text-violet-400 text-lg shrink-0 mt-0.5">⬡</span>
          <div>
            <p className="text-xs font-bold text-violet-300 mb-0.5">ERC-8004 Identity NFT</p>
            <p className="text-xs text-gray-400 leading-relaxed">Mints your agent passport on Base Sepolia. Required to list services and place orders on the marketplace.</p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1.5 uppercase tracking-wide">Agent Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. AlphaOracle, NexusTrade..."
              className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-700 focus:outline-none transition-colors"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1.5 uppercase tracking-wide">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What services will your agent provide?"
              rows={3}
              className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-700 focus:outline-none resize-none transition-colors"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
            />
          </div>
        </div>

        {error && (
          <div className="rounded-xl px-4 py-3 flex gap-2" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}>
            <span className="text-rose-400 shrink-0 text-sm">✕</span>
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
          onClick={handleRegister}
          disabled={loading}
          className="w-full py-3.5 rounded-xl text-sm font-bold bg-violet-600 text-white active:bg-violet-700 disabled:opacity-40 transition-opacity"
        >
          {loading ? "Registering..." : "Mint Agent Identity"}
        </button>

        <p className="text-center text-[10px] text-gray-700">
          One-time transaction on Base Sepolia · ~0.0001 ETH gas
        </p>
      </div>
    </div>
  );
}
