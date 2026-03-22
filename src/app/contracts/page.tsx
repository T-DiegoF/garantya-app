"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useAccount, useReadContract, useReadContracts, usePublicClient } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { type Address, isAddress } from "viem";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { FACTORY_ADDRESS, GARANTYA_FACTORY_ABI, GARANTYA_ABI, ContractState } from "@/lib/contract";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useT } from "@/contexts/LanguageContext";
import { logger } from "@/lib/logger";
import { supabase, type ContractMetadata } from "@/lib/supabase";

function AlertBanner({ contracts, targetState, title, description }: {
  contracts: Address[];
  targetState: ContractState;
  title: (count: number) => string;
  description: string;
}) {
  const { data } = useReadContracts({
    contracts: contracts.map(addr => ({
      address: addr,
      abi: GARANTYA_ABI,
      functionName: "state" as const,
    })),
    query: { enabled: contracts.length > 0 },
  });

  const matching = contracts.filter((_, i) => Number(data?.[i]?.result) === targetState);
  if (matching.length === 0) return null;

  return (
    <Link href={`/contract/${matching[0]}`}>
      <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5 cursor-pointer hover:border-amber-300 transition-colors"
        style={{ boxShadow: "0 1px 3px rgba(180,120,0,0.08)" }}>
        <span className="mt-0.5 flex-shrink-0 text-amber-500">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 2L14.5 13H1.5L8 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M8 6v3.5M8 11v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-amber-900">{title(matching.length)}</p>
          <p className="text-xs text-amber-700 mt-0.5">{description}</p>
        </div>
        <span className="text-amber-400 flex-shrink-0 text-sm mt-0.5">→</span>
      </div>
    </Link>
  );
}

function HighlightedAddress({ address, query }: { address: string; query: string }) {
  if (!query) return <span>{address}</span>;
  const lower = address.toLowerCase();
  const idx = lower.indexOf(query.toLowerCase());
  if (idx === -1) return <span>{address}</span>;
  return (
    <span>
      {address.slice(0, idx)}
      <mark className="bg-amber-100 text-amber-900 rounded px-0.5 not-italic font-bold">
        {address.slice(idx, idx + query.length)}
      </mark>
      {address.slice(idx + query.length)}
    </span>
  );
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function shortAddr(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function ContractItem({ address, state, index, highlight, daysLeft, deadline, statePill, meta, tenantAddr, onHover }: {
  address: Address;
  state: number | undefined;
  index: number;
  highlight?: string;
  daysLeft?: number;
  deadline?: number;
  statePill: Record<number, { label: string; className: string }>;
  meta?: ContractMetadata;
  tenantAddr?: string;
  onHover?: () => void;
}) {
  const { t } = useT();
  const pill = state !== undefined ? statePill[state] : undefined;
  const isDone = state === ContractState.Completed || state === ContractState.Cancelled;

  const createdDate = meta?.created_at ? formatDate(new Date(meta.created_at).getTime()) : null;
  const endDate     = deadline ? formatDate(deadline * 1000) : null;
  const showDaysLeft = !isDone && daysLeft !== undefined;
  const daysColor   = !daysLeft ? "text-red-500" : daysLeft <= 30 ? "text-red-500" : daysLeft <= 90 ? "text-amber-500" : "text-stone-400";

  return (
    <Link href={`/contract/${address}`}>
      <div
        className={`card transition-all duration-150 cursor-pointer group hover:-translate-y-px ${isDone ? "opacity-60 hover:opacity-100" : "hover:border-stone-300"}`}
        style={{ animationDelay: `${index * 50}ms` }}
        onMouseEnter={onHover}
      >
        {/* Row 1: property / address + state pill */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#F5F0E8] border border-[#E5DFD5] flex items-center justify-center flex-shrink-0">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 7l5-5 5 5M3 6.5V12h3V9h2v3h3V6.5" stroke="#A07850" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-stone-700 truncate">
                {meta?.property_address || (
                  <span className="font-mono tracking-tight">
                    <HighlightedAddress address={shortAddr(address)} query={highlight ?? ""} />
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {pill && (
              <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full ${pill.className}`}>
                {pill.label}
              </span>
            )}
            <span className="text-stone-300 group-hover:text-stone-600 transition-colors text-sm">→</span>
          </div>
        </div>

        {/* Row 2: tenant + dates */}
        {(meta?.tenant_name || createdDate || endDate) && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-stone-100 flex-wrap">
            {(meta?.tenant_name || tenantAddr) && (
              <>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-stone-600 bg-stone-100 rounded-full px-2 py-0.5">
                  <svg width="9" height="9" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                    <circle cx="5" cy="3.5" r="2" stroke="currentColor" strokeWidth="1.3" />
                    <path d="M1.5 9c0-1.933 1.567-3 3.5-3s3.5 1.067 3.5 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                  </svg>
                  {meta?.tenant_name ?? shortAddr(tenantAddr!)}
                </span>
                {(createdDate || endDate) && <span className="text-stone-200 text-[10px]">·</span>}
              </>
            )}
            {createdDate && (
              <span className="text-[10px] text-stone-400">
                <span className="font-semibold text-stone-500">{t.contracts.created}</span> {createdDate}
              </span>
            )}
            {createdDate && endDate && <span className="text-stone-200 text-[10px]">·</span>}
            {endDate && (
              <span className="text-[10px] text-stone-400">
                <span className="font-semibold text-stone-500">{t.contracts.ends}</span> {endDate}
              </span>
            )}
            {showDaysLeft && (
              <>
                <span className="text-stone-200 text-[10px]">·</span>
                <span className={`text-[10px] font-bold ${daysColor}`}>
                  {daysLeft === 0 ? t.contracts.expired : `${daysLeft}d`}
                </span>
              </>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}

export default function MisContratosPage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [searchAddress, setSearchAddress] = useState("");
  const [searchError,   setSearchError]   = useState("");
  const { t } = useT();
  const queryClient  = useQueryClient();
  const publicClient = usePublicClient();

  const prefetchContract = useCallback((contractAddr: Address) => {
    queryClient.prefetchQuery({
      queryKey: ["readContracts", { address: contractAddr }],
      queryFn: () => publicClient!.readContract({ address: contractAddr, abi: GARANTYA_ABI, functionName: "state" }),
      staleTime: 30_000,
    });
  }, [queryClient, publicClient]);

  const STATE_PILL: Record<number, { label: string; className: string }> = {
    [ContractState.Created]:              { label: t.contracts.states.created,   className: "bg-stone-100 text-stone-500" },
    [ContractState.Funded]:               { label: t.contracts.states.funded,    className: "bg-green-50 text-green-700" },
    [ContractState.DistributionProposed]: { label: t.contracts.states.proposed,  className: "bg-amber-50 text-amber-700" },
    [ContractState.Disputed]:             { label: t.contracts.states.disputed,  className: "bg-red-50 text-red-700" },
    [ContractState.Completed]:            { label: t.contracts.states.completed, className: "bg-stone-100 text-stone-400" },
    [ContractState.Cancelled]:            { label: t.contracts.states.cancelled, className: "bg-stone-100 text-stone-400" },
  };

  function handleSearch() {
    const addr = searchAddress.trim();
    if (!isAddress(addr)) {
      logger.warn("[Garantya:MisContratos] Búsqueda con dirección inválida:", addr);
      setSearchError(t.common.invalidAddress);
      return;
    }
    logger.log("[Garantya:MisContratos] Navegando a contrato:", addr);
    router.push(`/contract/${addr}`);
  }

  const { data: asTenant, isLoading: loadingTenant } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: GARANTYA_FACTORY_ABI,
    functionName: "getContractsByTenant",
    args: [address!, 0n, 20n],
    query: { enabled: !!address, staleTime: 30_000, gcTime: 5 * 60_000 },
  });

  const { data: asLandlord, isLoading: loadingLandlord } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: GARANTYA_FACTORY_ABI,
    functionName: "getContractsByLandlord",
    args: [address!, 0n, 20n],
    query: { enabled: !!address, staleTime: 30_000, gcTime: 5 * 60_000 },
  });

  const isLoadingContracts = loadingTenant || loadingLandlord;
  const tenantContracts   = (asTenant   as Address[] | undefined) ?? [];
  const landlordContracts = (asLandlord as Address[] | undefined) ?? [];

  const [metaMap, setMetaMap] = useState<Record<string, ContractMetadata>>({});

  useEffect(() => {
    if (!address) return;
    logger.log("[Garantya:MisContratos] Contratos cargados para", address, {
      comoArrendador: landlordContracts.length,
      comoInquilino: tenantContracts.length,
    });
  }, [address, landlordContracts.length, tenantContracts.length]);

  // Fetch metadata from Supabase for all contracts
  useEffect(() => {
    const all = [...landlordContracts, ...tenantContracts];
    if (all.length === 0) return;
    supabase
      .from("contracts")
      .select("*")
      .in("address", all.map(a => a.toLowerCase()))
      .then(({ data }) => {
        if (!data) return;
        const map: Record<string, ContractMetadata> = {};
        data.forEach(row => { map[row.address.toLowerCase()] = row; });
        setMetaMap(map);
      });
  }, [landlordContracts.length, tenantContracts.length]);

  // Browser notification for tenant with pending deposit
  useEffect(() => {
    if (tenantContracts.length === 0) return;
    if (!("Notification" in window)) return;
    if (Notification.permission === "denied") return;
    const notify = () => new Notification("GarantYa", {
      body: "Tenés un contrato esperando tu depósito de garantía.",
      icon: "/favicon.ico",
    });
    if (Notification.permission === "granted") {
      notify();
    } else {
      Notification.requestPermission().then(p => { if (p === "granted") notify(); });
    }
  }, [tenantContracts.length]);

  const allContracts      = useMemo(
    () => [...landlordContracts, ...tenantContracts],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [asTenant, asLandlord]
  );

  const { data: statesData } = useReadContracts({
    contracts: allContracts.map(addr => ({
      address: addr,
      abi: GARANTYA_ABI,
      functionName: "state" as const,
    })),
    query: { enabled: allContracts.length > 0, staleTime: 10_000, gcTime: 60_000 },
  });

  const { data: deadlinesData } = useReadContracts({
    contracts: allContracts.map(addr => ({
      address: addr,
      abi: GARANTYA_ABI,
      functionName: "contractDeadline" as const,
    })),
    query: { enabled: allContracts.length > 0, staleTime: 60_000, gcTime: 5 * 60_000 },
  });

  const { data: tenantsData } = useReadContracts({
    contracts: allContracts.map(addr => ({
      address: addr,
      abi: GARANTYA_ABI,
      functionName: "tenant" as const,
    })),
    query: { enabled: allContracts.length > 0, staleTime: 300_000, gcTime: 10 * 60_000 },
  });

  const hasContracts = tenantContracts.length > 0 || landlordContracts.length > 0;
  const dataReady    = !isLoadingContracts && !!address;

  // O(1) lookup maps — rebuilt only when contract list or chain data changes
  const stateMap = useMemo(() => {
    const map = new Map<Address, number>();
    allContracts.forEach((addr, i) => {
      const raw = statesData?.[i]?.result;
      if (raw !== undefined && raw !== null) map.set(addr, Number(raw));
    });
    return map;
  }, [allContracts, statesData]);

  const deadlineMap = useMemo(() => {
    const map = new Map<Address, number>();
    allContracts.forEach((addr, i) => {
      const raw = deadlinesData?.[i]?.result;
      if (raw) map.set(addr, Number(raw));
    });
    return map;
  }, [allContracts, deadlinesData]);

  const tenantMap = useMemo(() => {
    const map = new Map<Address, string>();
    allContracts.forEach((addr, i) => {
      const raw = tenantsData?.[i]?.result;
      if (raw) map.set(addr, raw as string);
    });
    return map;
  }, [allContracts, tenantsData]);

  const query = searchAddress.trim().toLowerCase();
  const filteredLandlord = query
    ? landlordContracts.filter(a => a.toLowerCase().includes(query))
    : landlordContracts;
  const filteredTenant = query
    ? tenantContracts.filter(a => a.toLowerCase().includes(query))
    : tenantContracts;
  const hasResults = filteredLandlord.length > 0 || filteredTenant.length > 0;

  function getState(addr: Address): number | undefined {
    return stateMap.get(addr);
  }

  function getDaysLeft(addr: Address): number | undefined {
    const deadline = deadlineMap.get(addr);
    if (!deadline) return undefined;
    const diff = Math.floor((deadline * 1000 - Date.now()) / 86_400_000);
    return diff > 0 ? diff : 0;
  }

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-24 animate-fade-up">
        <p className="text-stone-400 text-sm">{t.contracts.connectPrompt}</p>
        <ConnectButton />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-up">

      {/* Tenant: pending deposit */}
      {tenantContracts.length > 0 && (
        <AlertBanner
          contracts={tenantContracts}
          targetState={ContractState.Created}
          title={n => n === 1 ? t.contracts.alerts.tenantPending1 : t.contracts.alerts.tenantPendingN(n)}
          description={t.contracts.alerts.tenantDesc}
        />
      )}

      {/* Landlord: deposit received, action required */}
      {landlordContracts.length > 0 && (
        <AlertBanner
          contracts={landlordContracts}
          targetState={ContractState.Funded}
          title={n => n === 1 ? t.contracts.alerts.landlordFunded1 : t.contracts.alerts.landlordFundedN(n)}
          description={t.contracts.alerts.landlordDesc}
        />
      )}

      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="screen-tag">{t.contracts.tag}</p>
          <h1 className="text-3xl font-black tracking-tight leading-none">{t.contracts.title}</h1>
        </div>
        <Link href="/">
          <Button variant="outline" className="text-sm">{t.contracts.newButton}</Button>
        </Link>
      </div>

      {/* Search */}
      <div className="card space-y-3">
        <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400">{t.contracts.searchLabel}</p>
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              placeholder={t.contracts.searchPlaceholder}
              value={searchAddress}
              onChange={e => { setSearchAddress(e.target.value); setSearchError(""); }}
              error={searchError}
              mono
            />
          </div>
          <Button onClick={handleSearch}>{t.contracts.searchButton}</Button>
        </div>
        {query && !hasResults && (
          <p className="text-xs text-stone-400">
            {t.contracts.noResults}{" "}
            {isAddress(searchAddress.trim()) && (
              <button
                className="underline underline-offset-2 hover:text-stone-600 transition-colors"
                onClick={handleSearch}
              >
                {t.contracts.goToContract}
              </button>
            )}
          </p>
        )}
      </div>

      {/* Loading state */}
      {isLoadingContracts && (
        <div className="card py-14 flex flex-col items-center gap-4 animate-pulse">
          <div className="w-12 h-12 rounded-2xl bg-stone-100" />
          <div className="h-4 w-32 rounded-full bg-stone-100" />
          <div className="h-3 w-48 rounded-full bg-stone-100" />
        </div>
      )}

      {/* Empty state */}
      {dataReady && !hasContracts && (
        <div className="card py-14 flex flex-col items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-[#F5F0E8] border border-[#E5DFD5] flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 3L17 9v9H3V9L10 3z" stroke="#C4B5A5" strokeWidth="1.5" strokeLinejoin="round" />
              <rect x="8" y="13" width="4" height="5" rx="0.5" fill="#C4B5A5" opacity="0.5" />
            </svg>
          </div>
          <div className="text-center space-y-1">
            <p className="font-bold text-stone-700">{t.contracts.emptyTitle}</p>
            <p className="text-sm text-stone-400">{t.contracts.emptyDesc}</p>
          </div>
          <Link href="/">
            <Button>{t.contracts.createButton}</Button>
          </Link>
        </div>
      )}

      {/* As landlord */}
      {filteredLandlord.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400">{t.contracts.sectionLandlord}</p>
            <span className="text-[11px] font-bold text-stone-300">{filteredLandlord.length}</span>
          </div>
          {filteredLandlord.map((addr, i) => (
            <ContractItem key={addr} address={addr} state={getState(addr)} index={i} highlight={searchAddress.trim()} daysLeft={getDaysLeft(addr)} deadline={deadlineMap.get(addr)} statePill={STATE_PILL} meta={metaMap[addr.toLowerCase()]} tenantAddr={tenantMap.get(addr)} onHover={() => prefetchContract(addr)} />
          ))}
        </div>
      )}

      {/* As tenant */}
      {filteredTenant.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400">{t.contracts.sectionTenant}</p>
            <span className="text-[11px] font-bold text-stone-300">{filteredTenant.length}</span>
          </div>
          {filteredTenant.map((addr, i) => (
            <ContractItem key={addr} address={addr} state={getState(addr)} index={i} highlight={searchAddress.trim()} daysLeft={getDaysLeft(addr)} deadline={deadlineMap.get(addr)} statePill={STATE_PILL} meta={metaMap[addr.toLowerCase()]} tenantAddr={tenantMap.get(addr)} onHover={() => prefetchContract(addr)} />
          ))}
        </div>
      )}
    </div>
  );
}
