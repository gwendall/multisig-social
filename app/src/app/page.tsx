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
        <p className="text-zinc-400 text-sm mt-4">
          Members vouch for each other. Enough vouches, you&apos;re in.
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

        {/* How it works */}
        <div className="pt-20">
          <h2 className="font-pixel text-sm uppercase text-zinc-500 mb-6">
            How it works
          </h2>

          {/* Two layers */}
          <div className="space-y-4 mb-10">
            <div className="bg-zinc-900/50 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <RoleBadge
                  label="Members"
                  color="text-white"
                  bg="bg-zinc-700"
                />
                <span className="text-zinc-600 text-xs">elect &amp; kick</span>
                <Arrow />
                <RoleBadge
                  label="Validators"
                  color="text-blue-400"
                  bg="bg-blue-500/15"
                />
              </div>
              <p className="text-zinc-400 text-sm leading-relaxed">
                All members vote to elect or kick validators. It&apos;s a majority
                vote — no time limit, votes accumulate until the threshold is
                reached.
              </p>
            </div>

            <div className="bg-zinc-900/50 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <RoleBadge
                  label="Validators"
                  color="text-blue-400"
                  bg="bg-blue-500/15"
                />
                <span className="text-zinc-600 text-xs">accept &amp; kick</span>
                <Arrow />
                <RoleBadge
                  label="Members"
                  color="text-white"
                  bg="bg-zinc-700"
                />
              </div>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Validators decide who joins and who gets kicked. A fixed number
                of validators (e.g. 3) must agree — one person alone can&apos;t let
                someone in or push someone out.
              </p>
            </div>
          </div>

          {/* Why multisig */}
          <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-5 mb-10">
            <h3 className="text-sm font-semibold mb-2">
              Why multisig?
            </h3>
            <p className="text-zinc-500 text-sm leading-relaxed">
              No single person has the power to add or remove anyone. Every
              action requires multiple people to agree. A malicious validator
              can&apos;t sneak in a bad actor. A disgruntled member can&apos;t kick
              someone alone. The community governs itself.
            </p>
          </div>

          {/* FAQ */}
          <h2 className="font-pixel text-sm uppercase text-zinc-500 mb-4">
            FAQ
          </h2>
          <div className="space-y-4">
            <QA
              q="How do I join?"
              a="Apply to a community. Validators review your application and vouch for you. Once enough validators agree, you're in."
            />
            <QA
              q="What are validators?"
              a="Validators are trusted members elected by the community. They decide who joins and who gets kicked. Think of them as the community's elected council."
            />
            <QA
              q="How are validators elected?"
              a="Any member can start a vote to elect someone as validator. All members can vote. When a majority of members have voted yes, the member becomes a validator."
            />
            <QA
              q="Can a single person abuse their power?"
              a="No. Every action is multisig — adding a member needs multiple validators to agree, and electing or kicking a validator needs a majority of all members."
            />
            <QA
              q="Is there an admin?"
              a="No. The smart contract enforces the rules. Nobody has a backdoor, nobody can override a vote. It's fully on-chain and permissionless."
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-12">
          <Card title="Link your Punk" desc="Prove you own it. Cold wallet signs once, done." />
          <Card title="Vouch for people" desc="You know them, you vouch. Simple as that." />
          <Card title="Kick bad actors" desc="Multiple validators vote. Majority wins, they're out." />
          <Card title="No admin keys" desc="Smart contract runs it. Nobody has a backdoor." />
        </div>

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

function Card({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="bg-zinc-900/50 rounded-xl p-4 space-y-1">
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="text-zinc-500 text-sm">{desc}</p>
    </div>
  );
}

