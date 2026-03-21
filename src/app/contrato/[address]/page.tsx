import type { Metadata } from "next";
import ContratoClient from "./_client";

const ogTitles: Record<string, string> = {
  en: "Deposit your rental guarantee",
  es: "Depositá tu garantía de alquiler",
  pt: "Deposite sua garantia de aluguel",
};

const ogDescs: Record<string, string> = {
  en: "Your landlord invites you to deposit your rental guarantee securely on-chain. No intermediaries.",
  es: "Tu propietario te invita a depositar tu garantía de alquiler de forma segura en blockchain. Sin intermediarios.",
  pt: "Seu proprietário convida você a depositar sua garantia de aluguel de forma segura na blockchain. Sem intermediários.",
};

interface Props {
  params: { address: string };
  searchParams: { lang?: string };
}

export async function generateMetadata({ params, searchParams }: Readonly<Props>): Promise<Metadata> {
  const addr = params.address;
  const short = `${addr.slice(0, 6)}…${addr.slice(-4)}`;
  const lang = searchParams.lang ?? "en";
  const title = ogTitles[lang] ?? ogTitles.en;
  const desc = ogDescs[lang] ?? ogDescs.en;

  const ogImage = {
    url: `/api/og?address=${addr}&lang=${lang}`,
    width: 1200,
    height: 630,
    alt: "GarantYa — Rental guarantee on blockchain",
  };

  return {
    title: `Garantía ${short} — GarantYa`,
    description: desc,
    openGraph: {
      title,
      description: desc,
      type: "website",
      siteName: "GarantYa",
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} — GarantYa`,
      description: desc,
      images: [ogImage.url],
    },
  };
}

export default function Page({ params }: Readonly<{ params: { address: string } }>) {
  return <ContratoClient params={params} />;
}
