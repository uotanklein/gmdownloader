import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.steamusercontent.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
