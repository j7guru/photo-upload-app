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
  }
};

export default nextConfig;
