import type { NextConfig } from "next";
// const withBundleAnalyzer = require('@next/bundle-analyzer')({ enabled: process.env.ANALYZE === 'true', })

const nextConfig: NextConfig = {
  reactCompiler: true,
  reactStrictMode: true,
  compiler: { removeConsole: process.env.NODE_ENV === "production" },
  // compiler: { removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error"] } : false, },
  images: {
    minimumCacheTTL: 2678400,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      }
    ],
  },
};

export default nextConfig
// export default withBundleAnalyzer(nextConfig)
// module.exports = withBundleAnalyzer(nextConfig)