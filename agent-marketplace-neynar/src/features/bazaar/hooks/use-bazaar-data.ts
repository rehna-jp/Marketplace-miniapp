"use client";

/**
 * useBazaarData — fetches live AgentBazaar data from the API routes.
 *
 * Returns agents, listings, and orders from onchain sources when contracts
 * are deployed, otherwise returns mock data transparently.
 *
 * Polling interval: 15s for orders, 30s for listings, 60s for agents.
 */

import { useQuery } from "@tanstack/react-query";
import type { Agent, Listing, Order } from "@/features/bazaar/types";

interface BazaarListingsResponse {
  listings: Listing[];
  agents?: Agent[];
  isMock: boolean;
  contractsDeployed: boolean;
  error?: string;
}

interface BazaarOrdersResponse {
  orders: Order[];
  agents?: Agent[];
  isMock: boolean;
  contractsDeployed: boolean;
  settledVolume?: number;
  error?: string;
}

interface BazaarAgentsResponse {
  agents: Agent[];
  isMock: boolean;
  contractsDeployed: boolean;
  privyConnected: boolean;
  privyWalletCount: number;
  error?: string;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`${url} returned ${res.status}`);
  return res.json() as Promise<T>;
}

export function useBazaarListings() {
  return useQuery<BazaarListingsResponse>({
    queryKey: ["bazaar", "listings"],
    queryFn: () => fetchJson<BazaarListingsResponse>("/api/bazaar/listings"),
    refetchInterval: 30_000,
    staleTime: 15_000,
    retry: 2,
  });
}

export function useBazaarOrders() {
  return useQuery<BazaarOrdersResponse>({
    queryKey: ["bazaar", "orders"],
    queryFn: () => fetchJson<BazaarOrdersResponse>("/api/bazaar/orders"),
    refetchInterval: 15_000,
    staleTime: 10_000,
    retry: 2,
  });
}

export function useBazaarAgents() {
  return useQuery<BazaarAgentsResponse>({
    queryKey: ["bazaar", "agents"],
    queryFn: () => fetchJson<BazaarAgentsResponse>("/api/bazaar/agents"),
    refetchInterval: 60_000,
    staleTime: 30_000,
    retry: 2,
  });
}

/** Convenience hook — returns all three datasets. */
export function useBazaarData() {
  const listings = useBazaarListings();
  const orders = useBazaarOrders();
  const agents = useBazaarAgents();

  const isMock =
    (listings.data?.isMock ?? true) ||
    (orders.data?.isMock ?? true) ||
    (agents.data?.isMock ?? true);

  const contractsDeployed =
    (listings.data?.contractsDeployed ?? false) &&
    (orders.data?.contractsDeployed ?? false);

  const isLoading =
    listings.isLoading || orders.isLoading || agents.isLoading;

  return {
    listings: listings.data?.listings ?? [],
    orders: orders.data?.orders ?? [],
    agents: agents.data?.agents ?? [],
    isMock,
    contractsDeployed,
    isLoading,
    privyConnected: agents.data?.privyConnected ?? false,
    privyWalletCount: agents.data?.privyWalletCount ?? 0,
    refetchAll: () => {
      void listings.refetch();
      void orders.refetch();
      void agents.refetch();
    },
  };
}
