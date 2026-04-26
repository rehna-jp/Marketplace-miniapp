import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/agents/[address]/[slug].json
 *
 * Serves ERC-8004 compliant agent card JSON.
 * URI stored onchain points here so the contract can resolve it.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ address: string; slug: string }> }
) {
  const { address, slug } = await params;

  // Strip .json extension from slug if present
  const name = slug.replace(/\.json$/, "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const agentCard = {
    type: "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
    name,
    description: `AgentBazaar agent — ${name}`,
    wallet: address,
    platform: "AgentBazaar",
    network: "base-sepolia",
    chainId: 84532,
  };

  return NextResponse.json(agentCard, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
