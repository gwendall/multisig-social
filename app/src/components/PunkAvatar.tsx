"use client";

import Image from "next/image";
import { useState } from "react";

interface PunkAvatarProps {
  punkId?: bigint;
  size?: number;
  className?: string;
}

function getPunkImageUrl(punkId: bigint) {
  return `https://punks.art/api/punks/${punkId}?format=png&size=24&background=v2`;
}

export function PunkAvatar({ punkId, size = 48, className = "" }: PunkAvatarProps) {
  const [hasError, setHasError] = useState(false);

  if (punkId === undefined || hasError) {
    return (
      <span
        className={`block bg-zinc-800 ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      className={`relative overflow-hidden block bg-zinc-800 ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src={getPunkImageUrl(punkId)}
        alt={`Punk #${punkId}`}
        fill
        className="object-cover"
        style={{ imageRendering: "pixelated" }}
        unoptimized
        onError={() => setHasError(true)}
      />
    </span>
  );
}
