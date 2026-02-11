import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { mainnet, base, hardhat } from "wagmi/chains";

const isDev = process.env.NODE_ENV === "development";

export const config = getDefaultConfig({
  appName: "multisig.social",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "demo",
  chains: isDev ? [hardhat, mainnet, base] : [mainnet, base],
  ssr: true,
});
