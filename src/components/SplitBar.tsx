"use client";

import { useEffect, useState } from "react";
import { formatAVAX } from "@/lib/utils";

interface SplitBarProps {
  tenantAmount: bigint;
  landlordAmount: bigint;
}

export function SplitBar({ tenantAmount, landlordAmount }: SplitBarProps) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 300);
    return () => clearTimeout(t);
  }, []);

  const total = tenantAmount + landlordAmount;
  const pct = total > 0n
    ? Math.round((Number(tenantAmount) / Number(total)) * 100)
    : 0;

  return (
    <div className="rounded-xl bg-[#EDE8DF] p-4">
      <div className="flex justify-between text-xs font-bold mb-2">
        <span className="text-[#1C1917]">Tu parte — {formatAVAX(tenantAmount)} AVAX</span>
        <span className="text-stone-400">Propietario — {formatAVAX(landlordAmount)}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-stone-300">
        <div
          className="h-full rounded-full bg-[#1C1917] transition-all duration-1000 ease-out"
          style={{ width: animated ? `${pct}%` : "0%" }}
        />
      </div>
      <div className="flex justify-between text-xs font-bold mt-1.5">
        <span className="text-[#1C1917]">{pct}%</span>
        <span className="text-stone-400">{100 - pct}%</span>
      </div>
    </div>
  );
}
