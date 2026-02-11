"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";
import { useState } from "react";
import { useCreateRegistry } from "@/hooks/useGovernance";
import { useAccount } from "wagmi";

export default function CreatePage() {
  const { address } = useAccount();
  const { createRegistry, isPending, isConfirming, isSuccess, error, hash } =
    useCreateRegistry();

  const [name, setName] = useState("");
  const [validators, setValidators] = useState("");
  const [checker, setChecker] = useState("");
  const [memberThreshold, setMemberThreshold] = useState("3");
  const [validatorThresholdPct, setValidatorThresholdPct] = useState("67");
  const [proposalDuration, setProposalDuration] = useState("7");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validatorAddresses = validators
      .split("\n")
      .map((v) => v.trim())
      .filter(Boolean) as `0x${string}`[];

    const checkerAddress = checker.trim()
      ? (checker.trim() as `0x${string}`)
      : ("0x0000000000000000000000000000000000000000" as `0x${string}`);

    createRegistry(
      name,
      validatorAddresses,
      BigInt(memberThreshold),
      BigInt(validatorThresholdPct),
      BigInt(Number(proposalDuration) * 86400),
      checkerAddress
    );
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <header className="flex items-center justify-between px-6 py-4">
        <Link href="/" className="font-pixel text-sm uppercase tracking-wide text-zinc-400">
          multisig.social
        </Link>
        <ConnectButton />
      </header>

      <main className="max-w-md mx-auto px-6 pt-12 pb-20">
        <h1 className="font-pixel text-xl uppercase mb-2">
          Start a community
        </h1>
        <p className="text-zinc-500 text-sm mb-10">
          Pick your first trusted members and set the rules.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm text-zinc-400 mb-2">
              Community name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="CryptoPunks Trust"
              className="w-full bg-zinc-900/60 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-700"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-2">
              Verification contract
            </label>
            <input
              type="text"
              value={checker}
              onChange={(e) => setChecker(e.target.value)}
              placeholder="0x..."
              className="w-full bg-zinc-900/60 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-700 font-mono text-sm"
            />
            <p className="text-sm text-zinc-600 mt-1.5">
              Optional. To let members prove they own an NFT.
            </p>
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-2">
              First trusted members
            </label>
            <textarea
              value={validators}
              onChange={(e) => setValidators(e.target.value)}
              placeholder={"One wallet address per line\n0xabc...\n0xdef..."}
              rows={4}
              className="w-full bg-zinc-900/60 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-700 font-mono text-sm"
              required
            />
            <p className="text-sm text-zinc-600 mt-1.5">
              They can accept or remove members
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm text-zinc-500 mb-1.5">
                Vouches needed
              </label>
              <input
                type="number"
                value={memberThreshold}
                onChange={(e) => setMemberThreshold(e.target.value)}
                min="1"
                className="w-full bg-zinc-900/60 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-zinc-700"
                required
              />
              <p className="text-sm text-zinc-700 mt-1">to add a member</p>
            </div>

            <div>
              <label className="block text-sm text-zinc-500 mb-1.5">
                Trust vote %
              </label>
              <input
                type="number"
                value={validatorThresholdPct}
                onChange={(e) => setValidatorThresholdPct(e.target.value)}
                min="1"
                max="100"
                className="w-full bg-zinc-900/60 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-zinc-700"
                required
              />
              <p className="text-sm text-zinc-700 mt-1">for trust changes</p>
            </div>

            <div>
              <label className="block text-sm text-zinc-500 mb-1.5">
                Vote duration
              </label>
              <input
                type="number"
                value={proposalDuration}
                onChange={(e) => setProposalDuration(e.target.value)}
                min="1"
                className="w-full bg-zinc-900/60 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-zinc-700"
                required
              />
              <p className="text-sm text-zinc-700 mt-1">days to decide</p>
            </div>
          </div>

          <button
            type="submit"
            disabled={!address || isPending || isConfirming}
            className="w-full bg-white text-black py-3 rounded-xl font-semibold text-sm hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {!address
              ? "Connect wallet first"
              : isPending
                ? "Confirm in wallet..."
                : isConfirming
                  ? "Deploying..."
                  : "Create community"}
          </button>

          {isSuccess && hash && (
            <div className="bg-green-900/20 rounded-xl p-4 text-green-400 text-sm">
              Community created! Tx: {hash.slice(0, 10)}...{hash.slice(-8)}
            </div>
          )}

          {error && (
            <div className="bg-red-900/20 rounded-xl p-4 text-red-400 text-sm">
              {error.message.slice(0, 200)}
            </div>
          )}
        </form>
      </main>
    </div>
  );
}
