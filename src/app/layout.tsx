import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Web3Provider } from "@/providers/Web3Provider";
import { Nav } from "@/components/Nav";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GarantYa — Depósito de alquiler en blockchain",
  description:
    "Bloqueá tu depósito de alquiler en blockchain. El propietario propone, vos aceptás o rechazás. Nadie mueve los fondos solo.",
  openGraph: {
    title: "GarantYa",
    description: "Depósito de alquiler protegido en Avalanche",
    siteName: "GarantYa",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="bg-[#F5F0E8] text-[#1C1917] antialiased">
        <Web3Provider>
          <Nav />
          <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
            {children}
          </main>
        </Web3Provider>
      </body>
    </html>
  );
}
