"use client";

import { useState } from "react";
import { useWriteContract } from "wagmi";
import { parseEther, type Address } from "viem";
import dynamic from "next/dynamic";

const QRCodeSVG = dynamic(
  () => import("qrcode.react").then(m => ({ default: m.QRCodeSVG })),
  { ssr: false, loading: () => <div className="w-[140px] h-[140px] rounded-xl bg-stone-100 animate-pulse" /> }
);
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { DataRow } from "@/components/DataRow";
import { GARANTYA_ABI, ContractState } from "@/lib/contract";
import {
  formatAVAX, shortenAddress,
  getStateBadge, snowtraceUrl,
} from "@/lib/utils";
import type { useEscrow } from "@/lib/hooks/useEscrow";
import { useT } from "@/contexts/LanguageContext";
import { logger } from "@/lib/logger";
import type { ContractMetadata } from "@/lib/supabase";

type EscrowData = ReturnType<typeof useEscrow>;

interface LandlordViewProps {
  address: Address;
  escrow: EscrowData;
  meta?: ContractMetadata;
}

export function LandlordView({ address, escrow, meta }: LandlordViewProps) {
  const {
    tenant, arbitrator, state, deposit,
    deadline, proposal, allocations, refetch,
  } = escrow;

  const { t, locale } = useT();
  const stateLabels = [
    t.contracts.states.created, t.contracts.states.funded,
    t.contracts.states.proposed, t.contracts.states.disputed,
    t.contracts.states.completed, t.contracts.states.cancelled,
  ];
  const { writeContractAsync, isPending } = useWriteContract();
  const [action,         setAction]         = useState<string | null>(null);
  const [error,          setError]          = useState<string | null>(null);
  const [tenantShare,    setTenantShare]    = useState("");
  const [landlordShare,  setLandlordShare]  = useState("");
  const [proposeErrors,  setProposeErrors]  = useState<Record<string, string>>({});

  async function call(fn: string, args: unknown[] = []) {
    logger.log(`[Garantya:LandlordView] Llamando ${fn}`, { address, args });
    setAction(fn);
    setError(null);
    try {
      await writeContractAsync({
        address,
        abi: GARANTYA_ABI,
        functionName: fn as never,
        args: args as never,
      });
      logger.log(`[Garantya:LandlordView] ${fn} exitoso`);
      await refetch();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error";
      logger.error(`[Garantya:LandlordView] ${fn} error:`, msg);
      setError(msg.includes("rejected") ? t.common.rejected : t.common.execError);
    } finally {
      setAction(null);
    }
  }

  function validateProposal(): boolean {
    if (!deposit) return false;
    const e: Record<string, string> = {};
    let ta: bigint, la: bigint;
    try { ta = parseEther(tenantShare);   } catch { e.tenant   = t.landlord.errors.invalidValue; ta = 0n; }
    try { la = parseEther(landlordShare); } catch { e.landlord = t.landlord.errors.invalidValue; la = 0n; }
    if (!e.tenant && !e.landlord && ta + la !== deposit)
      e.tenant = t.landlord.errors.sumMustBe(formatAVAX(deposit));
    if (Object.keys(e).length > 0)
      logger.warn("[Garantya:LandlordView] Validación propuesta fallida:", e);
    setProposeErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handlePropose() {
    if (!validateProposal() || !deposit) return;
    const ta = parseEther(tenantShare);
    const la = deposit - ta;
    await call("proposeDistribution", [ta, la]);
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

  return (
    <div className="space-y-5 animate-fade-up">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <p className="screen-tag">{t.landlord.tag}</p>
          {state !== undefined && (
            <Badge variant={getStateBadge(state)} pulse={state < ContractState.Completed}>
              {stateLabels[state] ?? ""}
            </Badge>
          )}
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-stone-400">{t.landlord.escrowTitle}</h1>
          {deposit ? (
            <div className="flex items-baseline gap-2 mt-1">
              <span className="amount-hero">{formatAVAX(deposit)}</span>
              <span className="text-xl text-stone-400 font-medium">AVAX</span>
            </div>
          ) : (
            <div className="flex items-baseline gap-2 mt-1">
              <span className="amount-hero text-stone-200">—</span>
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="card space-y-0">
        <DataRow
          label={t.common.tenant}
          value={
            meta?.tenant_name ? (
              <div className="text-right">
                <p className="text-sm font-bold text-[#1C1917]">{meta.tenant_name}</p>
                <p className="text-[11px] font-mono text-stone-400 mt-0.5">{shortenAddress(tenant!)}</p>
              </div>
            ) : shortenAddress(tenant!)
          }
          mono={!meta?.tenant_name}
        />
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

      {/* State: Created — waiting for tenant */}
      {state === ContractState.Created && (() => {
        const origin = globalThis.window?.location.origin ?? "";
        const shareUrl = `${origin}/contract/${address}?lang=${locale}`;
        const waText = encodeURIComponent(t.landlord.waMessage(shareUrl));
        const tgText = encodeURIComponent(t.landlord.tgMessage);
        return (
          <div className="card space-y-4 bg-amber-50 border-amber-200">
            <div>
              <p className="text-sm font-bold text-amber-800">{t.landlord.waitingTitle}</p>
              <p className="text-xs text-amber-700 leading-relaxed mt-1">
                {t.landlord.waitingDesc}
              </p>
            </div>
            <div className="flex justify-center">
              <div className="p-3 bg-white rounded-2xl border border-amber-100 inline-block">
                <QRCodeSVG value={shareUrl} size={140} bgColor="#ffffff" fgColor="#1C1917" />
              </div>
            </div>
            <p className="font-mono text-xs text-amber-600 break-all text-center">{address}</p>
            <div className="grid grid-cols-2 gap-2">
              <a
                href={`https://wa.me/?text=${waText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl border border-[#E5DFD5] bg-white px-3 py-2.5 text-xs font-bold text-[#1C1917] hover:border-stone-300 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.549 4.12 1.512 5.855L0 24l6.318-1.485A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.007-1.37l-.36-.213-3.727.876.906-3.618-.234-.372A9.783 9.783 0 012.182 12C2.182 6.58 6.58 2.182 12 2.182S21.818 6.58 21.818 12 17.42 21.818 12 21.818z"/></svg>
                WhatsApp
              </a>
              <a
                href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${tgText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl border border-[#E5DFD5] bg-white px-3 py-2.5 text-xs font-bold text-[#1C1917] hover:border-stone-300 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#229ED9"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L8.32 13.617l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.828.942z"/></svg>
                Telegram
              </a>
            </div>
            <button
              className="w-full text-xs text-amber-600 underline underline-offset-2 hover:text-amber-800 transition-colors py-1"
              onClick={() => navigator.clipboard.writeText(shareUrl)}
            >
              {t.landlord.copyLink}
            </button>
          </div>
        );
      })()}

      {/* State: Funded — propose */}
      {state === ContractState.Funded && (
        <div className="card space-y-4">
          <h2 className="text-lg font-black">{t.landlord.proposeTitle}</h2>
          <p className="text-sm text-stone-400">
            {t.landlord.proposeDesc}
          </p>
          <Input
            label={t.landlord.forTenant}
            type="number"
            placeholder="0.000"
            value={tenantShare}
            onChange={e => handleTenantChange(e.target.value)}
            error={proposeErrors.tenant}
            step="0.0001"
          />
          <Input
            label={t.landlord.forMe}
            type="number"
            placeholder="0.000"
            value={landlordShare}
            onChange={e => setLandlordShare(e.target.value)}
            error={proposeErrors.landlord}
            step="0.0001"
          />
          {deposit && (
            <p className="text-xs text-stone-400">
              {t.landlord.totalAvail(formatAVAX(deposit))}
            </p>
          )}
          <Button fullWidth loading={isLoading("proposeDistribution")} onClick={handlePropose}>
            {t.landlord.proposeButton}
          </Button>
        </div>
      )}

      {/* State: DistributionProposed */}
      {state === ContractState.DistributionProposed && proposal && (
        <div className="card space-y-4">
          <h2 className="text-lg font-black">{t.landlord.proposedTitle}</h2>
          <div className="space-y-0">
            <DataRow label={t.landlord.propTenant}  value={`${formatAVAX(proposal.tenantAmount)} AVAX`}   accent />
            <DataRow label={t.landlord.propMe}      value={`${formatAVAX(proposal.landlordAmount)} AVAX`} />
            <DataRow
              label={t.landlord.propExpires}
              value={new Date((Number(proposal.proposedAt) + 7 * 24 * 3600) * 1000).toLocaleDateString("es-AR")}
            />
          </div>
          <p className="text-sm text-stone-400">
            {t.landlord.waitingResponse}
          </p>
          <div className="pt-2 border-t border-[#E0D9CE]">
            <p className="text-xs text-stone-400 mb-2">{t.landlord.timeoutLabel}</p>
            <Button
              fullWidth
              variant="outline"
              loading={isLoading("executeTimeout")}
              onClick={() => call("executeTimeout")}
            >
              {t.landlord.executeTimeout}
            </Button>
          </div>
        </div>
      )}

      {/* State: Disputed */}
      {state === ContractState.Disputed && (
        <div className="card space-y-4">
          <Badge variant="red" pulse>{t.arbitrator.disputedTitle}</Badge>
          <p className="text-sm text-stone-500 leading-relaxed">
            {t.landlord.disputedDesc}
          </p>
        </div>
      )}

      {/* State: Completed */}
      {state === ContractState.Completed && allocations && (
        <div className="card space-y-4">
          <h2 className="text-lg font-black">{t.landlord.completedTitle}</h2>
          <DataRow label={t.landlord.yourPart} value={`${formatAVAX(allocations.landlord)} AVAX`} accent />
          {allocations.landlord > 0n && (
            <Button fullWidth loading={isLoading("withdraw")} onClick={() => call("withdraw")}>
              {t.landlord.withdrawButton(formatAVAX(allocations.landlord))}
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
