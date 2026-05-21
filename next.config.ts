import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Required for server actions used in auth forms
    serverActions: {
      allowedOrigins: ["localhost:3000"],
    },
  },
  // Workers run in a separate process — exclude from Next.js bundle
  serverExternalPackages: ["bullmq", "ioredis"],
};

export default nextConfig;
