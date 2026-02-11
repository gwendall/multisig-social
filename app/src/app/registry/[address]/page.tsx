"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useEnsName,
} from "wagmi";
import { mainnet } from "wagmi/chains";
import {
  useRegistryInfo,
  useMembers,
  useValidators,
  useIsValidator,
} from "@/hooks/useRegistry";
import { usePropose, useVouchFor } from "@/hooks/useVouch";
import { useActiveProposals } from "@/hooks/useActiveProposals";
import { useRegistryEvents } from "@/hooks/useRegistryEvents";
import { trustRegistryAbi } from "@/lib/abi";
import { PROPOSAL_TYPES, PROPOSAL_TYPE_VERBS } from "@/lib/contracts";
import { DEMO_NAMES, DEMO_PUNKS } from "@/lib/demo-names";
import { PunkAvatar } from "@/components/PunkAvatar";

// ---------------------------------------------------------------------------
// Utils
// ---------------------------------------------------------------------------

function shortenAddress(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function getDisplayName(addr: string) {
  return DEMO_NAMES[addr] || shortenAddress(addr);
}

function timeAgo(timestamp: number): string {
  if (!timestamp) return "";
  const now = Math.floor(Date.now() / 1000);
  const diff = now - timestamp;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(timestamp * 1000).toLocaleDateString();
}

// ---------------------------------------------------------------------------
// Shared components
// ---------------------------------------------------------------------------

function AddressDisplay({ address }: { address: `0x${string}` }) {
  const demoName = DEMO_NAMES[address];
  const { data: ensName } = useEnsName({
    address,
    chainId: mainnet.id,
    query: { enabled: !demoName },
  });
  const name = demoName || ensName;
  return (
    <div className="min-w-0">
      <p className="text-sm font-semibold truncate">
        {name || shortenAddress(address)}
      </p>
      {name && (
        <p className="font-mono text-xs text-zinc-600 truncate">
          {shortenAddress(address)}
        </p>
      )}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-8">
      <h2 className="font-pixel text-sm uppercase text-zinc-500 mb-3">
        {title}
      </h2>
      <div>{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function RegistryPage() {
  const params = useParams();
  const registryAddress = params.address as `0x${string}`;
  const { address: userAddress } = useAccount();

  // Read state
  const info = useRegistryInfo(registryAddress);
  const { data: memberList } = useMembers(registryAddress);
  const { data: validatorList } = useValidators(registryAddress);
  const { data: isUserValidator } = useIsValidator(
    registryAddress,
    userAddress
  );
  const { data: userIsMember } = useReadContract({
    address: registryAddress,
    abi: trustRegistryAbi,
    functionName: "isMember",
    args: userAddress ? [userAddress] : undefined,
    query: { enabled: !!userAddress },
  });
  const { data: userHasApplied } = useReadContract({
    address: registryAddress,
    abi: trustRegistryAbi,
    functionName: "hasApplied",
    args: userAddress ? [userAddress] : undefined,
    query: { enabled: !!userAddress },
  });
  const { data: applicantList } = useReadContract({
    address: registryAddress,
    abi: trustRegistryAbi,
    functionName: "getApplicants",
  });

  const activeProposals = useActiveProposals(registryAddress);
  const { events } = useRegistryEvents(registryAddress);

  // Write actions
  const { propose, isPending: isProposing } = usePropose(registryAddress);
  const { vouch, isPending: isVouching } = useVouchFor(registryAddress);
  const {
    writeContract: applyWrite,
    data: applyHash,
    isPending: isApplying,
  } = useWriteContract();
  const { isLoading: applyConfirming } = useWaitForTransactionReceipt({
    hash: applyHash,
  });

  const [addAddress, setAddAddress] = useState("");

  const handleApply = () => {
    applyWrite({
      address: registryAddress,
      abi: trustRegistryAbi,
      functionName: "applyToJoin",
    });
  };

  const validatorSet = new Set(validatorList || []);
  const applicantArr = applicantList || [];
  const members = memberList || [];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <header className="flex items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="font-pixel text-sm uppercase tracking-wide text-zinc-400"
        >
          multisig.social
        </Link>
        <ConnectButton />
      </header>

      <main className="max-w-lg mx-auto px-4 pt-6 pb-16">
        {/* Community header */}
        <div className="text-center mb-8">
          <h1 className="font-pixel text-2xl uppercase">
            {info.name || "..."}
          </h1>
          <p className="text-zinc-500 text-sm mt-2">
            {info.memberCount?.toString() || "0"} members
            <span className="mx-2 text-zinc-700">/</span>
            {info.validatorCount?.toString() || "0"} trusted
          </p>
        </div>

        {/* Join */}
        {userAddress && !userIsMember && !userHasApplied && (
          <button
            onClick={handleApply}
            disabled={isApplying || applyConfirming}
            className="w-full mb-8 bg-white text-black py-3 rounded-xl font-semibold text-sm hover:bg-zinc-200 transition-colors disabled:opacity-50"
          >
            {isApplying
              ? "Confirm in wallet..."
              : applyConfirming
                ? "Joining..."
                : "Ask to join"}
          </button>
        )}
        {userHasApplied && !userIsMember && (
          <div className="w-full mb-8 bg-zinc-900/60 text-zinc-400 py-3 rounded-xl text-center text-sm">
            Waiting for vouches
          </div>
        )}

        {/* Pending */}
        {applicantArr.length > 0 && (
          <Section title="Pending">
            {applicantArr.map((addr) => (
              <ApplicantRow
                key={addr}
                address={addr}
                registryAddress={registryAddress}
                isUserValidator={!!isUserValidator}
                onAccept={() => propose(PROPOSAL_TYPES.ADD_MEMBER, addr)}
                isProposing={isProposing}
              />
            ))}
          </Section>
        )}

        {/* Votes */}
        {activeProposals.length > 0 && (
          <Section title="Votes">
            {activeProposals.map((p) => (
              <ProposalRow
                key={p.id.toString()}
                proposal={p}
                registryAddress={registryAddress}
                isUserValidator={!!isUserValidator}
                userAddress={userAddress}
                onVouch={() => vouch(p.id)}
                isVouching={isVouching}
              />
            ))}
          </Section>
        )}

        {/* Add member (validators only) */}
        {isUserValidator && (
          <div className="flex gap-2 mb-6">
            <input
              type="text"
              value={addAddress}
              onChange={(e) => setAddAddress(e.target.value)}
              placeholder="Add by address..."
              className="flex-1 bg-zinc-900/60 rounded-xl px-4 py-2.5 text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-700 font-mono"
            />
            <button
              onClick={() => {
                propose(
                  PROPOSAL_TYPES.ADD_MEMBER,
                  addAddress as `0x${string}`
                );
                setAddAddress("");
              }}
              disabled={isProposing || !addAddress}
              className="bg-white text-black px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-zinc-200 disabled:opacity-50"
            >
              Add
            </button>
          </div>
        )}

        {/* Members */}
        <Section title="Members">
          <div className="space-y-1">
            {members.map((addr) => (
              <MemberRow
                key={addr}
                address={addr}
                registryAddress={registryAddress}
                isValidator={validatorSet.has(addr)}
                isUserValidator={!!isUserValidator}
                onRemove={() => propose(PROPOSAL_TYPES.REMOVE_MEMBER, addr)}
                onPromote={() => propose(PROPOSAL_TYPES.ADD_VALIDATOR, addr)}
                onDemote={() => propose(PROPOSAL_TYPES.REMOVE_VALIDATOR, addr)}
                isProposing={isProposing}
              />
            ))}
            {members.length === 0 && (
              <p className="text-center text-zinc-600 py-12 text-sm">
                No members yet
              </p>
            )}
          </div>
        </Section>

        {/* Activity */}
        {events.length > 0 && (
          <Section title="Activity">
            <div className="space-y-2">
              {events.slice(0, 30).map((ev, i) => {
                const desc = describeEvent(ev);
                if (!desc) return null;
                return (
                  <div
                    key={i}
                    className="flex items-baseline justify-between gap-3"
                  >
                    <p className={`text-sm ${desc.color}`}>{desc.text}</p>
                    <span className="text-xs text-zinc-700 shrink-0">
                      {timeAgo(ev.timestamp)}
                    </span>
                  </div>
                );
              })}
            </div>
          </Section>
        )}
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Event descriptions
// ---------------------------------------------------------------------------

function describeEvent(
  ev: { eventName: string; args: Record<string, unknown>; timestamp?: number }
): { text: string; color: string } | null {
  const n = (addr: unknown) => getDisplayName(String(addr));

  switch (ev.eventName) {
    case "MemberAdded":
      return { text: `${n(ev.args.member)} joined`, color: "text-green-400/70" };
    case "MemberRemoved":
      return { text: `${n(ev.args.member)} removed`, color: "text-red-400/70" };
    case "ValidatorAdded":
      return { text: `${n(ev.args.validator)} became trusted`, color: "text-blue-400/70" };
    case "ValidatorRemoved":
      return { text: `${n(ev.args.validator)} lost trust`, color: "text-red-400/70" };
    case "Applied":
      return { text: `${n(ev.args.applicant)} applied`, color: "text-zinc-400" };
    case "AssetLinked":
      return {
        text: `${n(ev.args.member)} linked Punk #${ev.args.tokenId}`,
        color: "text-zinc-500",
      };
    case "ProposalExecuted":
      return { text: `Vote #${ev.args.proposalId} passed`, color: "text-green-400/70" };
    case "Vouched":
      return {
        text: `${n(ev.args.validator)} vouched on #${ev.args.proposalId}`,
        color: "text-zinc-600",
      };
    case "ProposalCreated":
      return {
        text: `${n(ev.args.proposer)} started vote on ${n(ev.args.target)}`,
        color: "text-zinc-500",
      };
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Row components
// ---------------------------------------------------------------------------

function ApplicantRow({
  address,
  registryAddress,
  isUserValidator,
  onAccept,
  isProposing,
}: {
  address: `0x${string}`;
  registryAddress: `0x${string}`;
  isUserValidator: boolean;
  onAccept: () => void;
  isProposing: boolean;
}) {
  const { data: assetLink } = useReadContract({
    address: registryAddress,
    abi: trustRegistryAbi,
    functionName: "getAssetLink",
    args: [address],
  });
  const punkId = assetLink?.linked
    ? assetLink.tokenId
    : DEMO_PUNKS[address] !== undefined
      ? BigInt(DEMO_PUNKS[address])
      : undefined;

  return (
    <div className="flex items-center justify-between py-3 px-3 rounded-xl hover:bg-white/5 transition-colors">
      <div className="flex items-center gap-3">
        <PunkAvatar punkId={punkId} size={44} className="rounded-lg" />
        <AddressDisplay address={address} />
      </div>
      {isUserValidator && (
        <button
          onClick={onAccept}
          disabled={isProposing}
          className="text-sm bg-green-500/15 text-green-400 px-3 py-1.5 rounded-lg font-medium hover:bg-green-500/25 transition-colors disabled:opacity-50"
        >
          Vouch
        </button>
      )}
    </div>
  );
}

function ProposalRow({
  proposal,
  registryAddress,
  isUserValidator,
  userAddress,
  onVouch,
  isVouching,
}: {
  proposal: {
    id: bigint;
    proposalType: number;
    target: `0x${string}`;
    proposer: `0x${string}`;
    vouchCount: bigint;
    requiredVouches: bigint;
  };
  registryAddress: `0x${string}`;
  isUserValidator: boolean;
  userAddress: `0x${string}` | undefined;
  onVouch: () => void;
  isVouching: boolean;
}) {
  const { data: hasVouched } = useReadContract({
    address: registryAddress,
    abi: trustRegistryAbi,
    functionName: "hasVouched",
    args: userAddress ? [proposal.id, userAddress] : undefined,
    query: { enabled: !!userAddress },
  });
  const { data: assetLink } = useReadContract({
    address: registryAddress,
    abi: trustRegistryAbi,
    functionName: "getAssetLink",
    args: [proposal.target],
  });

  const punkId = assetLink?.linked
    ? assetLink.tokenId
    : DEMO_PUNKS[proposal.target] !== undefined
      ? BigInt(DEMO_PUNKS[proposal.target])
      : undefined;
  const current = Number(proposal.vouchCount);
  const required = Number(proposal.requiredVouches);
  const pct = required > 0 ? Math.round((current / required) * 100) : 0;
  const verb = PROPOSAL_TYPE_VERBS[proposal.proposalType] || "vote";
  const isRemoval =
    proposal.proposalType === 1 || proposal.proposalType === 3;
  const canVouch = isUserValidator && !hasVouched;

  return (
    <div className="bg-zinc-900/40 rounded-xl p-4 mb-3">
      <div className="flex items-center gap-3 mb-3">
        <PunkAvatar punkId={punkId} size={40} className="rounded-lg" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <AddressDisplay address={proposal.target} />
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                isRemoval
                  ? "bg-red-500/15 text-red-400"
                  : "bg-zinc-800 text-zinc-400"
              }`}
            >
              {verb}
            </span>
          </div>
        </div>
        {canVouch && (
          <button
            onClick={onVouch}
            disabled={isVouching}
            className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
              isRemoval
                ? "bg-red-500/15 text-red-400 hover:bg-red-500/25"
                : "bg-green-500/15 text-green-400 hover:bg-green-500/25"
            }`}
          >
            Vouch
          </button>
        )}
        {hasVouched && (
          <span className="text-sm text-zinc-600">Vouched</span>
        )}
      </div>

      {/* Progress */}
      <div className="flex items-center gap-3">
        <div className="flex-1 bg-zinc-800 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              isRemoval ? "bg-red-500/70" : "bg-green-500/70"
            }`}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
        <span className="text-sm text-zinc-500 shrink-0">
          {current}/{required}
        </span>
      </div>
    </div>
  );
}

function MemberRow({
  address,
  registryAddress,
  isValidator,
  isUserValidator,
  onRemove,
  onPromote,
  onDemote,
  isProposing,
}: {
  address: `0x${string}`;
  registryAddress: `0x${string}`;
  isValidator: boolean;
  isUserValidator: boolean;
  onRemove: () => void;
  onPromote: () => void;
  onDemote: () => void;
  isProposing: boolean;
}) {
  const { data: isVerified } = useReadContract({
    address: registryAddress,
    abi: trustRegistryAbi,
    functionName: "isVerifiedOwner",
    args: [address],
  });
  const { data: assetLink } = useReadContract({
    address: registryAddress,
    abi: trustRegistryAbi,
    functionName: "getAssetLink",
    args: [address],
  });

  const demoName = DEMO_NAMES[address];
  const { data: ensName } = useEnsName({
    address,
    chainId: mainnet.id,
    query: { enabled: !demoName },
  });
  const displayName = demoName || ensName;

  const punkId = assetLink?.linked
    ? assetLink.tokenId
    : DEMO_PUNKS[address] !== undefined
      ? BigInt(DEMO_PUNKS[address])
      : undefined;

  const linkedPunkId = assetLink?.linked ? assetLink.tokenId : undefined;

  return (
    <div className="flex items-center gap-3 py-3 px-3 rounded-xl hover:bg-white/5 transition-colors group">
      <PunkAvatar punkId={punkId} size={48} className="rounded-lg" />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold truncate">
            {displayName || shortenAddress(address)}
          </span>
          {linkedPunkId !== undefined && (
            <span className="text-xs text-zinc-600">
              #{linkedPunkId.toString()}
              {!isVerified && " ?"}
            </span>
          )}
          {isValidator && (
            <span className="text-xs bg-blue-500/15 text-blue-400 px-2 py-0.5 rounded-full">
              trusted
            </span>
          )}
        </div>
        {displayName && (
          <p className="font-mono text-xs text-zinc-600 truncate">
            {shortenAddress(address)}
          </p>
        )}
      </div>

      {/* Actions — always visible for validators */}
      {isUserValidator && (
        <div className="flex gap-1.5 shrink-0">
          {!isValidator && (
            <button
              onClick={onPromote}
              disabled={isProposing}
              className="text-xs bg-blue-500/10 text-blue-400/80 px-2.5 py-1.5 rounded-lg hover:bg-blue-500/20 transition-colors disabled:opacity-50"
            >
              Trust
            </button>
          )}
          {isValidator && (
            <button
              onClick={onDemote}
              disabled={isProposing}
              className="text-xs bg-zinc-800 text-zinc-500 px-2.5 py-1.5 rounded-lg hover:bg-zinc-700 transition-colors disabled:opacity-50"
            >
              Untrust
            </button>
          )}
          {!isValidator && (
            <button
              onClick={onRemove}
              disabled={isProposing}
              className="text-xs bg-red-500/10 text-red-400/60 px-2.5 py-1.5 rounded-lg hover:bg-red-500/20 transition-colors disabled:opacity-50"
            >
              Remove
            </button>
          )}
        </div>
      )}
    </div>
  );
}
