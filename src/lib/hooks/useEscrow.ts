"use client";

import { useEffect } from "react";
import { useReadContracts, useAccount } from "wagmi";
import { type Address } from "viem";
import { GARANTYA_ABI } from "@/lib/contract";
import { getUserRole } from "@/lib/utils";
import { logger } from "@/lib/logger";

export function useEscrow(address: Address) {
  const { address: userAddress } = useAccount();
  const contract = { address, abi: GARANTYA_ABI } as const;

  const { data, isLoading, error, refetch } = useReadContracts({
    contracts: [
      { ...contract, functionName: "tenant" },
      { ...contract, functionName: "landlord" },
      { ...contract, functionName: "arbitrator" },
      { ...contract, functionName: "state" },
      { ...contract, functionName: "expectedDeposit" },
      { ...contract, functionName: "depositAmount" },
      { ...contract, functionName: "contractDeadline" },
      { ...contract, functionName: "cancelDeadline" },
      { ...contract, functionName: "proposal" },
      { ...contract, functionName: "allocations" },
    ],
    query: {
      staleTime: 10_000,  // 10s — re-fetch only if data is older than 10s
      gcTime:    60_000,  // 1 min in cache after unmount
    },
  });

  const tenant          = data?.[0].result as Address | undefined;
  const landlord        = data?.[1].result as Address | undefined;
  const arbitrator      = data?.[2].result as Address | undefined;
  const state           = data?.[3].result as number  | undefined;
  const expectedDeposit = data?.[4].result as bigint  | undefined;
  const deposit         = data?.[5].result as bigint  | undefined;
  const deadline        = data?.[6].result as bigint  | undefined;
  const cancelDl        = data?.[7].result as bigint  | undefined;
  const proposal        = data?.[8].result as readonly [bigint, bigint, bigint, bigint] | undefined;
  const allocations     = data?.[9].result as readonly [bigint, bigint] | undefined;

  const role = getUserRole(
    userAddress,
    tenant     ?? "0x0",
    landlord   ?? "0x0",
    arbitrator ?? "0x0"
  );

  useEffect(() => {
    if (isLoading) return;
    if (error) {
      logger.error("[Garantya:useEscrow] Error al leer contrato:", address, error);
      return;
    }
    logger.log("[Garantya:useEscrow] Datos cargados", {
      address,
      state,
      role,
      deposit: deposit?.toString(),
      expectedDeposit: expectedDeposit?.toString(),
      tenant,
      landlord,
      arbitrator,
    });
  }, [isLoading, error, state, role, address, deposit, expectedDeposit, tenant, landlord, arbitrator]);

  return {
    tenant,
    landlord,
    arbitrator,
    state,
    expectedDeposit,
    deposit,
    deadline,
    cancelDeadline: cancelDl,
    proposal: proposal
      ? { tenantAmount: proposal[0], landlordAmount: proposal[1], proposedAt: proposal[2], disputedAt: proposal[3] }
      : undefined,
    allocations: allocations
      ? { tenant: allocations[0], landlord: allocations[1] }
      : undefined,
    role,
    isLoading,
    error,
    refetch,
  };
}
