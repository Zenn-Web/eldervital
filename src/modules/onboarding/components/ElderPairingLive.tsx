"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  TOKEN_TTL_MINUTES,
  createPairingToken,
  decideLink,
  groupToken,
  listElderLinks,
  pairingUrl,
  type ElderLink,
} from "@/lib/pairing";
import { errorMessage } from "@/lib/supabase/errors";

// care_links belum masuk publikasi Realtime, jadi permintaan baru diperiksa berkala.
const POLL_MS = 3000;

interface Props {
  displayName: string;
  /** Lanjut ke langkah berikutnya (sudah terhubung, atau dilewati). */
  onNext: () => void;
}

interface Qr {
  token: string;
  image: string;
  expiresAt: number;
}

type Decision = { link: ElderLink; step: "approve" | "share" } | null;

const BTN_PRIMARY =
  "w-full min-h-[56px] rounded-full bg-primary text-white text-base sm:text-lg font-bold hover:bg-primary-strong focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-focus transition-all shadow-sm disabled:opacity-70";
// Dua pilihan setara pada layar persetujuan: keputusan lansia tidak diarahkan tombol yang lebih menonjol.
const BTN_CHOICE =
  "w-full min-h-[60px] rounded-2xl border-2 border-ink/70 bg-surface text-ink text-lg font-bold hover:bg-paper focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-focus disabled:opacity-70";
const BTN_QUIET =
  "w-full min-h-[44px] text-sm sm:text-base font-bold text-ink hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus rounded-full transition-colors";

/**
 * Pairing sungguhan di perangkat lansia: token dari create_pairing_token (berlaku 10 menit,
 * sekali pakai, hanya hash yang disimpan), QR berisi pairingUrl, lalu lansia menyetujui
 * permintaan caregiver dan memilih izin berbagi hasil lewat decide_link.
 */
export function ElderPairingLive({ displayName, onNext }: Props) {
  const [qr, setQr] = useState<Qr | null>(null);
  const [now, setNow] = useState(0); // diisi di efek; Date.now() tidak boleh dipanggil saat render
  const [pending, setPending] = useState<ElderLink | null>(null);
  const [decision, setDecision] = useState<Decision>(null);
  const [done, setDone] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const newCode = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const token = await createPairingToken();
      const { toDataURL } = await import("qrcode");
      const image = await toDataURL(pairingUrl(window.location.origin, token), {
        errorCorrectionLevel: "M",
        margin: 2,
        width: 320,
        color: { dark: "#1D2433", light: "#FFFFFF" },
      });
      const t = Date.now();
      setQr({ token, image, expiresAt: t + TOKEN_TTL_MINUTES * 60_000 });
      setNow(t);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }, []);

  // Kode pertama dibuat saat layar dibuka.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- memulai pemuatan asinkron sekali
    newCode();
  }, [newCode]);

  // Jam hitung mundur.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Periksa permintaan caregiver yang menunggu persetujuan.
  useEffect(() => {
    if (done) return;
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      try {
        const links = await listElderLinks();
        if (alive) setPending(links.find((l) => l.status === "pending") ?? null);
      } catch {
        // Jaringan putus sesaat: coba lagi pada putaran berikutnya.
      }
      if (alive) timer = setTimeout(tick, POLL_MS);
    };
    tick();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [done]);

  async function decide(link: ElderLink, approve: boolean, share: boolean) {
    setBusy(true);
    setError(null);
    try {
      await decideLink(link.id, approve, share);
      setDecision(null);
      setPending(null);
      setDone(
        approve
          ? share
            ? `Terhubung dengan ${link.caregiverName}. ${link.caregiverName} boleh melihat hasil pemeriksaan.`
            : `Terhubung dengan ${link.caregiverName}. Hasil pemeriksaan tidak dibagikan.`
          : `Permintaan dari ${link.caregiverName} ditolak.`,
      );
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  const errorBox = error && (
    <p role="alert" className="rounded-2xl bg-alert-bg text-alert-ink px-4 py-3 text-sm font-bold">
      {error}
    </p>
  );

  // ---------- Selesai memutuskan ----------
  if (done) {
    return (
      <Screen>
        <div className="space-y-3" role="status">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-ink leading-tight">{done}</h1>
          <p className="text-sm sm:text-base text-ink-soft">
            Izin melihat hasil bisa diubah atau hubungan diputus kapan saja.
          </p>
        </div>
        <Actions>
          <button type="button" onClick={onNext} className={BTN_PRIMARY}>
            Lanjut
          </button>
        </Actions>
      </Screen>
    );
  }

  // ---------- Keputusan lansia: satu pertanyaan per layar ----------
  const current = decision ?? (pending ? { link: pending, step: "approve" as const } : null);
  if (current) {
    const name = current.link.caregiverName;
    return (
      <Screen>
        {current.step === "approve" ? (
          <div className="space-y-2">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-ink leading-tight">
              {name} ingin terhubung dengan {displayName || "Anda"}
            </h1>
            <p className="text-base text-ink-soft">
              Setujui hanya bila Anda mengenal {name} dan Anda sendiri yang menunjukkan kode QR tadi.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-ink leading-tight">
              Boleh {name} melihat hasil pemeriksaan?
            </h1>
            <p className="text-base text-ink-soft">
              Bila boleh, {name} dapat melihat hasil, jawaban, dan alasan setiap pemeriksaan. Bila tidak,{" "}
              {name} hanya tahu bahwa Anda terhubung. Pilihan ini bisa diubah kapan saja.
            </p>
          </div>
        )}
        {errorBox}
        <Actions>
          {current.step === "approve" ? (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={() => setDecision({ link: current.link, step: "share" })}
                className={BTN_CHOICE}
              >
                Setujui
              </button>
              <button type="button" disabled={busy} onClick={() => decide(current.link, false, false)} className={BTN_CHOICE}>
                Tolak
              </button>
            </>
          ) : (
            <>
              <button type="button" disabled={busy} onClick={() => decide(current.link, true, true)} className={BTN_CHOICE}>
                Ya, boleh melihat hasil
              </button>
              <button type="button" disabled={busy} onClick={() => decide(current.link, true, false)} className={BTN_CHOICE}>
                Tidak, hanya terhubung
              </button>
            </>
          )}
        </Actions>
      </Screen>
    );
  }

  // ---------- QR ----------
  const msLeft = qr ? Math.max(0, qr.expiresAt - now) : 0;
  const expired = qr !== null && now > 0 && msLeft === 0;
  const totalMs = TOKEN_TTL_MINUTES * 60_000;
  const progressPct = qr ? (msLeft / totalMs) * 100 : 0;
  const isAlmostExpired = progressPct < 20;
  const mm = Math.floor(msLeft / 60_000);
  const ss = Math.floor((msLeft % 60_000) / 1000);

  return (
    <Screen>
      <div className="space-y-1.5">
        <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-ink leading-tight">
          Tunjukkan kode ini kepada keluarga
        </h1>
        <p className="text-sm sm:text-base text-ink-soft">
          Setelah dipindai, nama caregiver akan muncul di layar ini untuk Anda setujui.
        </p>
      </div>

      <div className="rounded-2xl border border-line/60 bg-surface p-5 sm:p-6 flex flex-col items-center gap-4 shadow-xs">
        <span className="font-serif text-lg sm:text-xl font-bold text-ink">{displayName}</span>

        {qr && !expired ? (
          <div className="p-3 bg-white rounded-xl border border-line/40 shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element -- data URL buatan sendiri */}
            <img
              src={qr.image}
              width={210}
              height={210}
              alt="Kode QR untuk dipindai caregiver. Tidak berisi data kesehatan."
              style={{ imageRendering: "pixelated" }}
            />
          </div>
        ) : (
          <p role="status" className="text-base text-ink-soft py-8 text-center">
            {busy ? "Membuat kode..." : expired ? "Kode sudah kedaluwarsa. Buat kode baru." : "Kode belum tersedia."}
          </p>
        )}

        {qr && !expired && (
          <div className="w-full space-y-2">
            <div className="flex items-center justify-between text-xs sm:text-sm font-medium">
              <span className="text-ink-soft">Berlaku, sekali pakai</span>
              <span className={`font-mono font-bold tabular-nums ${isAlmostExpired ? "text-alert-mark" : "text-ink"}`}>
                {String(mm).padStart(2, "0")}:{String(ss).padStart(2, "0")} lagi
              </span>
            </div>
            <div
              role="progressbar"
              aria-valuenow={Math.round(progressPct)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Masa berlaku kode QR"
              className="w-full h-1.5 rounded-full bg-line/40 overflow-hidden"
            >
              <div
                className={`h-full rounded-full ${isAlmostExpired ? "bg-alert-mark" : "bg-sogan"}`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <details className="pt-1">
              <summary className="min-h-[44px] flex items-center text-sm font-bold text-primary underline underline-offset-4 cursor-pointer">
                Kamera caregiver tidak bisa memindai?
              </summary>
              <p className="text-xs sm:text-sm text-ink-soft">
                Caregiver bisa menempel atau mengetik kode ini di halaman Hubungkan Lansia. Anda tetap diminta
                menyetujui.
              </p>
              <p className="mt-2 font-mono font-bold text-ink text-sm break-all tabular-nums">{groupToken(qr.token)}</p>
            </details>
          </div>
        )}
      </div>

      {errorBox}

      <p className="text-xs sm:text-sm text-ink-soft leading-relaxed">
        QR hanya berisi kode penghubung sementara, tanpa nama atau data kesehatan.
      </p>

      <Actions>
        {(expired || !qr) && (
          <button type="button" disabled={busy} onClick={newCode} className={BTN_PRIMARY}>
            {busy ? "Membuat kode..." : "Buat kode baru"}
          </button>
        )}
        <button type="button" onClick={onNext} className={BTN_QUIET}>
          Lewati, hubungkan nanti
        </button>
      </Actions>
    </Screen>
  );
}

function Screen({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col min-h-full flex-1 bg-paper text-ink p-6 gap-5 overflow-y-auto">{children}</div>;
}

function Actions({ children }: { children: React.ReactNode }) {
  return <div className="flex-1 flex flex-col justify-end gap-3 pt-4 pb-2">{children}</div>;
}
