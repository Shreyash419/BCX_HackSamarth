import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["@prisma/client", "prisma"],
  // Future: Add image domains for project imagery
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
