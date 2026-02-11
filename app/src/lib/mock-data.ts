// Static mock data for demo - used when no on-chain contract is reachable (e.g. Vercel)
import type { RegistryEvent } from "@/hooks/useRegistryEvents";

const ACC0 = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" as const;
const ACC1 = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" as const;
const ACC2 = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC" as const;
const ACC3 = "0x90F79bf6EB2c4f870365E785982E1f101E93b906" as const;
const ACC4 = "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65" as const;
const ACC5 = "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc" as const;

export const MOCK_INFO = {
  name: "CryptoPunks Trust",
  memberCount: 5,
  validatorCount: 3,
  memberThreshold: 2,
  validatorThreshold: 67,
  proposalDuration: 604800,
};

export const MOCK_MEMBERS: `0x${string}`[] = [ACC0, ACC1, ACC2, ACC3, ACC4];

export const MOCK_VALIDATORS: `0x${string}`[] = [ACC0, ACC1, ACC2];

export const MOCK_APPLICANTS: `0x${string}`[] = [ACC5];

const now = Math.floor(Date.now() / 1000);
const weekFromNow = now + 604800;

// Active proposals showcasing different governance scenarios
export interface MockProposal {
  id: bigint;
  proposalType: number;
  target: `0x${string}`;
  proposer: `0x${string}`;
  createdAt: number;
  expiresAt: number;
  executed: boolean;
  vouchCount: bigint;
  requiredVouches: bigint;
}

export const MOCK_PROPOSALS: MockProposal[] = [
  // Someone applying to join - 1/2 vouches
  {
    id: BigInt(2),
    proposalType: 0, // ADD_MEMBER
    target: ACC5,
    proposer: ACC0,
    createdAt: now - 600,
    expiresAt: weekFromNow,
    executed: false,
    vouchCount: BigInt(1),
    requiredVouches: BigInt(2),
  },
  // Electing a new validator - 1/3 majority needed
  {
    id: BigInt(3),
    proposalType: 2, // ADD_VALIDATOR
    target: ACC3,
    proposer: ACC1,
    createdAt: now - 1200,
    expiresAt: weekFromNow,
    executed: false,
    vouchCount: BigInt(1),
    requiredVouches: BigInt(3),
  },
  // Kicking a validator - 2/3 majority needed
  {
    id: BigInt(4),
    proposalType: 3, // REMOVE_VALIDATOR
    target: ACC2,
    proposer: ACC0,
    createdAt: now - 1800,
    expiresAt: weekFromNow,
    executed: false,
    vouchCount: BigInt(2),
    requiredVouches: BigInt(3),
  },
];

// Who vouched on each mock proposal (with optional comments)
export interface MockVouch {
  address: `0x${string}`;
  comment?: string;
}

export const MOCK_VOUCHERS: Record<string, MockVouch[]> = {
  "2": [{ address: ACC0, comment: "Met him at ETHDenver, legit punk holder" }],
  "3": [{ address: ACC1, comment: "Been active since day 1, deserves it" }],
  "4": [
    { address: ACC0, comment: "Caught him selling a Meebit as a Punk" },
    { address: ACC1, comment: "Yeah not a real one" },
  ],
};

export const MOCK_EVENTS: RegistryEvent[] = [
  // Active proposal events (most recent first)
  { eventName: "Vouched", args: { validator: ACC1, proposalId: BigInt(4) }, blockNumber: BigInt(18), transactionHash: "0xbbb1", timestamp: now - 300 },
  { eventName: "Vouched", args: { validator: ACC0, proposalId: BigInt(4) }, blockNumber: BigInt(17), transactionHash: "0xbbb2", timestamp: now - 400 },
  { eventName: "ProposalCreated", args: { proposer: ACC0, target: ACC2 }, blockNumber: BigInt(16), transactionHash: "0xbbb3", timestamp: now - 500 },
  { eventName: "Vouched", args: { validator: ACC0, proposalId: BigInt(2) }, blockNumber: BigInt(15), transactionHash: "0xbbb4", timestamp: now - 600 },
  { eventName: "ProposalCreated", args: { proposer: ACC0, target: ACC5 }, blockNumber: BigInt(14), transactionHash: "0xbbb5", timestamp: now - 700 },
  { eventName: "ProposalCreated", args: { proposer: ACC1, target: ACC3 }, blockNumber: BigInt(13), transactionHash: "0xbbb6", timestamp: now - 800 },
  // Existing history
  { eventName: "Applied", args: { applicant: ACC5 }, blockNumber: BigInt(12), transactionHash: "0xaaa1", timestamp: now - 900 },
  { eventName: "AssetLinked", args: { member: ACC3, tokenId: BigInt(6843) }, blockNumber: BigInt(11), transactionHash: "0xaaa2", timestamp: now - 1800 },
  { eventName: "AssetLinked", args: { member: ACC2, tokenId: BigInt(6507) }, blockNumber: BigInt(10), transactionHash: "0xaaa3", timestamp: now - 2100 },
  { eventName: "AssetLinked", args: { member: ACC1, tokenId: BigInt(4736) }, blockNumber: BigInt(9), transactionHash: "0xaaa4", timestamp: now - 2400 },
  { eventName: "AssetLinked", args: { member: ACC0, tokenId: BigInt(2113) }, blockNumber: BigInt(8), transactionHash: "0xaaa5", timestamp: now - 2700 },
  { eventName: "AssetLinked", args: { member: ACC4, tokenId: BigInt(1477) }, blockNumber: BigInt(7), transactionHash: "0xaaa6", timestamp: now - 3000 },
  { eventName: "ProposalExecuted", args: { proposalId: BigInt(1) }, blockNumber: BigInt(6), transactionHash: "0xaaa7", timestamp: now - 3600 },
  { eventName: "Vouched", args: { validator: ACC1, proposalId: BigInt(1) }, blockNumber: BigInt(5), transactionHash: "0xaaa8", timestamp: now - 3700 },
  { eventName: "ProposalCreated", args: { proposer: ACC0, target: ACC4 }, blockNumber: BigInt(4), transactionHash: "0xaaa9", timestamp: now - 3800 },
  { eventName: "MemberAdded", args: { member: ACC4 }, blockNumber: BigInt(3), transactionHash: "0xaaaa", timestamp: now - 4200 },
  { eventName: "ProposalExecuted", args: { proposalId: BigInt(0) }, blockNumber: BigInt(2), transactionHash: "0xaaab", timestamp: now - 5400 },
  { eventName: "Vouched", args: { validator: ACC1, proposalId: BigInt(0) }, blockNumber: BigInt(1), transactionHash: "0xaaac", timestamp: now - 5500 },
  { eventName: "MemberAdded", args: { member: ACC3 }, blockNumber: BigInt(0), transactionHash: "0xaaad", timestamp: now - 7200 },
];
