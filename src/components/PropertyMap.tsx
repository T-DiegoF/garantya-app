"use client";

import { useGeocode } from "@/lib/hooks/useGeocode";

interface PropertyMapProps {
  address: string;
}

export function PropertyMap({ address }: PropertyMapProps) {
  const geo = useGeocode(address);

  if (geo.status === "idle") return null;

  if (geo.status === "loading") {
    return (
      <div className="w-full h-44 rounded-xl border border-[#E5DFD5] bg-stone-100 animate-pulse flex items-center justify-center">
        <svg className="animate-spin h-4 w-4 text-stone-300" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      </div>
    );
  }

  if (geo.status === "not_found") {
    return (
      <div className="w-full h-44 rounded-xl border border-[#E5DFD5] bg-stone-50 flex flex-col items-center justify-center gap-2 text-stone-400">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="8.5" stroke="#C4B5A5" strokeWidth="1.5" />
          <path d="M10 6v4.5M10 13v.5" stroke="#C4B5A5" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <p className="text-xs">No se encontró la dirección</p>
      </div>
    );
  }

  const { lat, lng } = geo;
  const delta  = 0.008;
  const bbox   = `${lng - delta},${lat - delta},${lng + delta},${lat + delta}`;
  const src    = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;

  return (
    <div className="w-full h-44 rounded-xl overflow-hidden border border-[#E5DFD5] animate-fade-up">
      <iframe
        src={src}
        title="Ubicación del inmueble"
        className="w-full h-full"
        style={{ border: "none" }}
        loading="lazy"
      />
    </div>
  );
}
