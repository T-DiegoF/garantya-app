"use client";

import { useAccount } from "wagmi";
import { type Address, isAddress } from "viem";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useEscrow } from "@/lib/hooks/useEscrow";
import { TenantView } from "@/components/views/TenantView";
import { LandlordView } from "@/components/views/LandlordView";
import { ArbitratorView } from "@/components/views/ArbitratorView";
import { EventTimeline } from "@/components/EventTimeline";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";

interface PageProps {
  params: { address: string };
}

export default function ContratoPage({ params }: PageProps) {
  const { address: userAddress, isConnected } = useAccount();
  const contractAddress = params.address as Address;

  const escrow = useEscrow(contractAddress);

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-20">
        <p className="text-stone-400 text-sm">Conectá tu wallet para ver el contrato</p>
        <ConnectButton />
      </div>
    );
  }

  if (!isAddress(contractAddress)) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <Badge variant="red">Dirección inválida</Badge>
        <Link href="/" className="text-sm text-stone-400 underline">Volver al inicio</Link>
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
          Cargando contrato...
        </div>
      </div>
    );
  }

  if (escrow.error || !escrow.tenant) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <Badge variant="red">Contrato no encontrado</Badge>
        <p className="text-xs text-stone-400 font-mono">{contractAddress}</p>
        <Link href="/" className="text-sm text-stone-400 underline">Volver al inicio</Link>
      </div>
    );
  }

  if (escrow.role === "unknown") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <Badge variant="gray">Sin acceso</Badge>
        <p className="text-sm text-stone-400 text-center max-w-xs">
          Tu wallet no es parte de este contrato.
        </p>
        <p className="text-xs font-mono text-stone-300">{userAddress}</p>
        <Link href="/" className="text-sm text-stone-400 underline">Volver al inicio</Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {escrow.role === "tenant"     && <TenantView     address={contractAddress} escrow={escrow} />}
      {escrow.role === "landlord"   && <LandlordView   address={contractAddress} escrow={escrow} />}
      {escrow.role === "arbitrator" && <ArbitratorView address={contractAddress} escrow={escrow} />}
      <EventTimeline address={contractAddress} />
    </div>
  );
}
