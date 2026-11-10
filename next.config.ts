import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'www.detectiveconanworld.com', pathname: '/wiki/images/**' },
    ],
  },
};

export default nextConfig;
