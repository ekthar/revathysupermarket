import type { NextConfig } from "next";

const production = process.env.NODE_ENV === "production";
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${production ? "" : " 'unsafe-eval'"} https://maps.googleapis.com https://vercel.live`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https://images.unsplash.com https://*.amazonaws.com https://*.r2.cloudflarestorage.com https://*.r2.dev https://maps.gstatic.com https://maps.googleapis.com",
  "connect-src 'self' https://*.upstash.io https://maps.googleapis.com https://nominatim.openstreetmap.org https://vercel.live wss://ws-us3.pusher.com",
  "frame-src 'self' https://www.google.com https://maps.google.com https://vercel.live",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  production ? "upgrade-insecure-requests" : ""
].filter(Boolean).join("; ");

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true
  },
  async rewrites() {
    return {
      fallback: [
        { source: "/app/:path*", destination: "/app/index.html" }
      ]
    };
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
          ...(production ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }] : [])
        ]
      }
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "**.amazonaws.com" },
      { protocol: "https", hostname: "**.r2.cloudflarestorage.com" },
      { protocol: "https", hostname: "**.r2.dev" }
    ]
  }
};

export default nextConfig;
