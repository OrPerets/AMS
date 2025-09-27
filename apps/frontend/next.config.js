/** @type {import('next').NextConfig} */
// Updated for new backend URL: ams-backend-production-9b9d.up.railway.app
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';

const nextConfig = {
  reactStrictMode: true,
  swcMinify: false,
  output: 'standalone',
  compiler: {
    // Disable SWC and use Babel for JSX transformation
    styledComponents: true,
  },
  env: {
    NEXT_PUBLIC_API_BASE: API_BASE,
  },
  async rewrites() {
    return [
      { source: '/api/v1/:path*', destination: `${API_BASE}/api/v1/:path*` },
      { source: '/auth/:path*', destination: `${API_BASE}/auth/:path*` },
      { source: '/admin/:path*', destination: `${API_BASE}/admin/:path*` },
    ];
  },
}
module.exports = nextConfig
