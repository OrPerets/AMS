/** @type {import('next').NextConfig} */
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';

const nextConfig = {
  reactStrictMode: true,
  swcMinify: false,
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
