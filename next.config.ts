import type { NextConfig } from "next";
import { securityHeaders as buildSecurityHeaders } from "./src/lib/security/headers";

// Dibaca saat build/start: URL Supabase harus sudah diisi di Vercel sebelum deploy.
const securityHeaders = buildSecurityHeaders({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  isDev: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  async headers() {
    return [
      { source: "/(.*)", headers: securityHeaders },
      {
        // Service worker harus selalu diambil ulang agar pembaruan cepat sampai.
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Type", value: "text/javascript; charset=utf-8" },
        ],
      },
    ];
  },
};

export default nextConfig;
