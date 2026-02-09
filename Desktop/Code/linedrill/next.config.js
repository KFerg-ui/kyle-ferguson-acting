/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Handle pdfjs-dist worker
    config.resolve.alias.canvas = false;
    return config;
  },
};

module.exports = nextConfig;
