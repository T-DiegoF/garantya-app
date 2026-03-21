"use client";

import { useState } from "react";
import { useWriteContract } from "wagmi";
import { type Address } from "viem";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DataRow } from "@/components/DataRow";
import { Countdown } from "@/components/Countdown";
import { SplitBar } from "@/components/SplitBar";
import { GARANTYA_ABI, ContractState } from "@/lib/contract";
import {
  formatAVAX, shortenAddress,
  getStateBadge, snowtraceUrl,
} from "@/lib/utils";
import type { useEscrow } from "@/lib/hooks/useEscrow";
import { useT } from "@/contexts/LanguageContext";

type EscrowData = ReturnType<typeof useEscrow>;

interface TenantViewProps {
  address: Address;
  escrow: EscrowData;
}

export function TenantView({ address, escrow }: TenantViewProps) {
  const {
    landlord, arbitrator, state, expectedDeposit, deposit,
    deadline, cancelDeadline, proposal,
    allocations, refetch,
  } = escrow;

  const { t } = useT();
  const stateLabels = [
    t.contracts.states.created, t.contracts.states.funded,
    t.contracts.states.proposed, t.contracts.states.disputed,
    t.contracts.states.completed, t.contracts.states.cancelled,
  ];
  const { writeContractAsync, isPending } = useWriteContract();
  const [action, setAction] = useState<string | null>(null);
  const [error,  setError]  = useState<string | null>(null);

  async function call(fn: string, args: unknown[] = []) {
    setAction(fn);
    setError(null);
    try {
      await writeContractAsync({
        address,
        abi: GARANTYA_ABI,
        functionName: fn as never,
        args: args as never,
      });
      await refetch();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error";
      setError(msg.includes("rejected") ? t.common.rejected : t.common.execError);
    } finally {
      setAction(null);
    }
  }

  const isLoading = (fn: string) => isPending && action === fn;

  return (
    <div className="space-y-5 animate-fade-up">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <p className="screen-tag">{t.tenant.tag}</p>
          {state !== undefined && (
            <Badge variant={getStateBadge(state)} pulse={state < ContractState.Completed}>
              {stateLabels[state] ?? ""}
            </Badge>
          )}
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-stone-400">{t.tenant.depositTitle}</h1>
          {deposit ? (
            <div className="flex items-baseline gap-2 mt-1">
              <span className="amount-hero">{formatAVAX(deposit)}</span>
              <span className="text-xl text-stone-400 font-medium">AVAX</span>
            </div>
          ) : expectedDeposit ? (
            <div className="flex items-baseline gap-2 mt-1">
              <span className="amount-hero text-stone-300">{formatAVAX(expectedDeposit)}</span>
              <span className="text-xl text-stone-300 font-medium">AVAX</span>
            </div>
          ) : null}
        </div>
      </div>

      {/* Info */}
      <div className="card space-y-0">
        <DataRow label={t.common.landlord}   value={shortenAddress(landlord!)}  mono />
        <DataRow label={t.common.arbitrator} value={shortenAddress(arbitrator!)} mono />
        {deadline && (
          <DataRow
            label={t.common.expiresOn}
            value={new Date(Number(deadline) * 1000).toLocaleDateString("es-AR")}
          />
        )}
        <DataRow
          label={t.common.viewOnChain}
          value={
            <a href={snowtraceUrl(address)} target="_blank" rel="noopener noreferrer"
               className="underline underline-offset-2 hover:text-[#A07850]">
              {shortenAddress(address)} →
            </a>
          }
          mono
        />
      </div>

      {/* State: Created — fund */}
      {state === ContractState.Created && expectedDeposit && (
        <div className="card space-y-4">
          <h2 className="text-lg font-black">{t.tenant.fundTitle}</h2>
          <p className="text-sm text-stone-400">
            {t.tenant.fundDesc(formatAVAX(expectedDeposit))}
          </p>
          <Button
            fullWidth
            loading={isLoading("fund")}
            onClick={() => writeContractAsync({
              address,
              abi: GARANTYA_ABI,
              functionName: "fund",
              value: expectedDeposit,
            }).then(() => refetch()).catch((err: unknown) => {
              const msg = err instanceof Error ? err.message : "Error";
              setError(msg.includes("rejected") ? t.common.rejected : t.common.execError);
            })}
          >
            {t.tenant.fundButton(formatAVAX(expectedDeposit))}
          </Button>
        </div>
      )}

      {/* State: Funded — cancel window */}
      {state === ContractState.Funded && cancelDeadline && (
        <div className="card space-y-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 h-2 w-2 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
            <p className="text-sm font-bold text-stone-700">{t.tenant.fundedStatus}</p>
          </div>
          <p className="text-sm text-stone-500 leading-relaxed">
            {t.tenant.fundedDesc}
          </p>
          <Button
            fullWidth
            variant="danger"
            loading={isLoading("cancel")}
            onClick={() => call("cancel")}
          >
            {t.tenant.cancelButton}
          </Button>
          <Button
            fullWidth
            variant="outline"
            loading={isLoading("reclaimExpired")}
            onClick={() => call("reclaimExpired")}
          >
            {t.tenant.reclaimButton}
          </Button>
        </div>
      )}

      {/* State: DistributionProposed */}
      {state === ContractState.DistributionProposed && proposal && (
        <div className="card space-y-5">
          <h2 className="text-lg font-black tracking-tight">{t.tenant.proposedTitle}</h2>
          <Countdown deadline={proposal.proposedAt + BigInt(7 * 24 * 3600)} />
          <SplitBar
            tenantAmount={proposal.tenantAmount}
            landlordAmount={proposal.landlordAmount}
          />
          <div className="space-y-0">
            <DataRow label={t.tenant.yourPart}     value={`${formatAVAX(proposal.tenantAmount)} AVAX`}   accent />
            <DataRow label={t.tenant.propLandlord}  value={`${formatAVAX(proposal.landlordAmount)} AVAX`} />
            <DataRow label={t.tenant.total}        value={`${formatAVAX(proposal.tenantAmount + proposal.landlordAmount)} AVAX`} />
          </div>
          <div className="divider" />
          <Button fullWidth variant="success" loading={isLoading("accept")} onClick={() => call("accept")}>
            {t.tenant.acceptButton}
          </Button>
          <Button fullWidth variant="outline" loading={isLoading("reject")} onClick={() => call("reject")}>
            {t.tenant.rejectButton}
          </Button>
        </div>
      )}

      {/* State: Disputed */}
      {state === ContractState.Disputed && proposal && (
        <div className="card space-y-4">
          <Badge variant="red" pulse>{t.arbitrator.disputedTitle}</Badge>
          <p className="text-sm text-stone-500 leading-relaxed">
            {t.tenant.disputedDesc}
          </p>
          <Countdown
            deadline={proposal.disputedAt + BigInt(30 * 24 * 3600)}
            totalSeconds={30 * 24 * 3600}
          />
          <Button
            fullWidth
            variant="outline"
            loading={isLoading("executeArbitratorTimeout")}
            onClick={() => call("executeArbitratorTimeout")}
          >
            {t.tenant.claimTimeout}
          </Button>
        </div>
      )}

      {/* State: Completed */}
      {state === ContractState.Completed && allocations && (
        <div className="card space-y-4">
          <h2 className="text-lg font-black">{t.tenant.completedTitle}</h2>
          <DataRow label={t.tenant.yourPart} value={`${formatAVAX(allocations.tenant)} AVAX`} accent />
          {allocations.tenant > 0n && (
            <Button fullWidth loading={isLoading("withdraw")} onClick={() => call("withdraw")}>
              {t.tenant.withdrawButton(formatAVAX(allocations.tenant))}
            </Button>
          )}
        </div>
      )}

      {error && (
        <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
      )}
    </div>
  );
}
