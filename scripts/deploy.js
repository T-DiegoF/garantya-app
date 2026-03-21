const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // The arbitrator MUST be different from the deployer/landlord wallet.
  // Set ARBITRATOR_ADDRESS in .env.local to a separate wallet address.
  const arbitrator = process.env.ARBITRATOR_ADDRESS || deployer.address;
  if (arbitrator === deployer.address) {
    console.warn("⚠️  WARNING: arbitrator == deployer. Landlords will not be able to create contracts.");
  }

  const Factory = await ethers.getContractFactory("GarantYaFactory");
  const factory  = await Factory.deploy(arbitrator);
  await factory.waitForDeployment();

  const address = await factory.getAddress();
  const block   = await ethers.provider.getBlockNumber();

  console.log("─────────────────────────────────────────");
  console.log("GarantYaFactory deployed to:", address);
  console.log("Deploy block:              ", block);
  console.log("Arbitrator:                ", arbitrator);
  console.log("─────────────────────────────────────────");
  console.log("\n.env.local values to update:");
  console.log(`NEXT_PUBLIC_FACTORY_ADDRESS=${address}`);
  console.log(`NEXT_PUBLIC_FACTORY_DEPLOY_BLOCK=${block}`);
}

main().catch(console.error);
