"use client";

import { useReadContract, useReadContracts } from "wagmi";
import { trustRegistryAbi } from "@/lib/abi";

interface Proposal {
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

export function useActiveProposals(registryAddress: `0x${string}`) {
  const contract = { address: registryAddress, abi: trustRegistryAbi } as const;

  const { data: proposalCount } = useReadContract({
    ...contract,
    functionName: "proposalCount",
  });

  const count = Number(proposalCount || BigInt(0));

  // Build batch reads for all proposals + their vouch counts
  const proposalCalls = Array.from({ length: count }, (_, i) => [
    { ...contract, functionName: "getProposal" as const, args: [BigInt(i)] },
    { ...contract, functionName: "getVouchCount" as const, args: [BigInt(i)] },
  ]).flat();

  // Also get required vouches for each type (0-3)
  const thresholdCalls = [0, 1, 2, 3].map((t) => ({
    ...contract,
    functionName: "getRequiredVouches" as const,
    args: [t],
  }));

  const { data: proposalData } = useReadContracts({
    contracts: proposalCalls,
    query: { enabled: count > 0 },
  });

  const { data: thresholdData } = useReadContracts({
    contracts: thresholdCalls,
  });

  const requiredByType: Record<number, bigint> = {};
  if (thresholdData) {
    for (let i = 0; i < 4; i++) {
      requiredByType[i] = (thresholdData[i]?.result as bigint) || BigInt(0);
    }
  }

  const now = Math.floor(Date.now() / 1000);
  const proposals: Proposal[] = [];

  if (proposalData) {
    for (let i = 0; i < count; i++) {
      const p = proposalData[i * 2]?.result as {
        proposalType: number;
        target: `0x${string}`;
        proposer: `0x${string}`;
        createdAt: number;
        expiresAt: number;
        executed: boolean;
      } | undefined;

      const vouches = proposalData[i * 2 + 1]?.result as bigint | undefined;

      if (p && !p.executed && p.expiresAt > now) {
        proposals.push({
          id: BigInt(i),
          ...p,
          vouchCount: vouches || BigInt(0),
          requiredVouches: requiredByType[p.proposalType] || BigInt(0),
        });
      }
    }
  }

  return proposals;
}
