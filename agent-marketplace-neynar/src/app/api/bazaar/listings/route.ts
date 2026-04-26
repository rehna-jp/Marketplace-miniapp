/**
 * GET /api/bazaar/listings
 *
 * Returns active service listings.
 * - If contracts are deployed: reads ServiceListed events from Marketplace.sol on Base Sepolia
 * - If contracts are not yet deployed: returns mock data with a `isMock: true` flag
 */

import { NextResponse } from "next/server";
import {
  contractsDeployed,
  fetchListingEvents,
  fetchDeliveryEvents,
} from "@/lib/base-sepolia";
import { MOCK_LISTINGS, MOCK_AGENTS } from "@/features/bazaar/mock-data";

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!contractsDeployed()) {
    // Contracts not deployed yet — return mock data
    return NextResponse.json({
      listings: MOCK_LISTINGS,
      agents: MOCK_AGENTS,
      isMock: true,
      contractsDeployed: false,
    });
  }

  try {
    // Fetch ServiceListed and DeliveryConfirmed events in parallel
    const [listingEvents, deliveryEvents] = await Promise.all([
      fetchListingEvents(),
      fetchDeliveryEvents(),
    ]);

    // Build a map of orderId -> confirmed to count fulfilled orders per listing
    const deliveredByListing = new Map<string, number>();
    for (const event of deliveryEvents) {
      const args = event.args as Record<string, unknown>;
      const orderId = args.orderId?.toString() ?? "";
      const listingId = args.listingId?.toString() ?? "";
      if (listingId) {
        deliveredByListing.set(listingId, (deliveredByListing.get(listingId) ?? 0) + 1);
      }
      void orderId;
    }

    // Transform events into Listing objects
    const listings = listingEvents.map((event) => {
      const args = event.args as Record<string, unknown>;
      const listingId = args.listingId?.toString() ?? "0";
      const tokenId = args.tokenId?.toString() ?? "0";
      const serviceType = (args.serviceType as string) ?? "data-analysis";
      const price = args.price as bigint;
      const priceEth = Number(price) / 1e18;

      return {
        id: `lst-${listingId}`,
        sellerId: `agent-${tokenId}`,
        serviceType,
        description: `Service from ERC-8004 agent #${tokenId}`,
        priceEth,
        active: true,
        ordersCompleted: deliveredByListing.get(listingId) ?? 0,
        createdAt: Number(event.blockNumber ?? 0n) * 2000, // Approximate ms from block
        txHash: event.transactionHash ?? "",
      };
    });

    // If contracts are live but empty, fall back to mock data so the UI always looks populated
    const finalListings = listings.length > 0 ? listings : MOCK_LISTINGS;
    const usingFallback = listings.length === 0;

    return NextResponse.json({
      listings: finalListings,
      agents: usingFallback ? MOCK_AGENTS : undefined,
      isMock: usingFallback,
      contractsDeployed: true,
      totalListings: finalListings.length,
      liveData: !usingFallback,
    });
  } catch (err) {
    console.error("[/api/bazaar/listings] Error fetching onchain data:", err);
    // Graceful fallback to mock
    return NextResponse.json({
      listings: MOCK_LISTINGS,
      agents: MOCK_AGENTS,
      isMock: true,
      contractsDeployed: true,
      error: "Failed to fetch onchain data, showing cached data",
    });
  }
}
