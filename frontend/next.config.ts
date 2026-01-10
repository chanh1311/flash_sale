import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Environment variables sẽ được expose cho client
  // NEXT_PUBLIC_API_URL và NEXT_PUBLIC_SOCKET_URL
  // được đọc từ .env.local hoặc .env

  // Cho phép images từ external sources nếu cần
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
