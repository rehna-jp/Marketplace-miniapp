/**
 * GET /api/bazaar/orders
 *
 * Returns the order feed.
 * - If contracts are deployed: reads OrderPlaced + DeliveryConfirmed events from Base Sepolia
 * - If contracts are not yet deployed: returns mock data with a `isMock: true` flag
 */

import { NextResponse } from "next/server";
import {
  contractsDeployed,
  fetchOrderEvents,
  fetchDeliveryEvents,
} from "@/lib/base-sepolia";
import { MOCK_ORDERS, MOCK_AGENTS } from "@/features/bazaar/mock-data";

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!contractsDeployed()) {
    return NextResponse.json({
      orders: MOCK_ORDERS,
      agents: MOCK_AGENTS,
      isMock: true,
      contractsDeployed: false,
    });
  }

  try {
    const [orderEvents, deliveryEvents] = await Promise.all([
      fetchOrderEvents(),
      fetchDeliveryEvents(),
    ]);

    // Build set of confirmed order IDs
    const confirmedOrderIds = new Set<string>();
    for (const event of deliveryEvents) {
      const args = event.args as Record<string, unknown>;
      confirmedOrderIds.add(args.orderId?.toString() ?? "");
    }

    // Transform OrderPlaced events
    const orders = orderEvents
      .map((event) => {
        const args = event.args as Record<string, unknown>;
        const orderId = args.orderId?.toString() ?? "0";
        const listingId = args.listingId?.toString() ?? "0";
        const buyerTokenId = args.buyerTokenId?.toString() ?? "0";
        const price = args.price as bigint;
        const priceEth = Number(price) / 1e18;

        const isConfirmed = confirmedOrderIds.has(orderId);

        return {
          id: `ord-${orderId}`,
          listingId: `lst-${listingId}`,
          buyerId: `agent-${buyerTokenId}`,
          sellerId: `agent-unknown`, // Resolved from listing lookup if needed
          serviceType: "data-analysis" as const, // Would be resolved from listing
          priceEth,
          status: isConfirmed ? "SETTLED" : "ESCROWED",
          txHash: event.transactionHash ?? "",
          createdAt: Number(event.blockNumber ?? 0n) * 2000,
          settledAt: isConfirmed ? Date.now() : undefined,
        };
      })
      .sort((a, b) => b.createdAt - a.createdAt);

    // Compute stats
    const settledVolume = orders
      .filter((o) => o.status === "SETTLED")
      .reduce((sum, o) => sum + o.priceEth, 0);

    // If contracts are live but empty, fall back to mock so the feed looks alive
    const finalOrders = orders.length > 0 ? orders : MOCK_ORDERS;
    const usingFallback = orders.length === 0;

    return NextResponse.json({
      orders: finalOrders,
      agents: usingFallback ? MOCK_AGENTS : undefined,
      isMock: usingFallback,
      contractsDeployed: true,
      totalOrders: finalOrders.length,
      settledVolume: usingFallback
        ? MOCK_ORDERS.filter((o) => o.status === "SETTLED").reduce((s, o) => s + o.priceEth, 0)
        : settledVolume,
      liveData: !usingFallback,
    });
  } catch (err) {
    console.error("[/api/bazaar/orders] Error fetching onchain data:", err);
    return NextResponse.json({
      orders: MOCK_ORDERS,
      agents: MOCK_AGENTS,
      isMock: true,
      contractsDeployed: true,
      error: "Failed to fetch onchain data, showing cached data",
    });
  }
}
