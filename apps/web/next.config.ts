import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@whiskeysockets/baileys", "sharp", "jimp"],
  turbopack: {},
  cacheComponents: true,
  devIndicators: false,
};

export default nextConfig;
