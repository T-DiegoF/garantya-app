const { ethers } = require("hardhat");

async function main() {
  const signers = await ethers.getSigners();
  const deployer   = signers[0]; // Propietario
  const arbitrator = signers[2]; // Árbitro — Account #2

  console.log("Deploying with account:", deployer.address);
  console.log("Arbitrator account:    ", arbitrator.address);

  const Factory = await ethers.getContractFactory("GarantYaFactory");
  const factory = await Factory.deploy(arbitrator.address);
  await factory.waitForDeployment();

  console.log("GarantYaFactory deployed to:", await factory.getAddress());
  console.log("Propietario:", signers[0].address);
  console.log("Inquilino:  ", signers[1].address);
  console.log("Arbitro:    ", signers[2].address);
}

main().catch(console.error);