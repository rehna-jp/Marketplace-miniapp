/**
 * Blockchain / on-chain configuration.
 *
 * All process.env access for blockchain-related variables is centralised here
 * so the @neynar/no-process-env rule is satisfied everywhere else.
 */

export const blockchainConfig = {
  // Base Sepolia RPC endpoint (falls back to the public endpoint)
  baseSepolia: {
    // PublicNode — verified CORS-friendly (access-control-allow-origin: *), no API key needed.
    rpcUrl: "https://base-sepolia.publicnode.com",
  },

  // AgentBazaar contract addresses – null until the contracts are deployed
  contracts: {
    marketplace:
      process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS ??
      "0x2cfBbD9362dc4756405eA8780e50DA58fe472c5a",
    escrow:
      process.env.NEXT_PUBLIC_ESCROW_ADDRESS ??
      "0x9074A0d383f8043aE297d1d4eF318EDc1231b783",
    erc8004Registry:
      process.env.NEXT_PUBLIC_ERC8004_REGISTRY_ADDRESS ??
      "0x8004A818BFB912233c491871b3d84c89A494BD9e",
    reputationRegistry:
      process.env.NEXT_PUBLIC_REPUTATION_REGISTRY_ADDRESS ??
      "0x8004B663056A597Dffe9eCcC1965A193B7388713",
  },
} as const;
