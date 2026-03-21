import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Depósito de garantía — GarantYa";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface Props {
  params: { address: string };
}

export default function Image({ params }: Props) {
  const addr = params.address;
  const short = `${addr.slice(0, 10)}...${addr.slice(-8)}`;

  return new ImageResponse(
    (
      <div
        style={{
          background: "#F5F0E8",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "80px",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Top bar */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "auto" }}>
          <div
            style={{
              background: "#1C1917",
              color: "#F5F0E8",
              fontSize: 18,
              fontWeight: 900,
              padding: "6px 16px",
              borderRadius: 999,
              letterSpacing: "-0.02em",
            }}
          >
            GarantYa
          </div>
          <div style={{ fontSize: 16, color: "#A8A29E", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700 }}>
            Avalanche · Blockchain
          </div>
        </div>

        {/* Main content */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px", marginTop: "60px" }}>
          <div
            style={{
              fontSize: 72,
              fontWeight: 900,
              color: "#1C1917",
              letterSpacing: "-0.04em",
              lineHeight: 1.05,
            }}
          >
            Depositá tu
            <br />
            garantía aquí
          </div>
          <div style={{ fontSize: 28, color: "#78716C", lineHeight: 1.5, maxWidth: 700 }}>
            Tu propietario te invita a depositar tu garantía de alquiler de forma segura, sin intermediarios y 100% on-chain.
          </div>
        </div>

        {/* Bottom */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto", paddingTop: "48px" }}>
          {/* Address pill */}
          <div
            style={{
              background: "#1C1917",
              color: "#F5F0E8",
              fontFamily: "monospace",
              fontSize: 20,
              padding: "12px 24px",
              borderRadius: 12,
            }}
          >
            {short}
          </div>
          {/* Trust badges */}
          <div style={{ display: "flex", gap: "12px" }}>
            {["Sin intermediarios", "Fondos bloqueados", "Árbitro independiente"].map((label) => (
              <div
                key={label}
                style={{
                  background: "#FFFFFF",
                  border: "1.5px solid #E5DFD5",
                  borderRadius: 999,
                  fontSize: 15,
                  fontWeight: 700,
                  padding: "8px 16px",
                  color: "#57534E",
                }}
              >
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
