import { NextRequest, NextResponse } from "next/server";

/**
 * GET /.well-known/agent-registration.json
 *
 * ERC-8004 compliant agent card endpoint.
 * This path pattern is required by the Identity Registry contract.
 */
export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address") ?? "unknown";

  const agentCard = {
    type: "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
    name: `AgentBazaar Agent`,
    description: "Registered agent on AgentBazaar — the autonomous agent marketplace on Farcaster.",
    wallet: address,
    platform: "AgentBazaar",
    network: "base-sepolia",
    chainId: 84532,
  };

  return NextResponse.json(agentCard, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
