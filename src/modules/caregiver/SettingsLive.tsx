"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useCaregiverSession } from "@/components/session/CaregiverSession";
import { signOutCaregiver, updateCaregiverName } from "@/lib/auth/caregiver";
import { listCaregiverLinks, revokeLink, type CaregiverLink } from "@/lib/pairing";
import { errorMessage } from "@/lib/supabase/errors";

const FIELD =
  "w-full min-h-[48px] px-4 rounded-xl border border-line/60 bg-surface text-ink focus:border-primary focus:outline-none focus:ring-4 focus:ring-focus";
const BTN =
  "min-h-[44px] px-5 rounded-full border border-line/60 bg-surface hover:bg-paper text-ink font-bold text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:opacity-70";

function ErrorBox({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <p role="alert" className="rounded-xl bg-alert-bg text-alert-ink px-3 py-2 text-sm font-bold">
      {error}
    </p>
  );
}

/** Nama caregiver (tampil di perangkat lansia), bisa diubah. */
export function CaregiverProfileLive() {
  const { profile, setProfile } = useCaregiverSession();
  const [name, setName] = useState(profile?.displayName ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      setProfile(await updateCaregiverName(name));
      setSaved(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-3">
      <label htmlFor="cg-name" className="text-xs text-ink-soft block font-medium">
        Nama (tampil di perangkat lansia)
      </label>
      <input id="cg-name" className={FIELD} value={name} maxLength={60} onChange={(e) => setName(e.target.value)} required />
      <ErrorBox error={error} />
      {saved && (
        <p role="status" className="text-sm text-ok-ink font-bold">
          Nama tersimpan.
        </p>
      )}
      <button type="submit" disabled={busy || name.trim() === "" || name.trim() === profile?.displayName} className={BTN}>
        {busy ? "Menyimpan..." : "Simpan nama"}
      </button>
    </form>
  );
}

/** Lansia terhubung dan izin berbaginya; caregiver juga boleh memutus hubungan. */
export function CaregiverLinksLive() {
  const [links, setLinks] = useState<CaregiverLink[] | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLinks(await listCaregiverLinks());
    } catch (e) {
      setError(errorMessage(e));
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- memuat daftar sekali saat dibuka
    load();
  }, [load]);

  async function revoke(id: string) {
    setBusy(true);
    setError(null);
    try {
      await revokeLink("caregiver", id);
      setConfirming(null);
      await load();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  if (links === null && !error) return <p className="text-sm text-ink-soft">Memuat...</p>;
  return (
    <div className="space-y-3">
      <ErrorBox error={error} />
      {(links ?? []).length === 0 && <p className="text-sm text-ink-soft">Belum ada lansia terhubung.</p>}
      {(links ?? []).map((l) => (
        <div key={l.id} className="p-3.5 rounded-xl border border-line/60 bg-paper/40 space-y-2">
          <div className="text-sm font-bold text-ink">
            {l.status === "active" ? (l.elderName ?? "Lansia") : "Menunggu persetujuan lansia"}
          </div>
          <div className="text-xs text-ink-soft">
            {l.status === "active"
              ? l.shareResults
                ? "Mengizinkan Anda melihat hasil pemeriksaan. Izin diatur oleh lansia."
                : "Belum mengizinkan Anda melihat hasil pemeriksaan. Izin diatur oleh lansia."
              : "Nama lansia tampil setelah disetujui."}
          </div>
          {l.status === "active" &&
            (confirming === l.id ? (
              <div className="flex flex-wrap gap-2" role="group" aria-label="Konfirmasi putus hubungan">
                <span className="text-sm text-ink w-full">Putuskan hubungan? Untuk terhubung lagi perlu kode QR baru.</span>
                <button type="button" disabled={busy} onClick={() => revoke(l.id)} className={`${BTN} text-alert-ink`}>
                  Ya, putuskan
                </button>
                <button type="button" onClick={() => setConfirming(null)} className={BTN}>
                  Batal
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => setConfirming(l.id)} className={BTN}>
                Putuskan hubungan
              </button>
            ))}
        </div>
      ))}
    </div>
  );
}

/** Keluar dari akun caregiver di perangkat ini. */
export function CaregiverLogoutLive() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="space-y-2">
      <ErrorBox error={error} />
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            await signOutCaregiver();
            router.push("/");
          } catch (e) {
            setError(errorMessage(e));
            setBusy(false);
          }
        }}
        className="w-full sm:w-auto px-6 py-3 rounded-full border border-line/60 bg-paper hover:bg-paper/80 transition-colors text-alert-ink font-semibold text-sm min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
      >
        {busy ? "Keluar..." : "Keluar dari Sesi Caregiver"}
      </button>
    </div>
  );
}
