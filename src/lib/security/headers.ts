/**
 * Header keamanan HTTP untuk semua halaman (dipakai next.config.ts, diuji di headers.test.ts).
 *
 * CSP sengaja tanpa nonce: nonce mewajibkan setiap halaman dirender dinamis per permintaan
 * (lihat node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md), padahal
 * halaman kita dirender statis dan disimpan service worker untuk mode offline. Akibatnya
 * script-src masih butuh 'unsafe-inline' untuk skrip inline milik Next.js. CSP ini tetap
 * menutup clickjacking (frame-ancestors), plugin (object-src), pembajakan <base>, kiriman
 * formulir ke luar, dan membatasi koneksi hanya ke situs sendiri dan proyek Supabase kita.
 *
 * Login Google tidak perlu dicantumkan: alurnya berupa perpindahan halaman penuh ke Supabase
 * lalu Google (bukan fetch, iframe, atau formulir), dan CSP tidak membatasi perpindahan itu.
 */

export interface HeaderEnv {
  /** NEXT_PUBLIC_SUPABASE_URL; kosong saat simulasi. */
  supabaseUrl?: string;
  /** true untuk `next dev`: React butuh eval untuk tumpukan galat yang lebih jelas. */
  isDev?: boolean;
}

/** Origin https dan wss proyek Supabase (Auth, REST/RPC, Realtime). Kosong bila URL tidak sah. */
export function supabaseOrigins(supabaseUrl: string | undefined): string[] {
  if (!supabaseUrl) return [];
  try {
    const url = new URL(supabaseUrl);
    if (url.protocol !== "https:" && url.protocol !== "http:") return [];
    const ws = url.protocol === "https:" ? "wss:" : "ws:";
    return [url.origin, `${ws}//${url.host}`];
  } catch {
    return [];
  }
}

export function contentSecurityPolicy({ supabaseUrl, isDev = false }: HeaderEnv): string {
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": ["'self'", "'unsafe-inline'", ...(isDev ? ["'unsafe-eval'"] : [])],
    "style-src": ["'self'", "'unsafe-inline'"],
    // data: untuk gambar QR (qrcode.toDataURL), blob: untuk bingkai kamera pemindai.
    "img-src": ["'self'", "data:", "blob:"],
    // Font Atkinson Hyperlegible dibundel lokal (@fontsource), tanpa Google Fonts.
    "font-src": ["'self'"],
    "connect-src": ["'self'", ...supabaseOrigins(supabaseUrl)],
    "media-src": ["'self'", "blob:"],
    "worker-src": ["'self'"],
    "manifest-src": ["'self'"],
    "frame-src": ["'none'"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
  };
  return Object.entries(directives)
    .map(([name, values]) => `${name} ${values.join(" ")}`)
    .join("; ");
}

export function securityHeaders(env: HeaderEnv): { key: string; value: string }[] {
  return [
    { key: "Content-Security-Policy", value: contentSecurityPolicy(env) },
    // Untuk browser lama yang belum mengenal frame-ancestors.
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    // Mikrofon (jawaban suara) dan kamera (pindai QR) hanya untuk halaman ini sendiri.
    { key: "Permissions-Policy", value: "microphone=(self), camera=(self), geolocation=()" },
  ];
}
