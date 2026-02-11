import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "punks.art",
        pathname: "/api/punks/**",
      },
    ],
  },
};

export default nextConfig;
