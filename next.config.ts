import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@whiskeysockets/baileys", "sharp", "jimp"],
  turbopack: {},
};

export default nextConfig;
