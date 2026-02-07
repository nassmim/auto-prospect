import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@whiskeysockets/baileys", "sharp", "jimp"],
  turbopack: {},
  cacheComponents: false,
  devIndicators: false,
};

export default nextConfig;
