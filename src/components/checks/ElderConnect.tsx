"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useElderSession } from "@/components/session/ElderSession";
import { ElderQrDisplay } from "@/modules/onboarding/components/ElderQrDisplay";
import { listElderLinks, revokeLink, setShareResults, type ElderLink } from "@/lib/pairing";
import { errorMessage } from "@/lib/supabase/errors";

const BTN =
  "w-full min-h-[56px] rounded-2xl border-2 border-ink/70 bg-surface text-ink text-base font-bold hover:bg-paper focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-focus disabled:opacity-70";

/**
 * /lansia/hubungkan: QR untuk menghubungkan caregiver (termasuk persetujuan), dan daftar
 * caregiver terhubung untuk mengubah izin berbagi hasil atau memutus hubungan
 * (spesifikasi 5.3).
 */
export default function ElderConnect() {
  const router = useRouter();
  const { configured, profile } = useElderSession();
  const [links, setLinks] = useState<ElderLink[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLinks((await listElderLinks()).filter((l) => l.status === "active"));
    } catch (e) {
      setError(errorMessage(e));
    }
  }, []);

  useEffect(() => {
    if (!profile) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- memuat daftar sekali saat dibuka
    refresh();
  }, [profile, refresh]);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      setConfirming(null);
      await refresh();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <ElderQrDisplay
        displayName={profile?.displayName ?? "Bu Sari"}
        onNext={() => {
          refresh();
          router.push("/lansia");
        }}
        onBack={() => router.push("/lansia")}
      />

      {configured && links.length > 0 && (
        <section className="rounded-2xl border border-line/60 bg-surface p-5 space-y-5" aria-labelledby="cg-terhubung">
          <h2 id="cg-terhubung" className="font-serif text-xl font-bold text-ink">
            Caregiver terhubung
          </h2>
          {error && (
            <p role="alert" className="rounded-2xl bg-alert-bg text-alert-ink px-4 py-3 text-sm font-bold">
              {error}
            </p>
          )}
          {links.map((l) => (
            <div key={l.id} className="space-y-3 border-t border-line/40 pt-4 first:border-t-0 first:pt-0">
              <p className="text-base text-ink">
                <strong>{l.caregiverName}</strong>
                <br />
                {l.shareResults ? "Boleh melihat hasil pemeriksaan." : "Tidak melihat hasil pemeriksaan."}
              </p>
              <button type="button" disabled={busy} className={BTN} onClick={() => run(() => setShareResults(l.id, !l.shareResults))}>
                {l.shareResults ? "Hentikan berbagi hasil" : "Izinkan melihat hasil"}
              </button>
              {confirming === l.id ? (
                <div className="space-y-3" role="group" aria-label={`Putuskan hubungan dengan ${l.caregiverName}?`}>
                  <p className="text-base text-ink">
                    Putuskan hubungan dengan {l.caregiverName}? Untuk terhubung lagi, perlu kode QR baru.
                  </p>
                  <button type="button" disabled={busy} className={BTN} onClick={() => run(() => revokeLink("lansia", l.id))}>
                    Ya, putuskan
                  </button>
                  <button type="button" className={BTN} onClick={() => setConfirming(null)}>
                    Batal
                  </button>
                </div>
              ) : (
                <button type="button" disabled={busy} className={BTN} onClick={() => setConfirming(l.id)}>
                  Putuskan hubungan
                </button>
              )}
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
