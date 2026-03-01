import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
};

export default withSentryConfig(nextConfig, {
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,

    // Source map yüklemeyi sadece CI/prod'da yap
    silent: !process.env.CI,

    widenClientFileUpload: true,

    // Tunnel — ad blocker'ların Sentry'yi engellemesini önler
    tunnelRoute: "/monitoring",

    automaticVercelMonitors: false,
});
