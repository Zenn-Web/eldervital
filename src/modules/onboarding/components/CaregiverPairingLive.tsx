"use client";

import React, { useEffect, useState } from "react";
import QrScanner from "@/components/QrScanner";
import { ChevronLeftIcon, CameraIcon } from "@/components/shared/Icons";
import {
  extractToken,
  getCaregiverLinkStatus,
  previewPairing,
  requestPairing,
  type LinkStatus,
} from "@/lib/pairing";
import { errorMessage } from "@/lib/supabase/errors";

const POLL_MS = 3000;

interface Props {
  /** Token dari URL QR (#t=...) bila halaman dibuka lewat kamera bawaan ponsel. */
  initialToken?: string | null;
  onPaired: (elder: { name: string; ageRange: string; shareResults: boolean }) => void;
  onBack: () => void;
}

type Step =
  | { kind: "start" }
  | { kind: "scan" }
  | { kind: "checking"; token: string }
  | { kind: "confirm"; token: string; name: string }
  | { kind: "sent"; linkId: string; name: string; status: LinkStatus | null };

const BTN_PRIMARY =
  "w-full min-h-[56px] rounded-full bg-primary text-white text-base sm:text-lg font-bold hover:bg-primary-strong focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-focus transition-all shadow-sm disabled:opacity-70";
const BTN_SECONDARY =
  "w-full min-h-[52px] rounded-full bg-surface border border-line/60 text-ink text-base font-bold hover:bg-paper focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-focus transition-colors";
const BACK =
  "w-11 h-11 rounded-full border border-line/60 bg-surface flex items-center justify-center hover:bg-paper focus-visible:ring-4 focus-visible:ring-focus text-ink transition-colors shadow-xs";

/**
 * Pairing sungguhan di sisi caregiver: pindai QR atau tempel kode, lihat nama lansia
 * (preview_pairing, token belum terpakai), kirim permintaan (request_pairing), lalu tunggu
 * lansia menyetujui. Izin berbagi hasil diputuskan LANSIA di perangkatnya, bukan di sini.
 */
export function CaregiverPairingLive({ initialToken, onPaired, onBack }: Props) {
  const [step, setStep] = useState<Step>(
    initialToken ? { kind: "checking", token: initialToken } : { kind: "start" },
  );
  const [manual, setManual] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Periksa token: tampilkan nama lansia tanpa memakai token.
  const checkingToken = step.kind === "checking" ? step.token : null;
  useEffect(() => {
    if (!checkingToken) return;
    let alive = true;
    previewPairing(checkingToken)
      .then((name) => alive && setStep({ kind: "confirm", token: checkingToken, name }))
      .catch((e) => {
        if (!alive) return;
        setError(errorMessage(e));
        setStep({ kind: "start" });
      });
    return () => {
      alive = false;
    };
  }, [checkingToken]);

  // Tunggu keputusan lansia.
  const sentId = step.kind === "sent" && step.status === "pending" ? step.linkId : null;
  useEffect(() => {
    if (!sentId) return;
    const timer = setInterval(async () => {
      try {
        const status = await getCaregiverLinkStatus(sentId);
        setStep((s) => (s.kind === "sent" && s.linkId === sentId ? { ...s, status } : s));
      } catch {
        // Jaringan putus sesaat: coba lagi pada putaran berikutnya.
      }
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [sentId]);

  function submitToken(input: string): boolean {
    const token = extractToken(input);
    if (!token) {
      setError("Kode ini bukan kode penghubung ElderVital. Periksa lagi, atau minta lansia membuat kode baru.");
      return false;
    }
    setError(null);
    setStep({ kind: "checking", token });
    return true;
  }

  async function send(token: string, name: string) {
    setBusy(true);
    setError(null);
    try {
      const linkId = await requestPairing(token);
      setStep({ kind: "sent", linkId, name, status: "pending" });
    } catch (e) {
      setError(errorMessage(e));
      setStep({ kind: "start" });
    } finally {
      setBusy(false);
    }
  }

  const errorBox = error && (
    <p role="alert" className="rounded-2xl bg-alert-bg text-alert-ink px-4 py-3 text-sm font-bold">
      {error}
    </p>
  );

  if (step.kind === "checking") {
    return (
      <Screen>
        <p role="status" className="text-base text-ink-soft py-6">
          Memeriksa kode...
        </p>
      </Screen>
    );
  }

  if (step.kind === "confirm") {
    return (
      <Screen>
        <button type="button" onClick={() => setStep({ kind: "start" })} className={BACK} aria-label="Kembali">
          <ChevronLeftIcon size={22} />
        </button>
        <div className="space-y-1.5">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-ink leading-tight">
            Hubungkan dengan {step.name}?
          </h1>
          <p className="text-sm sm:text-base text-ink-soft">
            Pastikan ini lansia yang Anda maksud. {step.name} akan diminta menyetujui di perangkatnya, dan{" "}
            {step.name} sendiri yang memilih apakah Anda boleh melihat hasil pemeriksaan.
          </p>
        </div>
        <div className="p-5 border border-line/60 bg-surface rounded-2xl flex items-center gap-4 shadow-xs">
          <div className="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center font-serif text-2xl font-bold shrink-0">
            {step.name[0]}
          </div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-ink">{step.name}</h2>
        </div>
        {errorBox}
        <Actions>
          <button type="button" disabled={busy} onClick={() => send(step.token, step.name)} className={BTN_PRIMARY}>
            {busy ? "Mengirim..." : "Kirim permintaan"}
          </button>
        </Actions>
      </Screen>
    );
  }

  if (step.kind === "sent") {
    const { name, status } = step;
    return (
      <Screen>
        <div className="space-y-2" role="status" aria-live="polite">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-ink leading-tight">
            {status === "active"
              ? `Terhubung dengan ${name}`
              : status === "pending"
                ? `Menunggu persetujuan ${name}`
                : "Permintaan tidak disetujui"}
          </h1>
          <p className="text-sm sm:text-base text-ink-soft">
            {status === "active"
              ? `${name} sudah menyetujui. Izin melihat hasil mengikuti pilihan ${name}.`
              : status === "pending"
                ? `Minta ${name} membuka ElderVital di perangkatnya dan menyetujui. Halaman ini berubah setelah ${name} memutuskan.`
                : `${name} menolak permintaan ini. Untuk mencoba lagi, perlu kode QR baru.`}
          </p>
        </div>
        <Actions>
          {status === "active" ? (
            <button type="button" onClick={() => onPaired({ name, ageRange: "", shareResults: false })} className={BTN_PRIMARY}>
              Buka dashboard
            </button>
          ) : status === "pending" ? (
            <button type="button" onClick={() => onPaired({ name, ageRange: "", shareResults: false })} className={BTN_SECONDARY}>
              Lanjut ke dashboard, tunggu di sana
            </button>
          ) : (
            <button type="button" onClick={() => setStep({ kind: "start" })} className={BTN_PRIMARY}>
              Coba kode lain
            </button>
          )}
        </Actions>
      </Screen>
    );
  }

  return (
    <Screen>
      <button type="button" onClick={onBack} className={BACK} aria-label="Kembali">
        <ChevronLeftIcon size={22} />
      </button>
      <div className="space-y-1.5">
        <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-ink leading-tight">
          Hubungkan Lansia
        </h1>
        <p className="text-sm text-ink-soft">
          Arahkan kamera ke kode QR di ponsel orang tua Anda. Kamera bawaan ponsel juga bisa: tautannya membuka
          halaman ini.
        </p>
      </div>

      {step.kind === "scan" ? (
        <div className="space-y-3">
          <QrScanner
            onCode={submitToken}
            onError={(m) => {
              setError(m);
              setStep({ kind: "start" });
            }}
          />
          <button type="button" onClick={() => setStep({ kind: "start" })} className={BTN_SECONDARY}>
            Tutup kamera
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => setStep({ kind: "scan" })} className={`${BTN_PRIMARY} flex items-center justify-center gap-2`}>
          <CameraIcon size={20} />
          <span>Pindai kode QR</span>
        </button>
      )}

      {errorBox}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submitToken(manual);
        }}
        className="space-y-2"
      >
        <label htmlFor="manual-token" className="block text-sm font-bold text-ink">
          Atau tempel kode penghubung:
        </label>
        <textarea
          id="manual-token"
          value={manual}
          onChange={(e) => setManual(e.target.value)}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          rows={3}
          className="w-full px-4 py-3 font-mono text-sm rounded-2xl border border-line/60 bg-surface text-ink focus:border-primary focus:outline-none focus:ring-4 focus:ring-focus"
        />
        <p className="text-xs text-ink-soft">
          Kode ada di ponsel lansia, di bawah QR, pada bagian &ldquo;Kamera caregiver tidak bisa memindai?&rdquo;.
        </p>
        <button type="submit" disabled={manual.trim() === ""} className={BTN_SECONDARY}>
          Periksa kode
        </button>
      </form>

      <p className="text-xs text-ink-soft">
        Kode QR berlaku 10 menit dan sekali pakai. Isinya kode penghubung sementara, tanpa data kesehatan.
      </p>
    </Screen>
  );
}

function Screen({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col min-h-full flex-1 bg-paper text-ink p-6 gap-5 overflow-y-auto">{children}</div>;
}

function Actions({ children }: { children: React.ReactNode }) {
  return <div className="flex-1 flex flex-col justify-end gap-3 pt-4 pb-2">{children}</div>;
}
