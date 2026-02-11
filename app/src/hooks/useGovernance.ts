"use client";

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { trustRegistryFactoryAbi } from "@/lib/abi";
import { FACTORY_ADDRESSES } from "@/lib/contracts";
import { useChainId } from "wagmi";

export function useCreateRegistry() {
  const chainId = useChainId();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const createRegistry = (
    name: string,
    initialValidators: `0x${string}`[],
    memberThreshold: bigint,
    validatorThresholdPct: bigint,
    proposalDuration: bigint,
    checker: `0x${string}` = "0x0000000000000000000000000000000000000000"
  ) => {
    const factoryAddress = FACTORY_ADDRESSES[chainId];
    if (!factoryAddress || factoryAddress === "0x0000000000000000000000000000000000000000") {
      throw new Error(`Factory not deployed on chain ${chainId}`);
    }

    writeContract({
      address: factoryAddress,
      abi: trustRegistryFactoryAbi,
      functionName: "createRegistry",
      args: [name, initialValidators, memberThreshold, validatorThresholdPct, proposalDuration, checker],
    });
  };

  return { createRegistry, isPending, isConfirming, isSuccess, error, hash };
}
