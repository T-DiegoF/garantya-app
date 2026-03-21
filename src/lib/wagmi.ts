import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { hardhat } from "viem/chains";
import { http } from "wagmi";

export const wagmiConfig = getDefaultConfig({
  appName: "GarantYa",
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_ID!,
  chains: [hardhat],
  transports: {
    [hardhat.id]: http("http://127.0.0.1:8545"),
  },
  ssr: true,
});