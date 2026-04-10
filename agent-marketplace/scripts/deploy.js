const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  // 1. Deploy Escrow
  const Escrow = await ethers.getContractFactory("Escrow");
  const escrow = await Escrow.deploy();
  await escrow.waitForDeployment();
  console.log("Escrow deployed:", await escrow.getAddress());

  // 2. Deploy Marketplace
  // Replace this with the actual Base Sepolia ERC-8004
  // Reputation Registry address once you grab it from the Azeth SDK docs
  const ERC8004_REPUTATION = "0x_REPUTATION_REGISTRY_ADDRESS";

  const Marketplace = await ethers.getContractFactory("Marketplace");
  const marketplace = await Marketplace.deploy(
    await escrow.getAddress(),
    ERC8004_REPUTATION
  );
  await marketplace.waitForDeployment();
  console.log("Marketplace deployed:", await marketplace.getAddress());

  // 3. Transfer Escrow ownership to Marketplace
  await escrow.setMarketplace(await marketplace.getAddress());
  console.log("Escrow ownership transferred to Marketplace");

  console.log("\n--- Save these addresses ---");
  console.log("ESCROW_ADDRESS=", await escrow.getAddress());
  console.log("MARKETPLACE_ADDRESS=", await marketplace.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});