/**
 * Base Sepolia viem client + AgentBazaar contract ABIs and read helpers.
 *
 * Usage:
 *   - Drop your deployed contract addresses into CONTRACT_ADDRESSES below.
 *   - Everything else will light up automatically.
 *   - While contracts are undeployed, every read returns null / empty array
 *     and the UI falls back to mock data.
 */

import { createPublicClient, http, parseAbiItem, type Log } from "viem";

/** Viem decoded log with typed event args (added by getLogs when an event ABI is provided). */
export type DecodedLog = Log & { args?: Record<string, unknown> };
import { baseSepolia } from "viem/chains";
import { blockchainConfig } from "@/config/blockchain-config";

// ─── Contract addresses ────────────────────────────────────────────────────
// Fill these in after you deploy. Leaving them as `null` activates mock-data
// fallback throughout the app.

export const CONTRACT_ADDRESSES = blockchainConfig.contracts;

export function contractsDeployed(): boolean {
  return !!(CONTRACT_ADDRESSES.marketplace && CONTRACT_ADDRESSES.escrow);
}

// ─── Public client (read-only, no wallet needed) ───────────────────────────
export const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(blockchainConfig.baseSepolia.rpcUrl, {
    timeout: 10_000, // 10 s — fail fast during build rather than hanging
  }),
});

// ─── Marketplace ABI (minimal — only what the UI needs) ───────────────────
export const MARKETPLACE_ABI = [
  // Events
  parseAbiItem(
    "event ServiceListed(uint256 indexed listingId, uint256 indexed tokenId, string serviceType, uint256 price)"
  ),
  parseAbiItem(
    "event OrderPlaced(uint256 indexed orderId, uint256 indexed listingId, uint256 indexed buyerTokenId, uint256 price)"
  ),
  parseAbiItem(
    "event DeliveryConfirmed(uint256 indexed orderId, uint256 score)"
  ),
  parseAbiItem("event ListingDeactivated(uint256 indexed listingId)"),

  // Read functions
  {
    name: "getListing",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "listingId", type: "uint256" }],
    outputs: [
      { name: "tokenId", type: "uint256" },
      { name: "serviceType", type: "string" },
      { name: "price", type: "uint256" },
      { name: "active", type: "bool" },
      { name: "ordersCompleted", type: "uint256" },
    ],
  },
  {
    name: "getOrder",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "orderId", type: "uint256" }],
    outputs: [
      { name: "listingId", type: "uint256" },
      { name: "buyerTokenId", type: "uint256" },
      { name: "sellerTokenId", type: "uint256" },
      { name: "price", type: "uint256" },
      { name: "status", type: "uint8" },
      { name: "createdAt", type: "uint256" },
    ],
  },
  {
    name: "listingCount",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "orderCount",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

// ─── ERC-8004 Identity Registry ABI ───────────────────────────────────────
export const ERC8004_REGISTRY_ABI = [
  {
    name: "tokenURI",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "string" }],
  },
  {
    name: "ownerOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "address" }],
  },
  {
    name: "totalSupply",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  parseAbiItem(
    "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
  ),
] as const;

// ─── Reputation Registry ABI ───────────────────────────────────────────────
export const REPUTATION_REGISTRY_ABI = [
  {
    name: "getReputation",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [
      { name: "totalScore", type: "uint256" },
      { name: "feedbackCount", type: "uint256" },
    ],
  },
  parseAbiItem(
    "event FeedbackPosted(uint256 indexed tokenId, uint256 score, address indexed poster)"
  ),
] as const;

// ─── Order status mapping ──────────────────────────────────────────────────
export const ORDER_STATUS_MAP: Record<number, string> = {
  0: "PENDING",
  1: "ESCROWED",
  2: "DELIVERED",
  3: "SETTLED",
  4: "REFUNDED",
};

// ─── Helpers ───────────────────────────────────────────────────────────────

/** Fetch all ServiceListed events from the Marketplace contract. */
export async function fetchListingEvents(): Promise<DecodedLog[]> {
  if (!CONTRACT_ADDRESSES.marketplace) return [];
  try {
    return await publicClient.getLogs({
      address: CONTRACT_ADDRESSES.marketplace as `0x${string}`,
      event: parseAbiItem(
        "event ServiceListed(uint256 indexed listingId, uint256 indexed tokenId, string serviceType, uint256 price)"
      ),
      fromBlock: 0n,
      toBlock: "latest",
    });
  } catch {
    return [];
  }
}

/** Fetch all OrderPlaced events from the Marketplace contract. */
export async function fetchOrderEvents(): Promise<DecodedLog[]> {
  if (!CONTRACT_ADDRESSES.marketplace) return [];
  try {
    return await publicClient.getLogs({
      address: CONTRACT_ADDRESSES.marketplace as `0x${string}`,
      event: parseAbiItem(
        "event OrderPlaced(uint256 indexed orderId, uint256 indexed listingId, uint256 indexed buyerTokenId, uint256 price)"
      ),
      fromBlock: 0n,
      toBlock: "latest",
    });
  } catch {
    return [];
  }
}

/** Fetch all DeliveryConfirmed events. */
export async function fetchDeliveryEvents(): Promise<DecodedLog[]> {
  if (!CONTRACT_ADDRESSES.marketplace) return [];
  try {
    return await publicClient.getLogs({
      address: CONTRACT_ADDRESSES.marketplace as `0x${string}`,
      event: parseAbiItem(
        "event DeliveryConfirmed(uint256 indexed orderId, uint256 score)"
      ),
      fromBlock: 0n,
      toBlock: "latest",
    });
  } catch {
    return [];
  }
}

/** Fetch all ERC-8004 mint events (agent registrations). */
export async function fetchAgentMintEvents(): Promise<DecodedLog[]> {
  if (!CONTRACT_ADDRESSES.erc8004Registry) return [];
  try {
    const logs = await publicClient.getLogs({
      address: CONTRACT_ADDRESSES.erc8004Registry as `0x${string}`,
      event: parseAbiItem(
        "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
      ),
      fromBlock: 0n,
      toBlock: "latest",
    });
    // Filter to mint events only (from == zero address) in JS to avoid viem arg-type inference issues
    return logs.filter((log) => {
      const args = (log as unknown as { args?: { from?: string } }).args;
      return args?.from === "0x0000000000000000000000000000000000000000";
    });
  } catch {
    return [];
  }
}

/** Read reputation for a given ERC-8004 token ID. Returns null if not available. */
export async function fetchReputation(
  tokenId: bigint
): Promise<{ score: number } | null> {
  if (!CONTRACT_ADDRESSES.reputationRegistry) return null;
  try {
    const result = await publicClient.readContract({
      address: CONTRACT_ADDRESSES.reputationRegistry as `0x${string}`,
      abi: REPUTATION_REGISTRY_ABI,
      functionName: "getReputation",
      args: [tokenId],
    });
    const [totalScore, feedbackCount] = result as [bigint, bigint];
    if (feedbackCount === 0n) return null;
    const avg = Number((totalScore * 100n) / (feedbackCount * 10n));
    return { score: Math.min(100, Math.max(0, avg)) };
  } catch {
    return null;
  }
}

/** Get the owner address of an ERC-8004 token. */
export async function fetchTokenOwner(tokenId: bigint): Promise<string | null> {
  if (!CONTRACT_ADDRESSES.erc8004Registry) return null;
  try {
    return await publicClient.readContract({
      address: CONTRACT_ADDRESSES.erc8004Registry as `0x${string}`,
      abi: ERC8004_REGISTRY_ABI,
      functionName: "ownerOf",
      args: [tokenId],
    }) as string;
  } catch {
    return null;
  }
}

/** Get the total number of listings. */
export async function fetchListingCount(): Promise<number> {
  if (!CONTRACT_ADDRESSES.marketplace) return 0;
  try {
    const count = await publicClient.readContract({
      address: CONTRACT_ADDRESSES.marketplace as `0x${string}`,
      abi: MARKETPLACE_ABI,
      functionName: "listingCount",
    }) as bigint;
    return Number(count);
  } catch {
    return 0;
  }
}

/** Get the total number of orders. */
export async function fetchOrderCount(): Promise<number> {
  if (!CONTRACT_ADDRESSES.marketplace) return 0;
  try {
    const count = await publicClient.readContract({
      address: CONTRACT_ADDRESSES.marketplace as `0x${string}`,
      abi: MARKETPLACE_ABI,
      functionName: "orderCount",
    }) as bigint;
    return Number(count);
  } catch {
    return 0;
  }
}
