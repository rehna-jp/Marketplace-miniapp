"use client";

import { useEffect, useState, useCallback } from "react";
import { ShareButton } from "@/neynar-farcaster-sdk/mini";
import { useSDKReady } from "@/neynar-farcaster-sdk/src/mini/app/farcaster-app-atoms";
import { HomeScreen } from "@/features/app/screens/home-screen";
import { RegisterScreen } from "@/features/app/screens/register-screen";
import { ListServiceScreen } from "@/features/app/screens/list-service-screen";
import { PlaceOrderScreen } from "@/features/app/screens/place-order-screen";
import { DashboardScreen } from "@/features/app/screens/dashboard-screen";
import { ConfirmDeliveryScreen } from "@/features/app/screens/confirm-delivery-screen";
import type { Screen } from "@/features/app/screens/screen-types";
import { formatAddress } from "@/lib/contracts";

// Persist agentId per wallet address so it survives page refreshes
function loadPersistedAgentId(address: string): number | null {
  try {
    const key = `agentId:${address.toLowerCase()}`;
    const val = localStorage.getItem(key);
    return val ? parseInt(val, 10) : null;
  } catch { return null; }
}

function saveAgentId(address: string, id: number | null) {
  try {
    const key = `agentId:${address.toLowerCase()}`;
    if (id === null) localStorage.removeItem(key);
    else localStorage.setItem(key, String(id));
  } catch { /* storage unavailable */ }
}

export function MiniApp() {
  const sdkReady = useSDKReady(); // true once sdk.actions.ready() completes
  const [screen, setScreen] = useState<Screen>({ id: "home" });
  const [screenHistory, setScreenHistory] = useState<Screen[]>([]);
  const [agentId, setAgentId] = useState<number | null>(null);
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
  const [walletLoading, setWalletLoading] = useState(true);
  const [connectingManual, setConnectingManual] = useState(false);

  // When agentId changes, persist it against the current address
  const updateAgentId = useCallback((id: number | null, address?: string | null) => {
    setAgentId(id);
    const addr = address ?? connectedAddress;
    if (addr) saveAgentId(addr, id);
  }, [connectedAddress]);

  const connectWallet = useCallback(async () => {
    try {
      setWalletLoading(true);
      const miniappSdk = (await import("@farcaster/miniapp-sdk")).default;

      // Try Farcaster wallet — only available after sdk.actions.ready() completes
      const ethProvider = await miniappSdk.wallet.getEthereumProvider();

      if (ethProvider) {
        // Inside Warpcast — read address silently, no prompt needed
        const accounts = await (ethProvider as { request: (a: { method: string }) => Promise<string[]> })
          .request({ method: "eth_accounts" });
        if (accounts?.[0]) {
          setConnectedAddress(accounts[0]);
          const persisted = loadPersistedAgentId(accounts[0]);
          if (persisted !== null) setAgentId(persisted);
        }
      } else {
        // Outside Warpcast — try window.ethereum silently (no prompt)
        const w = typeof window !== "undefined"
          ? (window as unknown as { ethereum?: { request: (a: { method: string }) => Promise<string[]> } }).ethereum
          : null;
        if (w) {
          const accounts = await w.request({ method: "eth_accounts" });
          if (accounts?.[0]) {
            setConnectedAddress(accounts[0]);
            const persisted = loadPersistedAgentId(accounts[0]);
            if (persisted !== null) setAgentId(persisted);
          }
        }
      }
    } catch {
      // Wallet unavailable — silent fail
    } finally {
      setWalletLoading(false);
    }
  }, []);

  // Called when user taps "Connect Wallet" — explicitly requests accounts (browser only)
  // IMPORTANT: never create ethers.BrowserProvider(window.ethereum) — MetaMask's eth_chainId
  // response format crashes ethers v6 internal parser. Use raw JSON-RPC only.
  const manualConnect = useCallback(async () => {
    try {
      setConnectingManual(true);
      type RawWallet = { request: (a: { method: string; params?: unknown[] }) => Promise<string[]> };
      const w = typeof window !== "undefined"
        ? (window as unknown as { ethereum?: RawWallet }).ethereum
        : null;
      if (!w) return; // no wallet — banner stays visible
      // Prompt MetaMask to unlock (shows the MetaMask popup)
      await w.request({ method: "eth_requestAccounts" });
      // Read the address directly without creating BrowserProvider
      const accounts = await w.request({ method: "eth_accounts" });
      if (accounts?.[0]) {
        setConnectedAddress(accounts[0]);
        const persisted = loadPersistedAgentId(accounts[0]);
        if (persisted !== null) setAgentId(persisted);
      }
    } catch {
      // user rejected or no wallet
    } finally {
      setConnectingManual(false);
    }
  }, []);

  // In Warpcast: wait for SDK ready signal before connecting (avoids race condition)
  useEffect(() => {
    if (sdkReady) connectWallet();
  }, [sdkReady, connectWallet]);

  // In browser: sdkReady never fires — fallback after short delay
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!sdkReady) connectWallet();
    }, 1500);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync agentId from localStorage whenever connectedAddress changes
  useEffect(() => {
    if (connectedAddress && agentId === null) {
      const persisted = loadPersistedAgentId(connectedAddress);
      if (persisted !== null) setAgentId(persisted);
    }
  }, [connectedAddress, agentId]);

  function navigate(next: Screen) {
    setScreenHistory((h) => [...h, screen]);
    setScreen(next);
  }

  function goBack() {
    const prev = screenHistory[screenHistory.length - 1];
    if (prev) {
      setScreenHistory((h) => h.slice(0, -1));
      setScreen(prev);
    } else {
      setScreen({ id: "home" });
    }
  }

  function renderScreen() {
    switch (screen.id) {
      case "home":
        return (
          <HomeScreen
            agentId={agentId}
            connectedAddress={connectedAddress}
            onNavigate={navigate}
          />
        );
      case "register":
        return (
          <RegisterScreen
            agentId={agentId}
            onAgentRegistered={(id) => {
              updateAgentId(id);
              connectWallet(); // refresh address after wallet interaction
            }}
            onNavigate={navigate}
            onBack={goBack}
          />
        );
      case "list-service":
        return (
          <ListServiceScreen
            agentId={agentId}
            onNavigate={navigate}
            onBack={goBack}
          />
        );
      case "place-order":
        return (
          <PlaceOrderScreen
            listingId={screen.listingId}
            listing={screen.listing}
            agentId={agentId}
            connectedAddress={connectedAddress}
            onNavigate={navigate}
            onBack={goBack}
          />
        );
      case "dashboard":
        return (
          <DashboardScreen
            agentId={agentId}
            connectedAddress={connectedAddress}
            onNavigate={navigate}
            onBack={goBack}
          />
        );
      case "confirm-delivery":
        return (
          <ConfirmDeliveryScreen
            orderId={screen.orderId}
            order={screen.order}
            onNavigate={navigate}
            onBack={goBack}
          />
        );
      default:
        return null;
    }
  }

  return (
    <div
      className="h-dvh flex flex-col overflow-hidden"
      style={{ background: "#080810" }}
    >
      {/* Header */}
      <header
        className="shrink-0 px-4 py-3 border-b flex items-center justify-between"
        style={{ borderColor: "rgba(124, 58, 237, 0.15)", background: "rgba(0,0,0,0.4)" }}
      >
        <button
          onClick={() => { setScreen({ id: "home" }); setScreenHistory([]); }}
          className="flex items-center gap-2.5"
        >
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1L12.196 4V10L7 13L1.804 10V4L7 1Z" stroke="white" strokeWidth="1.5" fill="none"/>
              <path d="M7 4L9.598 5.5V8.5L7 10L4.402 8.5V5.5L7 4Z" fill="white" opacity="0.6"/>
            </svg>
          </div>
          <div>
            <div className="text-sm font-bold text-white leading-none">AgentBazaar</div>
            <div className="text-[9px] text-violet-400/70 font-mono uppercase tracking-widest mt-0.5">
              {walletLoading ? "connecting..." : connectedAddress ? formatAddress(connectedAddress) : "Base Sepolia"}
            </div>
          </div>
        </button>
        <div className="flex items-center gap-2">
          {!walletLoading && !connectedAddress && (
            <button
              onClick={manualConnect}
              disabled={connectingManual}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-white disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #7C3AED, #4F46E5)" }}
            >
              {connectingManual ? "Connecting..." : "Connect Wallet"}
            </button>
          )}
          {connectedAddress && (
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-emerald-400/80 font-mono uppercase tracking-wide">Live</span>
            </div>
          )}
          <ShareButton
            text="Check out AgentBazaar — where AI agents trade autonomously on Farcaster 🤖⚡"
            queryParams={{ shareType: "marketplace" }}
            variant="outline"
            size="sm"
          >
            Share
          </ShareButton>
        </div>
      </header>

      {/* Wallet not connected banner */}
      {!walletLoading && !connectedAddress && (
        <div className="shrink-0 mx-4 mt-3 rounded-2xl px-4 py-3 flex items-center justify-between gap-3"
          style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)" }}>
          <div>
            <p className="text-xs font-bold text-violet-300">Wallet not connected</p>
            <p className="text-[10px] text-gray-500 mt-0.5">Connect to register, list, or buy services</p>
          </div>
          <button
            onClick={manualConnect}
            disabled={connectingManual}
            className="shrink-0 px-3 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #7C3AED, #4F46E5)" }}
          >
            {connectingManual ? "..." : "Connect"}
          </button>
        </div>
      )}

      {/* Screen content */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        {renderScreen()}
      </div>
    </div>
  );
}
