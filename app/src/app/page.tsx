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

        <div className="pt-20 space-y-3">
          <Step n="1" text="Someone vouches for you" />
          <Step n="2" text="Others confirm" />
          <Step n="3" text="You're in" />
        </div>

        <div className="grid grid-cols-2 gap-3 pt-16">
          <Card title="Link your Punk" desc="Prove you own it. Cold wallet signs once, done." />
          <Card title="Vouch for people" desc="You know them, you vouch. Simple as that." />
          <Card title="Kick bad actors" desc="Community votes. Majority wins, they're out." />
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

function Card({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="bg-zinc-900/50 rounded-xl p-4 space-y-1">
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="text-zinc-500 text-sm">{desc}</p>
    </div>
  );
}

