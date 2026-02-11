"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";
import { DEMO_REGISTRY } from "@/lib/contracts";
import { PunkAvatar } from "@/components/PunkAvatar";

const FEATURED_PUNKS = [BigInt(2113), BigInt(4736), BigInt(6507), BigInt(6843), BigInt(1477)];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <header className="flex items-center justify-between px-6 py-4">
        <span className="font-pixel text-sm uppercase tracking-wide text-zinc-400">
          multisig.social
        </span>
        <ConnectButton />
      </header>

      <main className="max-w-xl mx-auto px-6 pt-16 pb-20">
        {/* Hero */}
        <div className="flex gap-1.5 mb-8">
          {FEATURED_PUNKS.map((id) => (
            <PunkAvatar key={id.toString()} punkId={id} size={56} className="rounded-lg" />
          ))}
        </div>

        <h1 className="font-pixel text-3xl sm:text-4xl uppercase leading-tight">
          CryptoPunks
          <br />
          Trust
        </h1>
        <p className="text-zinc-400 text-sm mt-4 leading-relaxed">
          Prove who you are without signing from your cold wallet.
          <br />
          Community members vouch for each other on-chain.
        </p>

        <div className="flex gap-3 pt-8">
          <Link
            href={`/registry/${DEMO_REGISTRY}`}
            className="bg-white text-black px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-zinc-200 transition-colors"
          >
            View community
          </Link>
          <Link
            href="/create"
            className="text-zinc-400 px-5 py-2.5 rounded-lg font-semibold text-sm hover:text-white transition-colors"
          >
            Create one
          </Link>
        </div>

        {/* The problem */}
        <div className="pt-20">
          <SectionTitle>The problem</SectionTitle>

          <p className="text-zinc-300 text-sm leading-relaxed mb-4">
            Most NFT holders keep their assets on a cold wallet. They
            don&apos;t want to sign anything with it — not a transaction,
            not a delegation, not even a message. And they&apos;re right.
            Every signature is a risk.
          </p>
          <p className="text-zinc-300 text-sm leading-relaxed mb-6">
            This makes on-chain identity verification impossible. You
            can&apos;t check the NFT contract to know who someone is if the
            real owner won&apos;t sign from that wallet.
          </p>

          <div className="bg-zinc-900/50 rounded-xl p-5 mb-6">
            <h3 className="text-sm font-semibold mb-3">
              Today, the only way to verify someone is off-chain:
            </h3>
            <ul className="space-y-2 text-zinc-400 text-sm">
              <li className="flex gap-2">
                <span className="text-zinc-600 shrink-0">&bull;</span>
                Do you know this person?
              </li>
              <li className="flex gap-2">
                <span className="text-zinc-600 shrink-0">&bull;</span>
                Do multiple people in the community know them?
              </li>
              <li className="flex gap-2">
                <span className="text-zinc-600 shrink-0">&bull;</span>
                Have you met them at events?
              </li>
              <li className="flex gap-2">
                <span className="text-zinc-600 shrink-0">&bull;</span>
                Are they legit on Twitter / socials?
              </li>
              <li className="flex gap-2">
                <span className="text-zinc-600 shrink-0">&bull;</span>
                Is there a real human behind the address?
              </li>
            </ul>
          </div>

          <p className="text-zinc-300 text-sm leading-relaxed">
            At every community event, every airdrop, every allowlist — someone
            has to manually check if people are who they claim to be. It
            doesn&apos;t scale, and it puts all the trust in one person&apos;s
            hands.
          </p>
        </div>

        {/* How it works */}
        <div className="pt-16">
          <SectionTitle>How we solve it</SectionTitle>

          <p className="text-zinc-300 text-sm leading-relaxed mb-8">
            Instead of one gatekeeper verifying everyone, the community does
            it collectively. Members vouch for each other on-chain. If enough
            trusted people say you&apos;re legit, the smart contract accepts
            it. No cold wallet needed. No single point of failure.
          </p>

          {/* Steps */}
          <div className="space-y-3 mb-10">
            <Step n="1" text="Someone applies to join a community" />
            <Step n="2" text="Validators vouch for them — enough vouches, they're a member" />
            <Step n="3" text="Members elect validators by majority vote" />
            <Step n="4" text="Validators accept or kick members by threshold (e.g. 3 must agree)" />
          </div>

          {/* Two-layer governance */}
          <div className="space-y-4">
            <div className="bg-zinc-900/50 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <RoleBadge label="Members" color="text-white" bg="bg-zinc-700" />
                <span className="text-zinc-600 text-xs">elect &amp; kick</span>
                <Arrow />
                <RoleBadge label="Validators" color="text-blue-400" bg="bg-blue-500/15" />
              </div>
              <p className="text-zinc-400 text-sm leading-relaxed">
                All members vote to elect or kick validators. Majority wins.
                No time limit — votes accumulate until the threshold is reached.
              </p>
            </div>

            <div className="bg-zinc-900/50 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <RoleBadge label="Validators" color="text-blue-400" bg="bg-blue-500/15" />
                <span className="text-zinc-600 text-xs">accept &amp; kick</span>
                <Arrow />
                <RoleBadge label="Members" color="text-white" bg="bg-zinc-700" />
              </div>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Validators decide who joins and who gets kicked. A fixed number
                must agree — one person alone can&apos;t let someone in or push
                someone out.
              </p>
            </div>
          </div>
        </div>

        {/* Getting started */}
        <div className="pt-16">
          <SectionTitle>Starting a community</SectionTitle>

          <div className="space-y-4">
            <div className="bg-zinc-900/50 rounded-xl p-5">
              <h3 className="text-sm font-semibold mb-2">
                Pick your initial validators
              </h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Choose a few trusted people to bootstrap the group. They accept
                the first members. From there, governance takes over — members
                elect new validators, validators accept new members.
              </p>
            </div>
            <div className="bg-zinc-900/50 rounded-xl p-5">
              <h3 className="text-sm font-semibold mb-2">
                Or tie it to an NFT collection
              </h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                For NFT communities, ownership can grant automatic membership.
                Own an NFT from the collection, you&apos;re in. Members then
                elect validators through the normal voting process.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="pt-16">
          <SectionTitle>FAQ</SectionTitle>

          <div className="space-y-4">
            <QA
              q="Do I need to sign with my cold wallet?"
              a="No. That's the whole point. Your community vouches for you instead. No signature, no delegation, no risk to your cold wallet."
            />
            <QA
              q="What are validators?"
              a="Trusted members elected by the community. They decide who joins and who gets kicked — like an elected council. No one appoints them, they're voted in."
            />
            <QA
              q="Can a single person abuse their power?"
              a="No. Every action requires multiple people to agree. A malicious validator can't sneak in a bad actor. A disgruntled member can't kick someone alone."
            />
            <QA
              q="Is there an admin or backdoor?"
              a="No. The smart contract enforces the rules. Nobody can override a vote. Fully on-chain, fully permissionless."
            />
          </div>
        </div>

        {/* Footer */}
        <p className="text-zinc-600 text-sm mt-16">
          On-chain. No admin. No one can cheat.
          <a
            href="https://github.com/gwendall/multisig-social"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 text-zinc-500 hover:text-white transition-colors"
          >
            GitHub
          </a>
        </p>
      </main>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-pixel text-sm uppercase text-zinc-500 mb-6">
      {children}
    </h2>
  );
}

function Step({ n, text }: { n: string; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="font-pixel text-sm text-zinc-600 mt-0.5 w-4 shrink-0">
        {n}
      </span>
      <p className="text-zinc-300 text-sm leading-relaxed">{text}</p>
    </div>
  );
}

function Arrow() {
  return (
    <span className="text-zinc-600 text-xs shrink-0">&rarr;</span>
  );
}

function RoleBadge({
  label,
  color,
  bg,
}: {
  label: string;
  color: string;
  bg: string;
}) {
  return (
    <span
      className={`text-xs font-semibold px-3 py-1.5 rounded-lg ${color} ${bg}`}
    >
      {label}
    </span>
  );
}

function QA({ q, a }: { q: string; a: string }) {
  return (
    <div className="bg-zinc-900/50 rounded-xl p-4">
      <p className="text-sm font-semibold mb-1.5">{q}</p>
      <p className="text-zinc-500 text-sm leading-relaxed">{a}</p>
    </div>
  );
}
