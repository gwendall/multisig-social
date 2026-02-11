"use client";

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { trustRegistryAbi } from "@/lib/abi";

export function usePropose(registryAddress: `0x${string}`) {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const propose = (proposalType: number, target: `0x${string}`) => {
    writeContract({
      address: registryAddress,
      abi: trustRegistryAbi,
      functionName: "propose",
      args: [proposalType, target],
    });
  };

  return { propose, isPending, isConfirming, isSuccess, error, hash };
}

export function useVouchFor(registryAddress: `0x${string}`) {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const vouch = (proposalId: bigint) => {
    writeContract({
      address: registryAddress,
      abi: trustRegistryAbi,
      functionName: "vouch",
      args: [proposalId],
    });
  };

  return { vouch, isPending, isConfirming, isSuccess, error, hash };
}
