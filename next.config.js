/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ["www.torpedo7.co.nz"]
  }
}

module.exports = nextConfig
