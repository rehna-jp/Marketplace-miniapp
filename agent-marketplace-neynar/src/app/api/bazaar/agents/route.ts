/**
 * GET /api/bazaar/agents
 *
 * Returns registered agents with ERC-8004 identities.
 * - If ERC-8004 registry is deployed: reads mint events + reputation
 * - Also enriches with Privy wallet list if configured
 * - Falls back to mock data when contracts are not deployed
 */

import { NextResponse } from "next/server";
import {
  contractsDeployed,
  fetchAgentMintEvents,
  fetchReputation,
  fetchTokenOwner,
  CONTRACT_ADDRESSES,
} from "@/lib/base-sepolia";
import { listAgentWallets, isPrivyConfigured } from "@/lib/privy";
import { MOCK_AGENTS } from "@/features/bazaar/mock-data";

export const dynamic = 'force-dynamic';

export async function GET() {
  const hasRegistry = !!CONTRACT_ADDRESSES.erc8004Registry;

  if (!contractsDeployed() && !hasRegistry) {
    // Full mock mode
    const privyWallets = isPrivyConfigured() ? await listAgentWallets() : [];

    // Enrich mock agents with real Privy wallet addresses if available
    const agents = MOCK_AGENTS.map((agent, i) => ({
      ...agent,
      walletAddress: privyWallets[i]?.address ?? agent.walletAddress,
      privyWalletId: privyWallets[i]?.id ?? agent.privyWalletId,
    }));

    return NextResponse.json({
      agents,
      isMock: true,
      contractsDeployed: false,
      privyConnected: isPrivyConfigured(),
      privyWalletCount: privyWallets.length,
    });
  }

  try {
    // Fetch mint events (each mint = one registered agent)
    const mintEvents = await fetchAgentMintEvents();

    // Fetch Privy wallets in parallel for enrichment
    const privyWalletsPromise = isPrivyConfigured()
      ? listAgentWallets()
      : Promise.resolve([]);

    const privyWallets = await privyWalletsPromise;
    const privyWalletByAddress = new Map(
      privyWallets.map((w) => [w.address.toLowerCase(), w])
    );

    // Fetch reputation + owner for each minted token in parallel (batch of 10)
    const tokenIds = mintEvents.map((e) => {
      const args = e.args as Record<string, unknown>;
      return args.tokenId as bigint;
    });

    const BATCH_SIZE = 10;
    const agentResults = [];

    for (let i = 0; i < tokenIds.length; i += BATCH_SIZE) {
      const batch = tokenIds.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map(async (tokenId) => {
          const [rep, owner] = await Promise.all([
            fetchReputation(tokenId),
            fetchTokenOwner(tokenId),
          ]);
          return { tokenId, rep, owner };
        })
      );
      agentResults.push(...batchResults);
    }

    const agents = agentResults.map(({ tokenId, rep, owner }, index) => {
      const ownerAddr = (owner ?? "0x0000000000000000000000000000000000000000").toLowerCase();
      const privyWallet = privyWalletByAddress.get(ownerAddr);

      return {
        id: `agent-${tokenId.toString()}`,
        name: `Agent #${tokenId.toString()}`,
        walletAddress: owner ?? "0x0000000000000000000000000000000000000000",
        erc8004TokenId: Number(tokenId),
        reputation: rep?.score ?? 50,
        serviceCount: 0, // Would be fetched from Marketplace
        totalVolume: 0,
        status: "ACTIVE" as const,
        specialization: "data-analysis" as const,
        privyWalletId: privyWallet?.id ?? "",
        registeredAt: Date.now() - index * 86400000,
      };
    });

    // If no agents minted yet, fall back to mock so the registry looks populated
    const finalAgents = agents.length > 0 ? agents : MOCK_AGENTS;
    const usingFallback = agents.length === 0;

    return NextResponse.json({
      agents: finalAgents,
      isMock: usingFallback,
      contractsDeployed: true,
      totalAgents: finalAgents.length,
      privyConnected: isPrivyConfigured(),
      privyWalletCount: privyWallets.length,
      liveData: !usingFallback,
    });
  } catch (err) {
    console.error("[/api/bazaar/agents] Error fetching onchain data:", err);
    return NextResponse.json({
      agents: MOCK_AGENTS,
      isMock: true,
      contractsDeployed: true,
      error: "Failed to fetch onchain data, showing cached data",
    });
  }
}
