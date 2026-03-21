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
  formatAVAX, shortenAddress, getStateLabel,
  getStateBadge, snowtraceUrl,
} from "@/lib/utils";
import type { useEscrow } from "@/lib/hooks/useEscrow";

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
      setError(msg.includes("rejected") ? "Transacción rechazada" : "Error al ejecutar");
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
          <p className="screen-tag">vista inquilino</p>
          {state !== undefined && (
            <Badge variant={getStateBadge(state)} pulse={state < ContractState.Completed}>
              {getStateLabel(state)}
            </Badge>
          )}
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-stone-400">Tu depósito</h1>
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
        <DataRow label="Propietario"  value={shortenAddress(landlord!)}  mono />
        <DataRow label="Árbitro"      value={shortenAddress(arbitrator!)} mono />
        {deadline && (
          <DataRow
            label="Vence el"
            value={new Date(Number(deadline) * 1000).toLocaleDateString("es-AR")}
          />
        )}
        <DataRow
          label="Ver en Snowtrace"
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
          <h2 className="text-lg font-black">Depositar garantía</h2>
          <p className="text-sm text-stone-400">
            El propietario creó el contrato. Depositá exactamente{" "}
            <span className="font-bold text-[#1C1917]">{formatAVAX(expectedDeposit)} AVAX</span>{" "}
            para activarlo.
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
              setError(msg.includes("rejected") ? "Transacción rechazada" : "Error al depositar");
            })}
          >
            Depositar {formatAVAX(expectedDeposit)} AVAX →
          </Button>
        </div>
      )}

      {/* State: Funded — cancel window */}
      {state === ContractState.Funded && cancelDeadline && (
        <div className="card space-y-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 h-2 w-2 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
            <p className="text-sm font-bold text-stone-700">Depósito bloqueado — esperando propuesta</p>
          </div>
          <p className="text-sm text-stone-500 leading-relaxed">
            El propietario debe proponer cómo distribuir el depósito al finalizar el contrato.
            Podés cancelar dentro de las primeras 24hs si cambiás de opinión.
          </p>
          <Button
            fullWidth
            variant="danger"
            loading={isLoading("cancel")}
            onClick={() => call("cancel")}
          >
            Cancelar contrato
          </Button>
          <Button
            fullWidth
            variant="outline"
            loading={isLoading("reclaimExpired")}
            onClick={() => call("reclaimExpired")}
          >
            Reclamar (si venció plazo)
          </Button>
        </div>
      )}

      {/* State: DistributionProposed */}
      {state === ContractState.DistributionProposed && proposal && (
        <div className="card space-y-5">
          <h2 className="text-lg font-black tracking-tight">Propuesta recibida</h2>
          <Countdown deadline={proposal.proposedAt + BigInt(7 * 24 * 3600)} />
          <SplitBar
            tenantAmount={proposal.tenantAmount}
            landlordAmount={proposal.landlordAmount}
          />
          <div className="space-y-0">
            <DataRow label="Tu parte"     value={`${formatAVAX(proposal.tenantAmount)} AVAX`}   accent />
            <DataRow label="Propietario"  value={`${formatAVAX(proposal.landlordAmount)} AVAX`} />
            <DataRow label="Total"        value={`${formatAVAX(proposal.tenantAmount + proposal.landlordAmount)} AVAX`} />
          </div>
          <div className="divider" />
          <Button fullWidth variant="success" loading={isLoading("accept")} onClick={() => call("accept")}>
            Aceptar y retirar →
          </Button>
          <Button fullWidth variant="outline" loading={isLoading("reject")} onClick={() => call("reject")}>
            Rechazar y pedir árbitro
          </Button>
        </div>
      )}

      {/* State: Disputed */}
      {state === ContractState.Disputed && proposal && (
        <div className="card space-y-4">
          <Badge variant="red" pulse>En disputa</Badge>
          <p className="text-sm text-stone-500 leading-relaxed">
            El árbitro tiene 30 días para resolver. Si no actúa, podés reclamar el depósito completo.
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
            Reclamar por inactividad del árbitro
          </Button>
        </div>
      )}

      {/* State: Completed */}
      {state === ContractState.Completed && allocations && (
        <div className="card space-y-4">
          <h2 className="text-lg font-black">Fondos disponibles</h2>
          <DataRow label="Tu parte" value={`${formatAVAX(allocations.tenant)} AVAX`} accent />
          {allocations.tenant > 0n && (
            <Button fullWidth loading={isLoading("withdraw")} onClick={() => call("withdraw")}>
              Retirar {formatAVAX(allocations.tenant)} AVAX →
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
