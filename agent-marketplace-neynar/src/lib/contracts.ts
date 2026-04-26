"use client";

import { formatEther, parseEther } from "ethers";

/**
 * Contract ABIs and addresses for AgentBazaar on Base Sepolia.
 * All interactions use the Farcaster-injected wallet via miniapp SDK.
 */

export const CHAIN_ID = 84532; // Base Sepolia

export const CONTRACT_ADDRESSES = {
  marketplace: "0x2cfBbD9362dc4756405eA8780e50DA58fe472c5a",
  escrow: "0x9074A0d383f8043aE297d1d4eF318EDc1231b783",
  identityRegistry: "0x8004A818BFB912233c491871b3d84c89A494BD9e",
  reputationRegistry: "0x8004B663056A597Dffe9eCcC1965A193B7388713",
} as const;

export const MARKETPLACE_ABI = [
  {
    inputs: [{ internalType: "uint256", name: "listingId", type: "uint256" }],
    name: "claimRefund",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "orderId", type: "uint256" },
      { internalType: "uint8", name: "score", type: "uint8" },
    ],
    name: "confirmDelivery",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "listingId", type: "uint256" }],
    name: "deactivateListing",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "string", name: "serviceType", type: "string" },
      { internalType: "uint256", name: "price", type: "uint256" },
      { internalType: "uint256", name: "tokenId", type: "uint256" },
    ],
    name: "listService",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "listingCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "listings",
    outputs: [
      { internalType: "address", name: "seller", type: "address" },
      { internalType: "uint256", name: "sellerTokenId", type: "uint256" },
      { internalType: "string", name: "serviceType", type: "string" },
      { internalType: "uint256", name: "price", type: "uint256" },
      { internalType: "bool", name: "active", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "orderCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "orders",
    outputs: [
      { internalType: "uint256", name: "listingId", type: "uint256" },
      { internalType: "address", name: "buyer", type: "address" },
      { internalType: "uint256", name: "buyerTokenId", type: "uint256" },
      { internalType: "address", name: "seller", type: "address" },
      { internalType: "uint256", name: "sellerTokenId", type: "uint256" },
      { internalType: "uint256", name: "price", type: "uint256" },
      { internalType: "uint256", name: "deadline", type: "uint256" },
      { internalType: "uint8", name: "status", type: "uint8" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "listingId", type: "uint256" },
      { internalType: "uint256", name: "buyerTokenId", type: "uint256" },
    ],
    name: "placeOrder",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "payable",
    type: "function",
  },
] as const;

export const IDENTITY_REGISTRY_ABI = [
  {
    inputs: [
      { name: "agentURI", type: "string" },
    ],
    name: "register",
    outputs: [{ name: "agentId", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "ownerOf",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "tokenURI",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// Order status enum mapping (0=None, 1=Pending, 2=Delivered, 3=Refunded)
export const ORDER_STATUS: Record<number, string> = {
  0: "NONE",
  1: "PENDING",
  2: "DELIVERED",
  3: "REFUNDED",
};

export function formatAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function formatEth(wei: bigint): string {
  return `${Number(formatEther(wei)).toFixed(4)} ETH`;
}

export function weiToEth(wei: bigint | number | string): number {
  // Coerce to BigInt safely — contract values can arrive as number or string
  // depending on how ethers decoded them
  let bn: bigint;
  try {
    bn = BigInt(wei.toString());
  } catch {
    return 0;
  }
  return parseFloat(formatEther(bn));
}

/** Format an ETH amount with enough decimals to display small values correctly */
export function formatEthAmount(wei: bigint | number | string): string {
  const v = weiToEth(wei);
  if (v === 0) return "0";
  if (v < 0.0001) return v.toFixed(8);
  if (v < 0.01) return v.toFixed(6);
  return v.toFixed(4);
}

export function ethToWei(eth: string): bigint {
  // ethers.parseEther handles decimal precision correctly
  return parseEther(eth);
}
