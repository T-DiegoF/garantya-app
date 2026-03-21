import type { Metadata } from "next";

interface Props {
  params: { address: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const addr = params.address;
  const short = `${addr.slice(0, 6)}…${addr.slice(-4)}`;

  return {
    title: `Garantía ${short} — GarantYa`,
    description:
      "Tu propietario te invita a depositar tu garantía de alquiler de forma segura y transparente en blockchain.",
    openGraph: {
      title: "Depositar garantía de alquiler",
      description:
        "Tu propietario te invita a depositar tu garantía de alquiler de forma segura y transparente en blockchain.",
      type: "website",
      siteName: "GarantYa",
    },
    twitter: {
      card: "summary_large_image",
      title: "Depositar garantía de alquiler — GarantYa",
      description:
        "Tu propietario te invita a depositar tu garantía de alquiler de forma segura y transparente en blockchain.",
    },
  };
}

export default function ContratoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
