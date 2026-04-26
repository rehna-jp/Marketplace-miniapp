/**
 * Privy server-side agent wallet helpers.
 *
 * Privy is the foundational primitive for AgentBazaar — each agent gets a
 * server-side embedded wallet that can sign and submit transactions without
 * any human approval.
 *
 * Docs: https://docs.privy.io/guide/server/wallets
 */

import { privateConfig } from "@/config/private-config";

// Pulled from the centralised private config so process.env is only accessed
// in config files (required by the @neynar/no-process-env ESLint rule).
const PRIVY_APP_ID = privateConfig.privyAppId || "cmnzht0mt011g0cl8cr6w03bt";
const PRIVY_APP_SECRET = privateConfig.privyAppSecret;

const PRIVY_API_BASE = "https://auth.privy.io/api/v1";

interface PrivyWallet {
  id: string;
  address: string;
  chain_type: string;
  created_at: string;
}

interface PrivyUser {
  id: string;
  created_at: string;
  linked_accounts: Array<{
    type: string;
    address?: string;
    wallet_client?: string;
    wallet_client_type?: string;
    chain_type?: string;
  }>;
}

function privyHeaders() {
  const credentials = Buffer.from(
    `${PRIVY_APP_ID}:${PRIVY_APP_SECRET}`
  ).toString("base64");
  return {
    Authorization: `Basic ${credentials}`,
    "privy-app-id": PRIVY_APP_ID,
    "Content-Type": "application/json",
  };
}

/**
 * Create a new Privy server-side wallet for an agent.
 * Returns the wallet ID and Ethereum address.
 */
export async function createAgentWallet(): Promise<PrivyWallet | null> {
  if (!PRIVY_APP_ID || !PRIVY_APP_SECRET) {
    console.warn("[Privy] PRIVY_APP_ID or PRIVY_APP_SECRET not set");
    return null;
  }
  try {
    const res = await fetch(`${PRIVY_API_BASE}/wallets`, {
      method: "POST",
      headers: privyHeaders(),
      body: JSON.stringify({ chain_type: "ethereum" }),
    });
    if (!res.ok) {
      console.error("[Privy] createAgentWallet failed:", await res.text());
      return null;
    }
    return (await res.json()) as PrivyWallet;
  } catch (err) {
    console.error("[Privy] createAgentWallet error:", err);
    return null;
  }
}

/**
 * Fetch an existing Privy wallet by ID.
 */
export async function getAgentWallet(walletId: string): Promise<PrivyWallet | null> {
  if (!PRIVY_APP_ID || !PRIVY_APP_SECRET) return null;
  try {
    const res = await fetch(`${PRIVY_API_BASE}/wallets/${walletId}`, {
      headers: privyHeaders(),
    });
    if (!res.ok) return null;
    return (await res.json()) as PrivyWallet;
  } catch {
    return null;
  }
}

/**
 * List all wallets provisioned under this Privy app.
 * Useful for agent discovery and registry population.
 */
export async function listAgentWallets(): Promise<PrivyWallet[]> {
  if (!PRIVY_APP_ID || !PRIVY_APP_SECRET) return [];
  try {
    const res = await fetch(`${PRIVY_API_BASE}/wallets?limit=100`, {
      headers: privyHeaders(),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return [];
    const data = await res.json() as { data?: PrivyWallet[] };
    return data.data ?? [];
  } catch {
    return [];
  }
}

/**
 * Request Privy to sign and submit a transaction on behalf of an agent wallet.
 * This is how agents transact autonomously — no human signing required.
 *
 * @param walletId - The Privy wallet ID of the agent
 * @param transaction - EVM transaction object (to, data, value, etc.)
 */
export async function sendAgentTransaction(
  walletId: string,
  transaction: {
    to: string;
    data?: string;
    value?: string;
    chainId?: number;
  }
): Promise<{ hash: string } | null> {
  if (!PRIVY_APP_ID || !PRIVY_APP_SECRET) return null;
  try {
    const res = await fetch(`${PRIVY_API_BASE}/wallets/${walletId}/rpc`, {
      method: "POST",
      headers: privyHeaders(),
      body: JSON.stringify({
        method: "eth_sendTransaction",
        caip2: "eip155:84532", // Base Sepolia
        params: {
          transaction: {
            to: transaction.to,
            data: transaction.data ?? "0x",
            value: transaction.value ?? "0x0",
            chainId: transaction.chainId ?? 84532,
          },
        },
      }),
    });
    if (!res.ok) {
      console.error("[Privy] sendAgentTransaction failed:", await res.text());
      return null;
    }
    const result = await res.json() as { data?: { hash: string } };
    return result.data ? { hash: result.data.hash } : null;
  } catch (err) {
    console.error("[Privy] sendAgentTransaction error:", err);
    return null;
  }
}

/**
 * Get all Privy users (agents) registered in this app.
 */
export async function listPrivyUsers(): Promise<PrivyUser[]> {
  if (!PRIVY_APP_ID || !PRIVY_APP_SECRET) return [];
  try {
    const res = await fetch(`${PRIVY_API_BASE}/users?limit=100`, {
      headers: privyHeaders(),
    });
    if (!res.ok) return [];
    const data = await res.json() as { data?: PrivyUser[] };
    return data.data ?? [];
  } catch {
    return [];
  }
}

/**
 * Check if Privy is fully configured (both App ID and secret are set).
 */
export function isPrivyConfigured(): boolean {
  return !!(PRIVY_APP_ID && PRIVY_APP_SECRET);
}
