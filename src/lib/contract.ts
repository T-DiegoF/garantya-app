import { type Address } from "viem";

export const FACTORY_ADDRESS =
  (process.env.NEXT_PUBLIC_FACTORY_ADDRESS as Address) ?? "0x0";

// First block to scan for contract events.
// Set NEXT_PUBLIC_FACTORY_DEPLOY_BLOCK in .env to the block number when the
// factory was deployed. Avoids scanning from genesis (which crashes on mainnet).
export const FACTORY_DEPLOY_BLOCK = BigInt(
  process.env.NEXT_PUBLIC_FACTORY_DEPLOY_BLOCK ?? "0"
);

export const GARANTYA_FACTORY_ABI = [
  {
    name: "deployContract",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "_tenant", type: "address" },
      { name: "_expectedDeposit", type: "uint256" },
      { name: "_days", type: "uint256" },
    ],
    outputs: [{ name: "addr", type: "address" }],
  },
  {
    name: "getContractsByTenant",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "_t", type: "address" },
      { name: "_offset", type: "uint256" },
      { name: "_limit", type: "uint256" },
    ],
    outputs: [{ name: "", type: "address[]" }],
  },
  {
    name: "getContractsByLandlord",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "_l", type: "address" },
      { name: "_offset", type: "uint256" },
      { name: "_limit", type: "uint256" },
    ],
    outputs: [{ name: "", type: "address[]" }],
  },
  {
    name: "isValidContract",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "feeBps",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

export const GARANTYA_ABI = [
  { name: "tenant",           type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { name: "landlord",         type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { name: "arbitrator",       type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { name: "state",            type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },
  { name: "depositAmount",    type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "contractDeadline", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "cancelDeadline",   type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  {
    name: "proposal",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { name: "tenantAmount",   type: "uint128" },
      { name: "landlordAmount", type: "uint128" },
      { name: "proposedAt",     type: "uint256" },
      { name: "disputedAt",     type: "uint256" },
    ],
  },
  {
    name: "allocations",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { name: "tenant",   type: "uint128" },
      { name: "landlord", type: "uint128" },
    ],
  },
  { name: "expectedDeposit", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "fund", type: "function", stateMutability: "payable", inputs: [], outputs: [] },
  { name: "proposeDistribution", type: "function", stateMutability: "nonpayable", inputs: [{ name: "_tenantAmt", type: "uint256" }, { name: "_landlordAmt", type: "uint256" }], outputs: [] },
  { name: "accept",                    type: "function", stateMutability: "nonpayable", inputs: [], outputs: [] },
  { name: "reject",                    type: "function", stateMutability: "nonpayable", inputs: [], outputs: [] },
  { name: "resolve",                   type: "function", stateMutability: "nonpayable", inputs: [{ name: "_tenantAmt", type: "uint256" }, { name: "_landlordAmt", type: "uint256" }], outputs: [] },
  { name: "withdraw",                  type: "function", stateMutability: "nonpayable", inputs: [], outputs: [] },
  { name: "cancel",                    type: "function", stateMutability: "nonpayable", inputs: [], outputs: [] },
  { name: "executeTimeout",            type: "function", stateMutability: "nonpayable", inputs: [], outputs: [] },
  { name: "executeArbitratorTimeout",  type: "function", stateMutability: "nonpayable", inputs: [], outputs: [] },
  { name: "reclaimExpired",            type: "function", stateMutability: "nonpayable", inputs: [], outputs: [] },
  { name: "stateLabel", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  // Events
  { name: "ContractCreated",           type: "event", inputs: [{ name: "tenant", type: "address", indexed: true }, { name: "landlord", type: "address", indexed: true }, { name: "arbitrator", type: "address", indexed: true }, { name: "expectedDeposit", type: "uint256" }, { name: "contractDeadline", type: "uint256" }, { name: "fundDeadline", type: "uint256" }] },
  { name: "Funded",                    type: "event", inputs: [{ name: "tenant", type: "address", indexed: true }, { name: "amount", type: "uint256" }, { name: "cancelDeadline", type: "uint256" }] },
  { name: "Proposed",                  type: "event", inputs: [{ name: "landlord", type: "address", indexed: true }, { name: "tenantAmount", type: "uint256" }, { name: "landlordAmount", type: "uint256" }, { name: "expiresAt", type: "uint256" }] },
  { name: "Accepted",                  type: "event", inputs: [{ name: "tenant", type: "address", indexed: true }, { name: "tenantAmount", type: "uint256" }, { name: "landlordAmount", type: "uint256" }] },
  { name: "Rejected",                  type: "event", inputs: [{ name: "tenant", type: "address", indexed: true }, { name: "disputedAt", type: "uint256" }] },
  { name: "Resolved",                  type: "event", inputs: [{ name: "arbitrator", type: "address", indexed: true }, { name: "tenantAmount", type: "uint256" }, { name: "landlordAmount", type: "uint256" }] },
  { name: "TimeoutExecuted",           type: "event", inputs: [{ name: "executor", type: "address", indexed: true }, { name: "tenantAmount", type: "uint256" }, { name: "landlordAmount", type: "uint256" }] },
  { name: "ArbitratorTimeoutExecuted", type: "event", inputs: [{ name: "tenant", type: "address", indexed: true }, { name: "amount", type: "uint256" }] },
  { name: "Reclaimed",                 type: "event", inputs: [{ name: "tenant", type: "address", indexed: true }, { name: "amount", type: "uint256" }] },
  { name: "Cancelled",                 type: "event", inputs: [{ name: "tenant", type: "address", indexed: true }, { name: "amount", type: "uint256" }] },
  { name: "CancelledPending",          type: "event", inputs: [{ name: "landlord", type: "address", indexed: true }] },
  { name: "Withdrawn",                 type: "event", inputs: [{ name: "recipient", type: "address", indexed: true }, { name: "amount", type: "uint256" }] },
] as const;

export enum ContractState {
  Created = 0,
  Funded = 1,
  DistributionProposed = 2,
  Disputed = 3,
  Completed = 4,
  Cancelled = 5,
}

export type UserRole = "tenant" | "landlord" | "arbitrator" | "unknown";
