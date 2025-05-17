/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export', // Commented out to enable API routes
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  swcMinify: false, // Disable SWC minification to use Babel instead
  
  // Add API rewrites to proxy requests to the backend
  async rewrites() {
    return [
      {
        source: '/api/face/:path*',
        destination: 'http://localhost:8000/api/face/:path*',
      },
    ];
  },
};

module.exports = nextConfig;