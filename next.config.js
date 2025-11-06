/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Disable static optimization for pages that require Clerk
  experimental: {
    dynamicIO: true,
  },
}

module.exports = nextConfig

