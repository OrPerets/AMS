/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: false,
  compiler: {
    // Disable SWC and use Babel for JSX transformation
    styledComponents: true,
  },
  async rewrites() {
    return [
      { source: '/api/v1/:path*', destination: 'http://localhost:3001/api/v1/:path*' },
      { source: '/auth/:path*', destination: 'http://localhost:3001/auth/:path*' },
      { source: '/admin/:path*', destination: 'http://localhost:3001/admin/:path*' },
    ];
  },
}
module.exports = nextConfig
