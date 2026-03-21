"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { Logo } from "@/components/Logo";
import Link from "next/link";

export function Nav() {
  const { isConnected } = useAccount();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#E0D9CE] bg-[#F5F0E8]/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-2xl items-center justify-between px-4 sm:px-6">
        <Link href="/" aria-label="GarantYa inicio">
          <Logo size={28} />
        </Link>
        {isConnected && (
          <div className="flex items-center gap-4">
            <Link href="/mis-contratos" className="text-sm font-bold text-stone-500 hover:text-[#1C1917] transition-colors">
              Mis contratos
            </Link>
            <ConnectButton showBalance={false} chainStatus="icon" accountStatus="avatar" />
          </div>
        )}
      </div>
    </header>
  );
}
