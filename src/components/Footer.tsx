"use client";

import Link from "next/link";
import { Logo } from "@/components/Logo";
import { useT } from "@/contexts/LanguageContext";

function AlephBadge() {
  return (
    <a
      href="https://aleph-hackathon-mardelplata.vercel.app/"
      target="_blank"
      rel="noopener noreferrer"
      title="Aleph Hackathon Mar del Plata"
      className="inline-flex items-center gap-1 rounded px-2 py-0.5 bg-[#111] border border-stone-700 hover:border-stone-500 transition-colors"
    >
      <span className="text-[10px] font-black tracking-wider text-white">ALEPH</span>
      <span className="text-[10px] font-black tracking-wider" style={{ color: "#E8431E" }}>HACKATHON</span>
    </a>
  );
}

const SOCIAL = [
  {
    href: "https://x.com/avax",
    label: "Avalanche on X",
    icon: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <path d="M9.294 6.928 14.357 1h-1.2L8.762 6.147 5.25 1H1l5.31 7.727L1 15.001h1.2l4.642-5.399 3.707 5.399H15L9.294 6.928Zm-1.643 1.91-.538-.77L2.64 1.9h1.843l3.454 4.944.538.77 4.49 6.422h-1.843L7.651 8.838Z" />
      </svg>
    ),
  },
  {
    href: "https://github.com/T-DiegoF/garantya-app",
    label: "GitHub",
    icon: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <path d="M8 1a7 7 0 0 0-2.213 13.647c.35.064.478-.152.478-.337 0-.166-.006-.606-.009-1.19-1.947.423-2.357-.937-2.357-.937-.318-.808-.777-1.023-.777-1.023-.635-.434.048-.425.048-.425.702.05 1.071.72 1.071.72.624 1.068 1.637.76 2.036.581.063-.452.244-.76.444-.935-1.554-.177-3.188-.777-3.188-3.456 0-.763.272-1.387.72-1.876-.072-.177-.312-.888.068-1.85 0 0 .587-.189 1.924.716A6.7 6.7 0 0 1 8 4.979c.595.003 1.195.08 1.754.236 1.335-.905 1.921-.716 1.921-.716.382.962.142 1.673.07 1.85.449.489.719 1.113.719 1.876 0 2.686-1.637 3.277-3.197 3.45.251.217.475.644.475 1.298 0 .936-.009 1.691-.009 1.921 0 .187.126.405.482.337A7.001 7.001 0 0 0 8 1Z" />
      </svg>
    ),
  },
  {
    href: "https://www.linkedin.com/in/diego-federico-tapia-a25986176/",
    label: "Diego's LinkedIn",
    icon: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <path d="M3.36 5.33H1.04V15h2.32V5.33ZM2.2 4.37a1.35 1.35 0 1 0 0-2.7 1.35 1.35 0 0 0 0 2.7ZM15 15h-2.32v-4.74c0-.87-.02-1.98-1.21-1.98-1.21 0-1.39.94-1.39 1.92V15H7.76V5.33h2.22v1.02h.03c.31-.59 1.07-1.21 2.2-1.21 2.35 0 2.79 1.55 2.79 3.56V15Z" />
      </svg>
    ),
  },
] as const;

export function Footer() {
  const { t } = useT();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#1C1917] text-[#F5F0E8]">
      <div className="mx-auto max-w-2xl px-4 sm:px-6">

        {/* Single compact strip */}
        <div className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:gap-6">

          {/* Left: logo + home link */}
          <div className="flex items-center gap-4 min-w-0">
            <Logo size={20} inverted />
            <Link
              href="/"
              className="text-xs text-stone-500 hover:text-stone-300 transition-colors"
            >
              {t.footer.links.home}
            </Link>
            <AlephBadge />
          </div>

          {/* Right: social icons + copyright */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              {SOCIAL.map(({ href, label, icon }) => (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  title={label}
                  className="text-stone-600 hover:text-stone-300 transition-colors"
                >
                  {icon}
                </a>
              ))}
            </div>
            <p className="text-[11px] text-stone-700 tabular-nums">
              © {year} GarantYa
            </p>
          </div>

        </div>

      </div>
    </footer>
  );
}
