"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function NavigationProgress() {
  const pathname       = usePathname();
  const searchParams   = useSearchParams();
  const [visible, setVisible]   = useState(false);
  const [width,   setWidth]     = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef   = useRef<number | null>(null);

  useEffect(() => {
    // Route changed — hide bar
    setVisible(false);
    setWidth(0);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (rafRef.current)   cancelAnimationFrame(rafRef.current);
  }, [pathname, searchParams]);

  // Expose a start function via a custom event
  useEffect(() => {
    function onNavigationStart() {
      if (timerRef.current) clearTimeout(timerRef.current);
      setWidth(0);
      setVisible(true);
      // Animate to 80% quickly, then slow down
      rafRef.current = requestAnimationFrame(() => setWidth(30));
      timerRef.current = setTimeout(() => setWidth(60), 200);
      timerRef.current = setTimeout(() => setWidth(80), 800);
    }
    window.addEventListener("navigationstart", onNavigationStart);
    return () => window.removeEventListener("navigationstart", onNavigationStart);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed top-0 left-0 z-[9999] h-[2px] bg-[#A07850] transition-all duration-300 ease-out"
      style={{ width: `${width}%` }}
    />
  );
}
