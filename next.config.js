/** @type {import('next').NextConfig} */
const nextConfig = {
  // Explicitly set the project root to silence the lockfile warning
  outputFileTracingRoot: __dirname,

  // Other Next.js configurations can go here
  experimental: {
    // Enable any experimental features you want
  },

  // Image optimization settings
  images: {
    domains: ['localhost'],
    // Add your Supabase domain when you deploy
    // domains: ['localhost', 'your-project.supabase.co'],
  },
}

module.exports = nextConfig
