/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Aggressive tree-shaking for large Web3 packages
  experimental: {
    optimizePackageImports: ["@rainbow-me/rainbowkit", "wagmi", "viem"],
  },

  webpack: (config) => {
    config.resolve.alias["@react-native-async-storage/async-storage"] = false;
    return config;
  },

  // Cache immutable static assets for 1 year
  async headers() {
    return [
      {
        source: "/_next/static/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
