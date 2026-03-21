import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { avalancheFuji, hardhat } from "viem/chains";
import { http } from "wagmi";

const isDev = process.env.NODE_ENV === "development";

export const wagmiConfig = getDefaultConfig({
  appName: "GarantYa",
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_ID!,
  // Dev: hardhat local + fuji available; Prod: fuji only
  chains: isDev ? [hardhat, avalancheFuji] : [avalancheFuji],
  transports: {
    [hardhat.id]:      http("http://127.0.0.1:8545"),
    [avalancheFuji.id]: http(),
  },
  ssr: true,
});
