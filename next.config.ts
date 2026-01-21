import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@whiskeysockets/baileys"],
  turbopack: {
    resolveAlias: {
      jimp: "./src/lib/empty-module.ts",
    },
  },
};

export default nextConfig;
