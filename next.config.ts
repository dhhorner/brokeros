import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.12.212"],
  experimental: {
    // Required for server actions used in auth forms
    serverActions: {
      allowedOrigins: ["localhost:4000", "192.168.12.212:4000"],
    },
  },
  // Workers run in a separate process — exclude from Next.js bundle
  serverExternalPackages: ["bullmq", "ioredis"],
};

export default nextConfig;
