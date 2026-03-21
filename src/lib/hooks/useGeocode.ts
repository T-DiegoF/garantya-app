"use client";

import { useState, useEffect, useRef, startTransition } from "react";

export type GeocodeState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "found"; lat: number; lng: number; display: string }
  | { status: "not_found" };

export function useGeocode(address: string, debounceMs = 800): GeocodeState {
  const [state, setState]   = useState<GeocodeState>({ status: "idle" });
  const timerRef            = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef            = useRef<AbortController | null>(null);

  useEffect(() => {
    // Cancel pending timer and in-flight request
    if (timerRef.current) clearTimeout(timerRef.current);
    if (abortRef.current) abortRef.current.abort();

    const trimmed = address.trim();

    if (trimmed.length < 5) {
      startTransition(() => setState({ status: "idle" }));
      return;
    }

    // Show loading immediately — NOT deferred (user needs instant feedback)
    setState({ status: "loading" });

    timerRef.current = setTimeout(async () => {
      const controller  = new AbortController();
      abortRef.current  = controller;

      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(trimmed)}&limit=1`;
        const res = await fetch(url, {
          signal:  controller.signal,
          headers: {
            "Accept-Language": "es",
            "User-Agent":      "GarantYa/1.0 (rental-escrow-app)",
          },
        });
        const data = await res.json();
        startTransition(() => {
          if (data[0]) {
            setState({
              status:  "found",
              lat:     Number.parseFloat(data[0].lat),
              lng:     Number.parseFloat(data[0].lon),
              display: data[0].display_name,
            });
          } else {
            setState({ status: "not_found" });
          }
        });
      } catch (err) {
        if ((err as Error).name === "AbortError") return; // cancelled — ignore
        startTransition(() => setState({ status: "not_found" }));
      }
    }, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, [address, debounceMs]);

  return state;
}
