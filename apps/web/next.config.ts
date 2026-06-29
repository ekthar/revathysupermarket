import type { NextConfig } from "next";

const production = process.env.NODE_ENV === "production";

// Samsung Internet & Android WebView PWA security requirements:
// - Must use HTTPS (enforced via upgrade-insecure-requests)
// - Must not have frame-ancestors restrictions that break install prompt
// - Service worker must be served from same origin
// - Manifest must be accessible without CORS issues
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${production ? "" : " 'unsafe-eval'"} https://maps.googleapis.com https://apis.google.com https://vercel.live https://www.google.com https://www.gstatic.com`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com https://vercel.live data:",
  "img-src 'self' data: blob: https://images.unsplash.com https://*.amazonaws.com https://*.r2.cloudflarestorage.com https://*.r2.dev https://maps.gstatic.com https://maps.googleapis.com https://tiles.openfreemap.org https://*.openfreemap.org https://lh3.googleusercontent.com https://*.googleusercontent.com https://www.gstatic.com https://vercel.com https://vercel.live",
  "connect-src 'self' https://*.upstash.io https://maps.googleapis.com https://nominatim.openstreetmap.org https://tiles.openfreemap.org https://*.openfreemap.org https://vercel.live wss://ws-us3.pusher.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://www.googleapis.com https://fcm.googleapis.com https://fcmregistrations.googleapis.com https://firebaseinstallations.googleapis.com https://android.googleapis.com",
  "frame-src 'self' https://www.google.com https://maps.google.com https://vercel.live https://accounts.google.com https://*.firebaseapp.com",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  production ? "upgrade-insecure-requests" : ""
].filter(Boolean).join("; ");

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Standard security headers
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          // COOP/COEP set to unsafe-none to allow PWA install prompts on Samsung/Android
          { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
          ...(production ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" }] : [])
        ]
      },
      {
        // CORS headers for mobile API routes only — session-based routes
        // rely on same-origin and middleware CSRF checks.
        source: "/api/mobile/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: process.env.MOBILE_CORS_ORIGIN || "https://revathysupermarket.vercel.app" },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,PUT,PATCH,DELETE,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
          { key: "Access-Control-Max-Age", value: "86400" },
          { key: "Vary", value: "Origin" }
        ]
      },
      {
        // Service worker must be served with correct scope and content type
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" }
        ]
      },
      {
        // Manifest must be accessible for PWA install
        source: "/manifest.webmanifest",
        headers: [
          { key: "Content-Type", value: "application/manifest+json" },
          { key: "Cache-Control", value: "public, max-age=3600" }
        ]
      },
      {
        source: "/.well-known/:path*",
        headers: [
          { key: "Content-Type", value: "application/json" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Cache-Control", value: "public, max-age=86400" }
        ]
      }
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "**.amazonaws.com" },
      { protocol: "https", hostname: "**.r2.cloudflarestorage.com" },
      { protocol: "https", hostname: "**.r2.dev" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "**.googleusercontent.com" }
    ]
  }
};

export default nextConfig;
