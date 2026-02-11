"use client";

import { useReadContract, useReadContracts } from "wagmi";
import { trustRegistryAbi } from "@/lib/abi";

export function useRegistryInfo(address: `0x${string}`) {
  const contract = { address, abi: trustRegistryAbi } as const;

  const { data, isLoading } = useReadContracts({
    contracts: [
      { ...contract, functionName: "name" },
      { ...contract, functionName: "memberCount" },
      { ...contract, functionName: "validatorCount" },
      { ...contract, functionName: "memberThreshold" },
      { ...contract, functionName: "validatorThresholdPct" },
      { ...contract, functionName: "proposalDuration" },
      { ...contract, functionName: "proposalCount" },
    ],
  });

  return {
    isLoading,
    name: data?.[0]?.result as string | undefined,
    memberCount: data?.[1]?.result as bigint | undefined,
    validatorCount: data?.[2]?.result as bigint | undefined,
    memberThreshold: data?.[3]?.result as bigint | undefined,
    validatorThresholdPct: data?.[4]?.result as bigint | undefined,
    proposalDuration: data?.[5]?.result as bigint | undefined,
    proposalCount: data?.[6]?.result as bigint | undefined,
  };
}

export function useMembers(address: `0x${string}`) {
  return useReadContract({
    address,
    abi: trustRegistryAbi,
    functionName: "getMembers",
  });
}

export function useValidators(address: `0x${string}`) {
  return useReadContract({
    address,
    abi: trustRegistryAbi,
    functionName: "getValidators",
  });
}

export function useIsValidator(
  registryAddress: `0x${string}`,
  account: `0x${string}` | undefined
) {
  return useReadContract({
    address: registryAddress,
    abi: trustRegistryAbi,
    functionName: "isValidator",
    args: account ? [account] : undefined,
    query: { enabled: !!account },
  });
}

export function useProposal(
  registryAddress: `0x${string}`,
  proposalId: bigint
) {
  const contract = { address: registryAddress, abi: trustRegistryAbi } as const;

  const { data, isLoading } = useReadContracts({
    contracts: [
      { ...contract, functionName: "getProposal", args: [proposalId] },
      { ...contract, functionName: "getVouchCount", args: [proposalId] },
      { ...contract, functionName: "getRequiredVouches", args: [0] }, // will be overridden
    ],
  });

  const proposal = data?.[0]?.result as
    | {
        proposalType: number;
        target: `0x${string}`;
        proposer: `0x${string}`;
        createdAt: number;
        expiresAt: number;
        executed: boolean;
      }
    | undefined;

  return {
    isLoading,
    proposal,
    vouchCount: data?.[1]?.result as bigint | undefined,
  };
}
