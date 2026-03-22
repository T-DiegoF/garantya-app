import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Rental guarantee — GarantYa";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface Props {
  params: { address: string };
}

export default function Image({ params }: Readonly<Props>) {
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
        }}
      >
        {/* Logo pill */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              background: "#1C1917",
              color: "#F5F0E8",
              fontSize: 22,
              fontWeight: 900,
              padding: "8px 20px",
              borderRadius: 999,
            }}
          >
            GarantYa
          </div>
          <div style={{ fontSize: 16, color: "#A8A29E", fontWeight: 700, letterSpacing: "0.08em" }}>
            AVALANCHE · BLOCKCHAIN
          </div>
        </div>

        {/* Main headline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: "60px",
            gap: "20px",
          }}
        >
          <div
            style={{
              fontSize: 72,
              fontWeight: 900,
              color: "#1C1917",
              letterSpacing: "-0.04em",
              lineHeight: 1.05,
            }}
          >
            Deposit your
          </div>
          <div
            style={{
              fontSize: 72,
              fontWeight: 900,
              color: "#1C1917",
              letterSpacing: "-0.04em",
              lineHeight: 1.05,
            }}
          >
            guarantee here
          </div>
          <div style={{ fontSize: 26, color: "#78716C", lineHeight: 1.5, marginTop: "8px" }}>
            Your landlord invites you to deposit your rental guarantee securely on-chain.
          </div>
        </div>

        {/* Bottom row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: "auto",
          }}
        >
          {/* Address */}
          <div
            style={{
              background: "#1C1917",
              color: "#F5F0E8",
              fontSize: 20,
              padding: "12px 24px",
              borderRadius: 12,
            }}
          >
            {short}
          </div>

          {/* Badges */}
          <div style={{ display: "flex", gap: "10px" }}>
            <div
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
              No intermediaries
            </div>
            <div
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
              Funds locked
            </div>
            <div
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
              Independent arbitrator
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
