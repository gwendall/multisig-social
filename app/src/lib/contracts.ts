import { mainnet, base, hardhat } from "wagmi/chains";

// Factory addresses per chain - update after deployment
export const FACTORY_ADDRESSES: Record<number, `0x${string}`> = {
  [hardhat.id]: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  [mainnet.id]: "0x0000000000000000000000000000000000000000",
  [base.id]: "0x0000000000000000000000000000000000000000",
};

// Demo registry on local Anvil
export const DEMO_REGISTRY = "0xB7A5bd0345EF1Cc5E66bf61BdeC17D2461fBd968" as const;

export const PROPOSAL_TYPES = {
  ADD_MEMBER: 0,
  REMOVE_MEMBER: 1,
  ADD_VALIDATOR: 2,
  REMOVE_VALIDATOR: 3,
} as const;

export const PROPOSAL_TYPE_LABELS: Record<number, string> = {
  0: "Add member",
  1: "Kick member",
  2: "Elect validator",
  3: "Kick validator",
};

export const PROPOSAL_TYPE_VERBS: Record<number, string> = {
  0: "joining",
  1: "kicking",
  2: "electing",
  3: "kicking",
};
