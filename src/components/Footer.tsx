"use client";

import Link from "next/link";
import { Logo } from "@/components/Logo";
import { useT } from "@/contexts/LanguageContext";
import { useAccount } from "wagmi";

export function Footer() {
  const { t } = useT();
  const { isConnected } = useAccount();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#1C1917] text-[#F5F0E8]">
      <div className="mx-auto max-w-2xl px-4 sm:px-6">

        {/* Main grid */}
        <div className="grid grid-cols-1 gap-10 py-12 sm:grid-cols-[1fr_auto]">

          {/* Brand */}
          <div className="flex flex-col gap-4">
            <Logo size={26} inverted />
            <p className="max-w-[260px] text-sm leading-relaxed text-stone-400">
              {t.footer.tagline}
            </p>
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-stone-700 px-3 py-1.5">
              <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-500" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500">
                {t.footer.network}
              </span>
            </div>
          </div>

          {/* Nav links */}
          <nav aria-label="Footer navigation" className="flex flex-col gap-3 sm:items-end">
            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-600 mb-1">
              Links
            </p>
            <Link
              href="/"
              className="text-sm text-stone-400 transition-colors hover:text-[#F5F0E8]"
            >
              {t.footer.links.home}
            </Link>
            {isConnected && (
              <Link
                href="/mis-contratos"
                className="text-sm text-stone-400 transition-colors hover:text-[#F5F0E8]"
              >
                {t.footer.links.contracts}
              </Link>
            )}
            <a
              href="https://github.com/GarantYa"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-stone-400 transition-colors hover:text-[#F5F0E8]"
            >
              GitHub
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
                <path d="M2.5 2.5h6v6M2.5 8.5l6-6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
            </a>
          </nav>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-stone-800 py-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] text-stone-600 leading-relaxed">
            {t.footer.legal}
          </p>
          <p className="text-[11px] text-stone-600 sm:flex-shrink-0">
            {t.footer.rights(year)}
          </p>
        </div>

      </div>
    </footer>
  );
}
