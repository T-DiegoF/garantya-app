import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Web3Provider } from "@/providers/Web3Provider";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { NavigationProgress } from "@/components/NavigationProgress";
import { Suspense } from "react";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://garantya.vercel.app"),
  title: "GarantYa — Rental deposit on blockchain",
  description:
    "Lock your rental deposit on Avalanche. No intermediaries, no custody. The landlord proposes, you accept or reject. Funds move only when both parties agree.",
  openGraph: {
    title: "GarantYa — Rental deposit on blockchain",
    description: "Rental guarantee locked by smart contract on Avalanche. No intermediaries.",
    siteName: "GarantYa",
  },
  twitter: {
    card: "summary_large_image",
    title: "GarantYa",
    description: "Rental guarantee locked by smart contract on Avalanche.",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        {/* Pre-establish connections before JS requests them */}
        <link rel="preconnect" href="https://relay.walletconnect.com" />
        <link rel="preconnect" href="https://api.web3modal.com" />
        <link rel="dns-prefetch" href="https://api.avax-test.network" />
        <meta name="theme-color" content="#F5F0E8" />
      </head>
      <body className="bg-[#F5F0E8] text-[#1C1917] antialiased">
        <LanguageProvider>
          <Web3Provider>
            <Suspense>
              <NavigationProgress />
            </Suspense>
            <div className="flex min-h-screen flex-col">
              <Nav />
              <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6">
                {children}
              </main>
              <Footer />
            </div>
          </Web3Provider>
        </LanguageProvider>
      </body>
    </html>
  );
}
