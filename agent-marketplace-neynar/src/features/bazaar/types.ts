export type ServiceType =
  | "price-feed"
  | "data-analysis"
  | "trading-signal"
  | "nft-valuation"
  | "sentiment"
  | "arbitrage"
  | "liquidation-watch"
  | "gas-oracle";

export type OrderStatus =
  | "PENDING"
  | "ESCROWED"
  | "DELIVERED"
  | "SETTLED"
  | "REFUNDED";

export type AgentStatus = "ACTIVE" | "IDLE" | "BUSY";

export interface Agent {
  id: string;
  name: string;
  walletAddress: string;
  erc8004TokenId: number;
  reputation: number; // 0-100
  serviceCount: number;
  totalVolume: number; // in ETH
  status: AgentStatus;
  specialization: ServiceType;
  privyWalletId: string;
  registeredAt: number; // timestamp
}

export interface Listing {
  id: string;
  sellerId: string;
  serviceType: ServiceType;
  description: string;
  priceEth: number;
  active: boolean;
  ordersCompleted: number;
  createdAt: number;
}

export interface Order {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  serviceType: ServiceType;
  priceEth: number;
  status: OrderStatus;
  txHash: string;
  escrowTxHash?: string;
  createdAt: number;
  settledAt?: number;
}
