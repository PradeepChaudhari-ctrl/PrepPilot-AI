/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["pdf-parse", "@prisma/client", "prisma"],
  },
};

export default nextConfig;
