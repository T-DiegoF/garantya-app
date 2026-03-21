"use client";

import { useState, useEffect, useRef } from "react";

export type GeocodeState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "found"; lat: number; lng: number; display: string }
  | { status: "not_found" };

export function useGeocode(address: string, debounceMs = 800): GeocodeState {
  const [state, setState] = useState<GeocodeState>({ status: "idle" });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    const trimmed = address.trim();
    if (trimmed.length < 5) {
      setState({ status: "idle" });
      return;
    }

    setState({ status: "loading" });

    timerRef.current = setTimeout(async () => {
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(trimmed)}&limit=1&addressdetails=1`;
        const res  = await fetch(url, { headers: { "Accept-Language": "es" } });
        const data = await res.json();
        if (data[0]) {
          setState({
            status:  "found",
            lat:     parseFloat(data[0].lat),
            lng:     parseFloat(data[0].lon),
            display: data[0].display_name,
          });
        } else {
          setState({ status: "not_found" });
        }
      } catch {
        setState({ status: "not_found" });
      }
    }, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [address, debounceMs]);

  return state;
}
