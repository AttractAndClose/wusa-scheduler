/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Fix CSS hot reload issues in development
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Improve HMR for CSS files
      config.watchOptions = {
        ...config.watchOptions,
        ignored: /node_modules/,
        poll: 1000, // Check for changes every second (helps with CSS HMR)
      };
    }
    return config;
  },
}

module.exports = nextConfig

