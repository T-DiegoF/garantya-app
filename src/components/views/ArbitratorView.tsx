"use client";

import { useState } from "react";
import { useWriteContract } from "wagmi";
import { parseEther, type Address } from "viem";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { DataRow } from "@/components/DataRow";
import { Countdown } from "@/components/Countdown";
import { GARANTYA_ABI, ContractState } from "@/lib/contract";
import { formatAVAX, shortenAddress, snowtraceUrl } from "@/lib/utils";
import type { useEscrow } from "@/lib/hooks/useEscrow";
import { useT } from "@/contexts/LanguageContext";
import { logger } from "@/lib/logger";

type EscrowData = ReturnType<typeof useEscrow>;

interface ArbitratorViewProps {
  address: Address;
  escrow: EscrowData;
  meta?: import("@/lib/supabase").ContractMetadata;
}

export function ArbitratorView({ address, escrow }: ArbitratorViewProps) {
  const { tenant, landlord, state, deposit, proposal, refetch } = escrow;

  const { t } = useT();
  const { writeContractAsync, isPending } = useWriteContract();
  const [tenantShare,   setTenantShare]   = useState("");
  const [landlordShare, setLandlordShare] = useState("");
  const [errors,        setErrors]        = useState<Record<string, string>>({});
  const [error,         setError]         = useState<string | null>(null);
  const [action,        setAction]        = useState<string | null>(null);

  async function call(fn: string, args: unknown[] = []) {
    logger.log(`[Garantya:ArbitratorView] Llamando ${fn}`, { address, args });
    setAction(fn);
    setError(null);
    try {
      await writeContractAsync({
        address,
        abi: GARANTYA_ABI,
        functionName: fn as never,
        args: args as never,
      });
      logger.log(`[Garantya:ArbitratorView] ${fn} exitoso`);
      await refetch();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error";
      logger.error(`[Garantya:ArbitratorView] ${fn} error:`, msg);
      setError(msg.includes("rejected") ? t.common.rejected : t.common.execError);
    } finally {
      setAction(null);
    }
  }

  function validateResolve(): boolean {
    if (!deposit) return false;
    const e: Record<string, string> = {};
    let ta: bigint, la: bigint;
    try { ta = parseEther(tenantShare);   } catch { e.tenant   = t.arbitrator.errors.invalidValue; ta = 0n; }
    try { la = parseEther(landlordShare); } catch { e.landlord = t.arbitrator.errors.invalidValue; la = 0n; }
    if (!e.tenant && !e.landlord && ta + la !== deposit)
      e.tenant = t.arbitrator.errors.sumMustBe(formatAVAX(deposit));
    if (Object.keys(e).length > 0)
      logger.warn("[Garantya:ArbitratorView] Validación resolución fallida:", e);
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleResolve() {
    if (!validateResolve() || !deposit) return;
    const ta = parseEther(tenantShare);
    const la = deposit - ta;
    await call("resolve", [ta, la]);
  }

  function handleTenantChange(val: string) {
    setTenantShare(val);
    if (deposit) {
      try {
        const ta = parseEther(val);
        const la = deposit - ta;
        if (la >= 0n) setLandlordShare(formatAVAX(la, 6));
      } catch {}
    }
  }

  const isLoading = (fn: string) => isPending && action === fn;

  if (state !== ContractState.Disputed) {
    return (
      <div className="space-y-5 animate-fade-up">
        <p className="screen-tag">{t.arbitrator.tag}</p>
        <div className="card text-center py-8">
          <Badge variant="green">{t.arbitrator.noDispute}</Badge>
          <p className="text-sm text-stone-400 mt-3">
            {t.arbitrator.noDisputeDesc}
          </p>
          <div className="divider" />
          <DataRow label={t.common.tenant}   value={shortenAddress(tenant!)}   mono />
          <DataRow label={t.common.landlord} value={shortenAddress(landlord!)} mono />
          <a
            href={snowtraceUrl(address)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-stone-400 underline underline-offset-2 mt-3 inline-block"
          >
            {t.common.viewOnChain} →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-up">
      <div className="space-y-3">
        <p className="screen-tag">{t.arbitrator.tag}</p>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-stone-400">{t.arbitrator.disputedTitle}</h1>
          {deposit && (
            <div className="flex items-baseline gap-2 mt-1">
              <span className="amount-hero">{formatAVAX(deposit)}</span>
              <span className="text-xl text-stone-400 font-medium">AVAX</span>
            </div>
          )}
        </div>
      </div>

      <div className="card space-y-0">
        <DataRow label={t.common.tenant}   value={shortenAddress(tenant!)}   mono />
        <DataRow label={t.common.landlord} value={shortenAddress(landlord!)} mono />
        {proposal && (
          <>
            <DataRow
              label={t.arbitrator.originalProposalTenant}
              value={`${formatAVAX(proposal.tenantAmount)} AVAX`}
            />
            <DataRow
              label={t.arbitrator.originalProposalLandlord}
              value={`${formatAVAX(proposal.landlordAmount)} AVAX`}
            />
          </>
        )}
      </div>

      {proposal && (
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-2">
            {t.arbitrator.resolutionWindow}
          </p>
          <Countdown
            deadline={proposal.disputedAt + BigInt(30 * 24 * 3600)}
            totalSeconds={30 * 24 * 3600}
          />
        </div>
      )}

      <div className="card space-y-4">
        <h2 className="text-lg font-black">{t.arbitrator.resolutionTitle}</h2>
        <p className="text-sm text-stone-400">
          {t.arbitrator.resolutionDesc}
        </p>
        <Input
          label={t.arbitrator.forTenant}
          type="number"
          placeholder="0.000"
          value={tenantShare}
          onChange={e => handleTenantChange(e.target.value)}
          error={errors.tenant}
          step="0.0001"
        />
        <Input
          label={t.arbitrator.forLandlord}
          type="number"
          placeholder="0.000"
          value={landlordShare}
          onChange={e => setLandlordShare(e.target.value)}
          error={errors.landlord}
          step="0.0001"
        />
        {deposit && (
          <p className="text-xs text-stone-400">
            {t.arbitrator.totalDistribute(formatAVAX(deposit))}
          </p>
        )}
        <Button fullWidth loading={isLoading("resolve")} onClick={handleResolve}>
          {t.arbitrator.resolveButton}
        </Button>
      </div>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
      )}
    </div>
  );
}
