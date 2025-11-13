/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.baserow.io'
      },
      {
        protocol: 'https',
        hostname: '**.baserow.local'
      },
      {
        protocol: 'https',
        hostname: '**.s3.amazonaws.com'
      }
    ]
  },
  eslint: {
    // ⚠️ Warning: Disables build from failing on ESLint errors
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
