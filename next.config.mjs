import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/**
 * Baseline security headers.
 *
 * The site renders staff-authored HTML through `dangerouslySetInnerHTML`, so a
 * CSP is the second line of defence behind the HTML allow-list. `unsafe-inline` on
 * styles is unavoidable while Tailwind and satori emit inline style
 * attributes; scripts get `unsafe-inline` only because Next's bootstrap
 * scripts are inline and nonce support needs per-request rendering.
 *
 * The Supabase origin is read from the environment rather than hard-coded:
 * the browser client uploads images and the storage bucket serves them, and a
 * local stack runs on http://127.0.0.1:54321, not on *.supabase.co.
 */
const isDev = process.env.NODE_ENV !== "production";

const supabaseUrl = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");
  } catch {
    return null;
  }
})();

const supabaseOrigin = supabaseUrl?.origin ?? "https://*.supabase.co";

/**
 * Hosts `next/image` may fetch cover images from.
 *
 * Derived from the configured project rather than hard-coded: a hosted project
 * is `https://<ref>.supabase.co`, but a local stack is `http://127.0.0.1:54321`
 * and a self-hosted one is any domain at all. Listing only `*.supabase.co`
 * made the optimizer answer `"url" parameter is not allowed` and every cover
 * image on the site rendered broken.
 */
const imageRemotePatterns = supabaseUrl
  ? [
      {
        protocol: supabaseUrl.protocol.replace(":", ""),
        hostname: supabaseUrl.hostname,
        port: supabaseUrl.port || undefined,
        pathname: "/storage/v1/object/public/**",
      },
    ]
  : [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ];

const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${supabaseOrigin}`,
  `media-src 'self' blob: ${supabaseOrigin}`,
  "font-src 'self' data:",
  // Dev needs the websocket Next uses for hot reload.
  `connect-src 'self' ${supabaseOrigin} ${supabaseOrigin.replace(/^http/, "ws")}${isDev ? " ws: http://127.0.0.1:* http://localhost:*" : ""}`,
  "frame-src 'self' https://docs.google.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: CSP },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  ...(isDev
    ? []
    : [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ]),
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: SECURITY_HEADERS },
      // The staff area is never embedded and never indexed.
      {
        source: "/admin/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    // Static assets are fingerprinted, so they can be cached for a year.
    minimumCacheTTL: 31536000,
    remotePatterns: imageRemotePatterns,
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
    // The OG image routes read TTFs from src/assets/fonts with fs. Next's file
    // tracing does not follow a runtime-computed path, so they are declared
    // explicitly — without this they exist in dev and 404 on Vercel.
    outputFileTracingIncludes: {
      "/**/opengraph-image": ["./src/assets/fonts/**"],
    },
  },
};

export default withNextIntl(nextConfig);
