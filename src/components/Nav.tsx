"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { Logo } from "@/components/Logo";
import Link from "next/link";
import { useT } from "@/contexts/LanguageContext";
import type { Locale } from "@/lib/i18n";
import { useState, useRef, useEffect } from "react";

const LANG_OPTIONS: { locale: Locale; flag: string }[] = [
  { locale: "en", flag: "🇺🇸" },
  { locale: "es", flag: "🇦🇷" },
  { locale: "pt", flag: "🇧🇷" },
];

export function Nav() {
  const { isConnected } = useAccount();
  const { locale, setLocale, t } = useT();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const current = LANG_OPTIONS.find(o => o.locale === locale)!;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#E0D9CE] bg-[#F5F0E8]/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-2xl items-center justify-between px-4 sm:px-6">
        <Link href="/" aria-label="GarantYa home">
          <Logo size={28} />
        </Link>
        <div className="flex items-center gap-3">
          {isConnected && (
            <>
              <Link href="/contracts" className="text-sm font-bold text-stone-500 hover:text-[#1C1917] transition-colors">
                {t.nav.myContracts}
              </Link>
              <ConnectButton showBalance={{ smallScreen: false, largeScreen: true }} chainStatus="icon" accountStatus="avatar" />
            </>
          )}

          {/* Language dropdown — rightmost per UX convention */}
          <div ref={ref} className="relative">
            <button
              onClick={() => setOpen(v => !v)}
              aria-haspopup="listbox"
              aria-expanded={open}
              aria-label="Select language"
              className="flex items-center gap-1.5 rounded-lg border border-[#E5DFD5] bg-white px-2.5 py-1.5 text-[11px] font-bold text-stone-500 hover:border-stone-300 hover:text-stone-700 transition-colors"
            >
              <span className="text-[13px] leading-none">{current.flag}</span>
              <span className="uppercase tracking-wide">{locale}</span>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className={`transition-transform ${open ? "rotate-180" : ""}`}>
                <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {open && (
              <div
                className="absolute right-0 top-full mt-1.5 w-40 rounded-xl border border-[#E5DFD5] bg-white py-1 shadow-lg shadow-stone-200/60"
              >
                {LANG_OPTIONS.map(({ locale: l, flag }) => (
                  <button
                    key={l}
                    role="option"
                    aria-selected={locale === l}
                    onClick={() => { setLocale(l); setOpen(false); }}
                    className={`flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors hover:bg-[#F5F0E8] ${
                      locale === l ? "font-bold text-[#1C1917]" : "text-stone-500"
                    }`}
                  >
                    <span className="text-base leading-none">{flag}</span>
                    <span>{t.locale[l]}</span>
                    {locale === l && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="ml-auto text-[#A07850]">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
