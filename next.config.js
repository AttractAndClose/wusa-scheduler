/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Ensure CSS is properly handled
  webpack: (config, { isServer }) => {
    // Ensure CSS files are properly processed
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        minimize: false, // Disable minification in dev to help debug CSS issues
      };
    }
    return config;
  },
}

module.exports = nextConfig

