/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ["www.torpedo7.co.nz", "cdn.shopify.com"]
  }
}

module.exports = nextConfig