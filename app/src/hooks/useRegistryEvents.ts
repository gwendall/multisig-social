"use client";

import { useEffect, useState } from "react";
import { usePublicClient } from "wagmi";
import { trustRegistryAbi } from "@/lib/abi";

export interface RegistryEvent {
  eventName: string;
  args: Record<string, unknown>;
  blockNumber: bigint;
  transactionHash: string;
  timestamp: number;
}

export function useRegistryEvents(registryAddress: `0x${string}`) {
  const client = usePublicClient();
  const [events, setEvents] = useState<RegistryEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!client) return;

    client
      .getContractEvents({
        address: registryAddress,
        abi: trustRegistryAbi,
        fromBlock: BigInt(0),
      })
      .then(async (logs) => {
        const blockNumbers = [...new Set(logs.map((l) => l.blockNumber))];
        const blockMap = new Map<bigint, number>();
        await Promise.all(
          blockNumbers.map(async (bn) => {
            if (bn === null) return;
            const block = await client.getBlock({ blockNumber: bn });
            blockMap.set(bn, Number(block.timestamp));
          })
        );

        const parsed = logs.map((log) => ({
          eventName: (log as unknown as { eventName: string }).eventName,
          args: (log as unknown as { args: Record<string, unknown> }).args,
          blockNumber: log.blockNumber,
          transactionHash: log.transactionHash,
          timestamp: blockMap.get(log.blockNumber) || 0,
        }));
        setEvents(parsed.reverse());
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [client, registryAddress]);

  return { events, isLoading };
}
