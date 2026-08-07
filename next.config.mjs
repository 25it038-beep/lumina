/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: { unoptimized: true },

  // Clerk's server SDK uses Node.js-only APIs (crypto, fs, etc.).
  // Marking it as a server external prevents webpack from bundling it
  // into the Edge Runtime when analyzing the middleware bundle.
  serverExternalPackages: ["@clerk/nextjs", "@clerk/backend", "@clerk/shared"],

  webpack: (config, { isServer }) => {
    // Prevent canvas from being bundled (used by fabric.js on client)
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
    };

    // Prevent Node-only modules from being bundled on the client side
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }

    return config;
  },
};

export default nextConfig;
