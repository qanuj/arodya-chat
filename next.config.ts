import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow the webhook route to receive raw request bodies
  // (Next.js 15 parses JSON by default; Zernio verification needs the raw body)
  experimental: {},
};

export default nextConfig;
