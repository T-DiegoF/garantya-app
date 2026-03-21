import { formatEther, type Address } from "viem";
import { type UserRole, ContractState } from "./contract";

export function formatAVAX(wei: bigint, decimals = 4): string {
  return Number.parseFloat(formatEther(wei)).toFixed(decimals);
}

export function shortenAddress(address: Address): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function getUserRole(
  address: Address | undefined,
  tenant: Address,
  landlord: Address,
  arbitrator: Address
): UserRole {
  if (!address) return "unknown";
  const addr = address.toLowerCase();
  if (addr === tenant.toLowerCase())     return "tenant";
  if (addr === landlord.toLowerCase())   return "landlord";
  if (addr === arbitrator.toLowerCase()) return "arbitrator";
  return "unknown";
}

export type BadgeVariant = "green" | "amber" | "red" | "blue" | "gray";

export function getStateBadge(state: number): BadgeVariant {
  const map: Record<number, BadgeVariant> = {
    [ContractState.Created]:              "gray",
    [ContractState.Funded]:               "green",
    [ContractState.DistributionProposed]: "amber",
    [ContractState.Disputed]:             "red",
    [ContractState.Completed]:            "blue",
    [ContractState.Cancelled]:            "gray",
  };
  return map[state] ?? "gray";
}

export function snowtraceUrl(address: Address): string {
  return `https://testnet.snowtrace.io/address/${address}`;
}

export function snowtraceTxUrl(hash: string): string {
  return `https://testnet.snowtrace.io/tx/${hash}`;
}
