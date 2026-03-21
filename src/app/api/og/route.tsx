import { ImageResponse } from "next/og";
import { type NextRequest } from "next/server";

export const runtime = "edge";

const i18n = {
  en: {
    line1: "Deposit your",
    line2: "guarantee here",
    sub: "Your landlord invites you to deposit your rental guarantee securely on-chain.",
    badge1: "No intermediaries",
    badge2: "Funds locked",
    badge3: "Independent arbitrator",
  },
  es: {
    line1: "Depositá tu",
    line2: "garantía aquí",
    sub: "Tu propietario te invita a depositar tu garantía de alquiler de forma segura en blockchain.",
    badge1: "Sin intermediarios",
    badge2: "Fondos bloqueados",
    badge3: "Árbitro independiente",
  },
  pt: {
    line1: "Deposite sua",
    line2: "garantia aqui",
    sub: "Seu proprietário convida você a depositar sua garantia de aluguel de forma segura na blockchain.",
    badge1: "Sem intermediários",
    badge2: "Fundos bloqueados",
    badge3: "Árbitro independente",
  },
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address") ?? "";
  const lang = (searchParams.get("lang") ?? "en") as keyof typeof i18n;
  const copy = i18n[lang] ?? i18n.en;
  const short = address.length > 10
    ? `${address.slice(0, 10)}...${address.slice(-8)}`
    : address;

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
        <div style={{ display: "flex", flexDirection: "column", marginTop: "60px", gap: "4px" }}>
          <div style={{ fontSize: 72, fontWeight: 900, color: "#1C1917", letterSpacing: "-0.04em", lineHeight: 1.05 }}>
            {copy.line1}
          </div>
          <div style={{ fontSize: 72, fontWeight: 900, color: "#1C1917", letterSpacing: "-0.04em", lineHeight: 1.05 }}>
            {copy.line2}
          </div>
          <div style={{ fontSize: 26, color: "#78716C", lineHeight: 1.5, marginTop: "16px" }}>
            {copy.sub}
          </div>
        </div>

        {/* Bottom row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
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
          <div style={{ display: "flex", gap: "10px" }}>
            {[copy.badge1, copy.badge2, copy.badge3].map((label) => (
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
    { width: 1200, height: 630 }
  );
}
