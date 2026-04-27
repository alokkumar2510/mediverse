/** @type {import('next').NextConfig} */

const isProd = process.env.NODE_ENV === "production";
const isCFPages = process.env.CF_PAGES === "1";

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  // ── Output mode ─────────────────────────────────────────────────────────────
  // Cloudflare Pages with Next.js: use 'standalone' — CF Pages adapter handles
  // the edge runtime. Do NOT use 'export' (breaks SSR/middleware).
  // output: 'standalone',  // Uncomment for Docker/Azure deployment instead

  // ── Image optimization ──────────────────────────────────────────────────────
  images: {
    unoptimized: isCFPages,  // CF Pages doesn't support Next Image optimization
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "mediverse.alokkumarsahu.in" },
    ],
  },

  // ── API proxy (dev only — prod calls API directly) ──────────────────────────
  async rewrites() {
    if (isProd) return [];
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/:path*`,
      },
    ];
  },

  // ── Security headers ────────────────────────────────────────────────────────
  async headers() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "https://api.mediverse.alokkumarsahu.in";
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              `connect-src 'self' ${apiUrl} https://generativelanguage.googleapis.com https://*.supabase.co`,
              "img-src 'self' data: blob: https://res.cloudinary.com https://*.googleusercontent.com https://avatars.githubusercontent.com",
              "media-src 'self' blob:",
              "worker-src 'self' blob:",
            ].join("; "),
          },
          ...(isProd ? [
            { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          ] : []),
        ],
      },
    ];
  },

  // ── Webpack config ──────────────────────────────────────────────────────────
  webpack(config) {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
    };
    return config;
  },

  // ── Experimental ────────────────────────────────────────────────────────────
  experimental: {
    instrumentationHook: true,
  },
};

export default nextConfig;