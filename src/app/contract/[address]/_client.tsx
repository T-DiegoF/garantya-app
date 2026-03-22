"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { type Address, isAddress } from "viem";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import dynamic from "next/dynamic";
import { useEscrow } from "@/lib/hooks/useEscrow";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import { useT } from "@/contexts/LanguageContext";
import { supabase, type ContractMetadata } from "@/lib/supabase";

// Lazy-load role views — only ONE is ever rendered per session.
// This splits each view into its own chunk, saving ~8-15 kB per unused role.
const TenantView    = dynamic(() => import("@/components/views/TenantView").then(m => ({ default: m.TenantView })),       { ssr: false });
const LandlordView  = dynamic(() => import("@/components/views/LandlordView").then(m => ({ default: m.LandlordView })),   { ssr: false });
const ArbitratorView = dynamic(() => import("@/components/views/ArbitratorView").then(m => ({ default: m.ArbitratorView })), { ssr: false });

// Lazy-load timeline — defers blockchain log fetching until component mounts
const EventTimeline = dynamic(() => import("@/components/EventTimeline").then(m => ({ default: m.EventTimeline })), { ssr: false });

interface PageProps {
  params: { address: string };
}

export default function ContratoPage({ params }: Readonly<PageProps>) {
  const { address: userAddress, isConnected } = useAccount();
  const contractAddress = params.address as Address;
  const { t } = useT();

  const escrow = useEscrow(contractAddress);
  const [meta, setMeta] = useState<ContractMetadata | undefined>(undefined);

  useEffect(() => {
    supabase
      .from("contracts")
      .select("*")
      .eq("address", contractAddress.toLowerCase())

      .single()
      .then(({ data }) => { if (data) setMeta(data as ContractMetadata); });
  }, [contractAddress]);

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-20">
        <p className="text-stone-400 text-sm">{t.common.connectPrompt}</p>
        <ConnectButton />
      </div>
    );
  }

  if (!isAddress(contractAddress)) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <Badge variant="red">{t.common.invalidAddress}</Badge>
        <Link href="/" className="text-sm text-stone-400 underline">{t.common.backHome}</Link>
      </div>
    );
  }

  if (escrow.isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3 text-stone-400 text-sm">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          {t.common.loading}
        </div>
      </div>
    );
  }

  if (escrow.error || !escrow.tenant) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <Badge variant="red">{t.common.contractNotFound}</Badge>
        <p className="text-xs text-stone-400 font-mono">{contractAddress}</p>
        <Link href="/" className="text-sm text-stone-400 underline">{t.common.backHome}</Link>
      </div>
    );
  }

  if (escrow.role === "unknown") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <Badge variant="gray">{t.common.noAccess}</Badge>
        <p className="text-sm text-stone-400 text-center max-w-xs">
          {t.common.noAccessDesc}
        </p>
        <p className="text-xs font-mono text-stone-300">{userAddress}</p>
        <Link href="/" className="text-sm text-stone-400 underline">{t.common.backHome}</Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {escrow.role === "tenant"     && <TenantView     address={contractAddress} escrow={escrow} meta={meta} />}
      {escrow.role === "landlord"   && <LandlordView   address={contractAddress} escrow={escrow} meta={meta} />}
      {escrow.role === "arbitrator" && <ArbitratorView address={contractAddress} escrow={escrow} meta={meta} />}
      <EventTimeline address={contractAddress} />
    </div>
  );
}
