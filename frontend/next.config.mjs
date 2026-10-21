/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:5000/api/:path*',
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/documents',
        destination: '/schemes',
        permanent: false,
      },
      {
        source: '/documents/:path*',
        destination: '/schemes',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
