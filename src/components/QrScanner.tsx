"use client";

import { useEffect, useRef } from "react";

// BarcodeDetector belum ada di lib DOM TypeScript.
interface Detector {
  detect(source: CanvasImageSource): Promise<{ rawValue: string }[]>;
}
declare const BarcodeDetector: {
  new (opts: { formats: string[] }): Detector;
  getSupportedFormats(): Promise<string[]>;
};

const SCAN_INTERVAL_MS = 250;
const MAX_SIDE = 640;

interface Props {
  /** Kembalikan true bila isi QR diterima (pemindaian berhenti). */
  onCode: (text: string) => boolean;
  onError: (message: string) => void;
}

/**
 * Pemindai QR dari kamera belakang. Memakai BarcodeDetector bawaan browser bila ada
 * (Chrome Android), dan jsQR sebagai cadangan (mis. Safari iOS). Kamera hanya bisa
 * dipakai di HTTPS atau localhost. Kamera dimatikan saat komponen dilepas, termasuk
 * saat halaman disembunyikan oleh navigasi Cache Components (efek dibersihkan).
 */
export default function QrScanner({ onCode, onError }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const handlers = useRef({ onCode, onError });
  useEffect(() => {
    handlers.current = { onCode, onError };
  });

  useEffect(() => {
    let stopped = false;
    let stream: MediaStream | null = null;
    let raf = 0;

    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        handlers.current.onError(
          "Kamera tidak tersedia. Kamera hanya bisa dipakai lewat alamat https. Silakan ketik kode.",
        );
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
      } catch (e) {
        handlers.current.onError(cameraMessage(e));
        return;
      }
      if (stopped) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      const video = videoRef.current!;
      video.srcObject = stream;
      await video.play().catch(() => {});

      const detector = await nativeDetector();
      const jsQR = detector ? null : (await import("jsqr")).default;
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      let last = 0;

      const loop = async (t: number) => {
        if (stopped) return;
        if (t - last >= SCAN_INTERVAL_MS && video.readyState >= video.HAVE_CURRENT_DATA) {
          last = t;
          let text: string | null = null;
          try {
            if (detector) {
              text = (await detector.detect(video))[0]?.rawValue ?? null;
            } else if (jsQR && ctx && video.videoWidth) {
              const scale = Math.min(1, MAX_SIDE / Math.max(video.videoWidth, video.videoHeight));
              canvas.width = Math.round(video.videoWidth * scale);
              canvas.height = Math.round(video.videoHeight * scale);
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
              text = jsQR(img.data, img.width, img.height, { inversionAttempts: "dontInvert" })?.data ?? null;
            }
          } catch {
            // Bingkai gagal dibaca; coba bingkai berikutnya.
          }
          if (text && !stopped && handlers.current.onCode(text)) return;
        }
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    })();

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <video
      ref={videoRef}
      className="block w-full max-w-[280px] aspect-square object-cover mx-auto rounded-3xl bg-ink"
      muted
      playsInline
      aria-label="Tampilan kamera untuk memindai kode QR"
    />
  );
}

async function nativeDetector(): Promise<Detector | null> {
  try {
    if (typeof BarcodeDetector === "undefined") return null;
    const formats = await BarcodeDetector.getSupportedFormats();
    return formats.includes("qr_code") ? new BarcodeDetector({ formats: ["qr_code"] }) : null;
  } catch {
    return null;
  }
}

function cameraMessage(e: unknown): string {
  const name = (e as { name?: string })?.name;
  if (name === "NotAllowedError" || name === "SecurityError")
    return "Izin kamera ditolak. Izinkan kamera di pengaturan browser, atau ketik kode.";
  if (name === "NotFoundError" || name === "OverconstrainedError")
    return "Kamera tidak ditemukan di perangkat ini. Silakan ketik kode.";
  if (name === "NotReadableError")
    return "Kamera sedang dipakai aplikasi lain. Tutup aplikasi itu, atau ketik kode.";
  return "Kamera tidak bisa dibuka. Silakan ketik kode.";
}
