import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "mammoth",
    "@langchain/core",
    "@langchain/anthropic",
  ],
  poweredByHeader: false,
};

export default nextConfig;
