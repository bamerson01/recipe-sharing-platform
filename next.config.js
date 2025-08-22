/** @type {import('next').NextConfig} */
const nextConfig = {
  // Explicitly set the project root to silence the lockfile warning
  outputFileTracingRoot: __dirname,

  // Other Next.js configurations can go here
  experimental: {
    // Enable any experimental features you want
    serverActions: {
      bodySizeLimit: '10mb', // Increase limit for recipe creation with images
    },
  },

  // Image optimization settings
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co', pathname: '/storage/v1/object/public/**' },
    ],
  },
}

module.exports = nextConfig
