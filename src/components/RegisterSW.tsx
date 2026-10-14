"use client";

import { useEffect } from "react";

/** Mendaftarkan service worker hanya di produksi (di mode dev cache membingungkan). */
export default function RegisterSW() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .catch(() => {
        // Gagal mendaftar tidak boleh mengganggu aplikasi; PWA tetap berjalan online.
      });
  }, []);
  return null;
}
