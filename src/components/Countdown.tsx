"use client";

import { useEffect, useState } from "react";

interface CountdownProps {
  deadline: bigint;
  totalSeconds?: number;
}

interface TimeLeft {
  days: number;
  hours: number;
  mins: number;
  secs: number;
  expired: boolean;
}

function getTimeLeft(deadline: bigint): TimeLeft {
  const now = Math.floor(Date.now() / 1000);
  const diff = Number(deadline) - now;
  if (diff <= 0) return { days: 0, hours: 0, mins: 0, secs: 0, expired: true };
  return {
    days:    Math.floor(diff / 86400),
    hours:   Math.floor((diff % 86400) / 3600),
    mins:    Math.floor((diff % 3600) / 60),
    secs:    diff % 60,
    expired: false,
  };
}

function pad(n: number) { return String(n).padStart(2, "0"); }

export function Countdown({ deadline, totalSeconds = 7 * 24 * 3600 }: CountdownProps) {
  const [time, setTime] = useState<TimeLeft>(() => getTimeLeft(deadline));

  useEffect(() => {
    const id = setInterval(() => setTime(getTimeLeft(deadline)), 1000);
    return () => clearInterval(id);
  }, [deadline]);

  const remaining = Number(deadline) - Math.floor(Date.now() / 1000);
  const pct = Math.max(0, Math.min(100, Math.round((remaining / totalSeconds) * 100)));

  if (time.expired) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center">
        <p className="text-sm font-bold text-red-800">
          Tiempo vencido — la propuesta fue aceptada automáticamente
        </p>
      </div>
    );
  }

  const units = [
    { value: time.days,  label: "días"  },
    { value: time.hours, label: "horas" },
    { value: time.mins,  label: "min"   },
    { value: time.secs,  label: "seg"   },
  ];

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
      <div className="flex justify-center gap-2 mb-4">
        {units.map((unit, i) => (
          <div key={unit.label} className="flex items-start gap-2">
            <div className="flex flex-col items-center gap-1.5">
              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-[#1C1917]">
                <span className="font-black text-2xl text-[#F5F0E8] tabular-nums">
                  {pad(unit.value)}
                </span>
              </div>
              <span className="text-[9px] font-bold uppercase tracking-widest text-amber-700">
                {unit.label}
              </span>
            </div>
            {i < 3 && (
              <span className="mt-3 text-2xl font-black text-amber-400 opacity-60">:</span>
            )}
          </div>
        ))}
      </div>
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-stone-400 font-medium">
          <span>Tiempo restante</span>
          <span>{pct}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-200">
          <div
            className="h-full rounded-full bg-amber-500 transition-all duration-1000"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
