import { network } from "hardhat";

// ERC-8004 Base Sepolia addresses
const ERC8004_IDENTITY_REGISTRY = "0x8004A818BFB912233c491871b3d84c89A494BD9e";
const ERC8004_REPUTATION_REGISTRY = "0x8004B663056A597Dffe9eCcC1965A193B7388713";

async function main() {
  const { ethers } = await network.connect("baseSepolia");
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");

  // 1. Deploy Escrow
  const Escrow = await ethers.getContractFactory("Escrow");
  const escrow = await Escrow.deploy();
  await escrow.waitForDeployment();
  console.log("Escrow deployed:", await escrow.getAddress());

  // 2. Deploy Marketplace with real ERC-8004 Reputation Registry
  const Marketplace = await ethers.getContractFactory("Marketplace");
  const marketplace = await Marketplace.deploy(
    await escrow.getAddress(),
    ERC8004_REPUTATION_REGISTRY
  );
  await marketplace.waitForDeployment();
  console.log("Marketplace deployed:", await marketplace.getAddress());

  // 3. Transfer Escrow ownership to Marketplace
  await escrow.setMarketplace(await marketplace.getAddress());
  console.log("Escrow ownership transferred to Marketplace");

  console.log("\n--- Save these addresses ---");
  console.log("ERC8004_IDENTITY_REGISTRY=", ERC8004_IDENTITY_REGISTRY);
  console.log("ERC8004_REPUTATION_REGISTRY=", ERC8004_REPUTATION_REGISTRY);
  console.log("ESCROW_ADDRESS=", await escrow.getAddress());
  console.log("MARKETPLACE_ADDRESS=", await marketplace.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});