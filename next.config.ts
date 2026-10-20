import type { NextConfig } from "next";

const enDev = process.env.NODE_ENV === "development";

/**
 * Politique de sécurité du contenu.
 * Stripe (paiement) est la seule origine externe autorisée côté navigateur :
 * le géocodage d'adresse passe par notre propre route /api/adresse.
 * 'unsafe-inline' reste nécessaire pour les scripts de Next sans nonce
 * (un nonce interdirait le pré-rendu partiel des pages).
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https://js.stripe.com https://*.js.stripe.com https://maps.googleapis.com${enDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.stripe.com",
  "font-src 'self'",
  `connect-src 'self' https://api.stripe.com https://maps.googleapis.com https://*.stripe.com${enDev ? " ws: wss:" : ""}`,
  "frame-src https://js.stripe.com https://*.js.stripe.com https://hooks.stripe.com",
  "worker-src 'self' blob:",
  "media-src 'self' data:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(enDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const entetesSecurite = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  {
    key: "Permissions-Policy",
    value: 'camera=(), microphone=(), geolocation=(self), payment=(self "https://js.stripe.com")',
  },
  ...(enDev
    ? []
    : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]),
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  output: "standalone",
  poweredByHeader: false,
  serverExternalPackages: ["@electric-sql/pglite", "pg"],
  images: {
    formats: ["image/avif", "image/webp"],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      { source: "/:chemin*", headers: entetesSecurite },
      {
        source: "/images/:chemin*",
        headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }],
      },
    ];
  },
};

export default nextConfig;
