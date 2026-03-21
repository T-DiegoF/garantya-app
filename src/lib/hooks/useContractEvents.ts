"use client";

import { useEffect, useState } from "react";
import { usePublicClient } from "wagmi";
import { decodeEventLog, type Address } from "viem";
import { GARANTYA_ABI } from "@/lib/contract";
import { formatAVAX } from "@/lib/utils";

export interface TimelineEvent {
  id: string;
  label: string;
  detail?: string;
  timestamp?: number;
  color: "green" | "amber" | "red" | "blue" | "stone";
}

type Args = Record<string, unknown>;

const EVENT_MAP: Record<string, (a: Args) => Pick<TimelineEvent, "label" | "detail" | "color">> = {
  ContractCreated:           ()  => ({ label: "Contrato creado",                                                                              color: "stone" }),
  Funded:                    (a) => ({ label: "Depósito recibido",          detail: `${formatAVAX(a.amount as bigint)} AVAX`,                  color: "green" }),
  Proposed:                  (a) => ({ label: "Propuesta enviada",          detail: `${formatAVAX(a.tenantAmount as bigint)} AVAX al inquilino`, color: "amber" }),
  Accepted:                  ()  => ({ label: "Propuesta aceptada",                                                                           color: "green" }),
  Rejected:                  ()  => ({ label: "Propuesta rechazada",                                                                          color: "red"   }),
  Resolved:                  (a) => ({ label: "Árbitro resolvió",           detail: `${formatAVAX(a.tenantAmount as bigint)} / ${formatAVAX(a.landlordAmount as bigint)} AVAX`, color: "blue" }),
  TimeoutExecuted:           ()  => ({ label: "Timeout ejecutado",                                                                            color: "stone" }),
  ArbitratorTimeoutExecuted: ()  => ({ label: "Timeout del árbitro",                                                                          color: "amber" }),
  Reclaimed:                 (a) => ({ label: "Depósito reclamado",         detail: `${formatAVAX(a.amount as bigint)} AVAX devueltos`,         color: "stone" }),
  Cancelled:                 ()  => ({ label: "Contrato cancelado",                                                                           color: "stone" }),
  CancelledPending:          ()  => ({ label: "Cancelado por propietario",                                                                    color: "stone" }),
  Withdrawn:                 (a) => ({ label: "Fondos retirados",           detail: `${formatAVAX(a.amount as bigint)} AVAX`,                  color: "green" }),
};

export function useContractEvents(address: Address) {
  const client = usePublicClient();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!client) return;
    let cancelled = false;

    async function fetch() {
      setIsLoading(true);
      try {
        const logs = await client!.getLogs({ address, fromBlock: 0n, toBlock: "latest" });
        if (cancelled) return;

        // Fetch block timestamps in parallel
        const uniqueBlocks = [...new Set(logs.map(l => l.blockNumber).filter(Boolean) as bigint[])];
        const timestamps = new Map<bigint, number>();
        await Promise.all(uniqueBlocks.map(async (bn) => {
          try {
            const block = await client!.getBlock({ blockNumber: bn });
            timestamps.set(bn, Number(block.timestamp));
          } catch {}
        }));
        if (cancelled) return;

        const parsed: TimelineEvent[] = [];
        for (const log of logs) {
          try {
            const decoded = decodeEventLog({ abi: GARANTYA_ABI, data: log.data, topics: log.topics });
            const mapper = EVENT_MAP[decoded.eventName as string];
            if (!mapper) continue;
            const { label, detail, color } = mapper(decoded.args as Args);
            parsed.push({
              id: `${log.transactionHash}-${log.logIndex ?? 0}`,
              label,
              detail,
              color,
              timestamp: log.blockNumber ? timestamps.get(log.blockNumber) : undefined,
            });
          } catch {}
        }

        setEvents(parsed);
      } catch (err) {
        console.error("useContractEvents:", err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetch();
    return () => { cancelled = true; };
  }, [client, address]);

  return { events, isLoading };
}
