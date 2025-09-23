/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.ignoreWarnings = [
      { module: /@supabase\/realtime-js/ },
    ]
    return config
  },
}

module.exports = nextConfig
