import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import {
  injectedWallet,
  metaMaskWallet,
  rainbowWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { avalancheFuji } from "viem/chains";
import { http } from "wagmi";

export const wagmiConfig = getDefaultConfig({
  appName: "GarantYa",
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_ID!,
  wallets: [
    {
      groupName: "Wallets",
      wallets: [injectedWallet, metaMaskWallet, rainbowWallet, walletConnectWallet],
    },
  ],
  chains: [avalancheFuji],
  transports: {
    [avalancheFuji.id]: http("https://api.avax-test.network/ext/bc/C/rpc"),
  },
  ssr: true,
});
