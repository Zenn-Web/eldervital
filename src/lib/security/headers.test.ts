import { describe, expect, it } from "vitest";
import nextConfig from "../../../next.config";
import { contentSecurityPolicy, securityHeaders, supabaseOrigins } from "./headers";

const SUPABASE = "https://abcd1234.supabase.co";

function directive(csp: string, name: string): string[] {
  const found = csp.split(";").map((d) => d.trim().split(/\s+/)).find(([n]) => n === name);
  return found ? found.slice(1) : [];
}

describe("header keamanan", () => {
  it("mencegah clickjacking dengan dua cara", () => {
    const headers = securityHeaders({ supabaseUrl: SUPABASE });
    expect(headers).toContainEqual({ key: "X-Frame-Options", value: "DENY" });
    const csp = headers.find((h) => h.key === "Content-Security-Policy")!.value;
    expect(directive(csp, "frame-ancestors")).toEqual(["'none'"]);
  });

  it("koneksi hanya ke situs sendiri dan proyek Supabase (REST dan Realtime), tanpa wildcard", () => {
    const csp = contentSecurityPolicy({ supabaseUrl: SUPABASE });
    expect(directive(csp, "connect-src")).toEqual(["'self'", SUPABASE, "wss://abcd1234.supabase.co"]);
    expect(csp).not.toMatch(/(^|\s)\*(\s|;|$)|https:\/\/\*/);
  });

  it("path di URL Supabase (mis. /rest/v1/) tidak ikut ke CSP; URL rusak diabaikan", () => {
    expect(supabaseOrigins(`${SUPABASE}/rest/v1/`)).toEqual([SUPABASE, "wss://abcd1234.supabase.co"]);
    expect(supabaseOrigins("bukan url")).toEqual([]);
    expect(supabaseOrigins("javascript:alert(1)")).toEqual([]);
    expect(supabaseOrigins(undefined)).toEqual([]);
  });

  it("tetap mengizinkan yang dipakai aplikasi: gambar QR, kamera, font lokal, service worker", () => {
    const csp = contentSecurityPolicy({ supabaseUrl: SUPABASE });
    expect(directive(csp, "img-src")).toEqual(expect.arrayContaining(["'self'", "data:", "blob:"]));
    expect(directive(csp, "media-src")).toContain("blob:");
    expect(directive(csp, "font-src")).toEqual(["'self'"]);
    expect(directive(csp, "worker-src")).toEqual(["'self'"]);
    expect(directive(csp, "object-src")).toEqual(["'none'"]);
    expect(directive(csp, "form-action")).toEqual(["'self'"]);
  });

  it("unsafe-eval dan skrip debug Vercel Analytics hanya saat pengembangan", () => {
    const prod = directive(contentSecurityPolicy({ isDev: false }), "script-src");
    const dev = directive(contentSecurityPolicy({ isDev: true }), "script-src");
    expect(prod).toEqual(["'self'", "'unsafe-inline'"]);
    expect(dev).toEqual(expect.arrayContaining(["'unsafe-eval'", "https://va.vercel-scripts.com"]));
  });

  it("next.config memasang header ini di semua halaman", async () => {
    const rules = await nextConfig.headers!();
    const all = rules.find((r) => r.source === "/(.*)")!;
    const keys = all.headers.map((h) => h.key);
    expect(keys).toEqual(
      expect.arrayContaining(["Content-Security-Policy", "X-Frame-Options", "X-Content-Type-Options"]),
    );
  });
});
