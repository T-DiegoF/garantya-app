import { type Address, type Abi } from "viem";
import GarantYaFactoryArtifact from "../../artifacts/contracts/GarantYa.sol/GarantYaFactory.json";
import GarantYaArtifact from "../../artifacts/contracts/GarantYa.sol/GarantYa.json";

export const FACTORY_ADDRESS =
  (process.env.NEXT_PUBLIC_FACTORY_ADDRESS as Address) ?? "0x0";

// First block to scan for contract events.
// Set NEXT_PUBLIC_FACTORY_DEPLOY_BLOCK in .env to the block number when the
// factory was deployed. Avoids scanning from genesis (which crashes on mainnet).
export const FACTORY_DEPLOY_BLOCK = BigInt(
  process.env.NEXT_PUBLIC_FACTORY_DEPLOY_BLOCK ?? "0"
);

export const GARANTYA_FACTORY_ABI = GarantYaFactoryArtifact.abi as Abi;

export const GARANTYA_ABI = GarantYaArtifact.abi as Abi;

export enum ContractState {
  Created = 0,
  Funded = 1,
  DistributionProposed = 2,
  Disputed = 3,
  Completed = 4,
  Cancelled = 5,
}

export type UserRole = "tenant" | "landlord" | "arbitrator" | "unknown";
