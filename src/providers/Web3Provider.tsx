"use client";

import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { wagmiConfig } from "@/lib/wagmi";
import { avalancheFuji, hardhat } from "viem/chains";
import "@rainbow-me/rainbowkit/styles.css";

const queryClient = new QueryClient();

const initialChain = process.env.NODE_ENV === "development" ? hardhat : avalancheFuji;

export function Web3Provider({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({ accentColor: "#A07850", borderRadius: "medium" })}
          initialChain={initialChain}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}








