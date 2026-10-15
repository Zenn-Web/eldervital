"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import StatusMark from "@/components/StatusMark";
import { ChevronRightIcon } from "@/components/shared/Icons";
import { useCaregiverSession } from "@/components/session/CaregiverSession";
import HelpRequestAlert from "./components/HelpRequestAlert";
import { listCaregiverLinks, type CaregiverLink } from "@/lib/pairing";
import {
  getExamination,
  latestExaminationByElder,
  type ExaminationDetail,
  type ExaminationSummary,
} from "@/lib/exam/history";
import { completeHelpRequest, takeHelpRequest, useHelpRequests } from "@/lib/help";
import type { ResultStatus } from "@/lib/screening";
import { errorMessage } from "@/lib/supabase/errors";

// Judul status tanpa menyiratkan "aman" atau "pasti sehat" (aturan keselamatan klinis).
export const STATUS_HEADLINE: Record<ResultStatus, string> = {
  green: "Tidak ada pemicu perhatian",
  yellow: "Perlu perhatian",
  red: "Tanda bahaya: perlu pertolongan segera",
  insufficient: "Data belum cukup",
};

const STATUS_BOX: Record<ResultStatus, string> = {
  green: "bg-ok-bg/30 border-ok-mark/30 text-ok-ink",
  yellow: "bg-warn-bg/30 border-warn-mark/30 text-warn-ink",
  red: "bg-alert-bg/30 border-alert-mark/30 text-alert-ink",
  insufficient: "bg-paper border-line text-ink",
};

const CARD = "rounded-2xl border border-line/60 bg-surface p-4 sm:p-6 space-y-4";
const LINK_ROW =
  "flex items-center justify-between px-4 py-3 rounded-full border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors text-primary font-bold text-sm min-h-[48px]";

export function formatWhen(iso: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  return `${d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}, pukul ${d
    .toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
    .replace(":", ".")}`;
}

/**
 * Dashboard caregiver dari data sungguhan (spesifikasi 11.2): lansia terhubung, status
 * pemeriksaan terakhir beserta alasannya, dan permintaan bantuan realtime. Tren harian dan
 * catatan tindak lanjut dari versi demo tidak ditampilkan karena datanya tidak ada di
 * database; menampilkannya di samping data nyata akan menyesatkan.
 */
export function CaregiverDashboardLive() {
  const { profile } = useCaregiverSession();
  const [links, setLinks] = useState<CaregiverLink[] | null>(null);
  const [latest, setLatest] = useState<Map<string, ExaminationSummary>>(new Map());
  const [detail, setDetail] = useState<ExaminationDetail | null>(null);
  const [chosen, setChosen] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const help = useHelpRequests("caregiver", Boolean(profile));

  const load = useCallback(async () => {
    try {
      const [l, m] = await Promise.all([listCaregiverLinks(), latestExaminationByElder("caregiver")]);
      setLinks(l);
      setLatest(m);
      setError(null);
    } catch (e) {
      setError(errorMessage(e));
    }
  }, []);

  useEffect(() => {
    if (!profile) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- memuat data sekali saat dibuka
    load();
  }, [profile, load]);

  const active = links?.filter((l) => l.status === "active") ?? [];
  const pendingLinks = links?.filter((l) => l.status === "pending") ?? [];
  const elder = active.find((l) => l.elderId === chosen) ?? active[0] ?? null;
  const last = elder ? (latest.get(elder.elderId) ?? null) : null;

  // Rincian (alasan) pemeriksaan terakhir lansia yang dipilih.
  const lastId = last?.id ?? null;
  useEffect(() => {
    if (!lastId) return;
    let alive = true;
    getExamination("caregiver", lastId)
      .then((d) => alive && setDetail(d))
      .catch(() => alive && setDetail(null));
    return () => {
      alive = false;
    };
  }, [lastId]);

  async function onHelp(id: string, stage: "take" | "done") {
    setBusy(true);
    try {
      const ok = stage === "take" ? await takeHelpRequest(id) : await completeHelpRequest(id);
      if (!ok) setError("Permintaan ini sudah ditanggapi caregiver lain atau sudah selesai.");
      help.refresh();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  if (links === null && !error) {
    return <p role="status" className="text-base text-ink-soft py-6 max-w-2xl mx-auto">Memuat dashboard...</p>;
  }

  const openHelp = (help.requests ?? []).filter((r) => !elder || r.elderId === elder.elderId);

  return (
    <div className="space-y-5 pb-12 max-w-2xl mx-auto px-1 sm:px-4">
      <header className="space-y-1">
        <span className="text-xs font-bold text-sogan uppercase tracking-widest">Dashboard caregiver</span>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink">Halo, {profile?.displayName}</h1>
      </header>

      {error && (
        <p role="alert" className="rounded-2xl bg-alert-bg text-alert-ink px-4 py-3 text-sm font-bold">
          {error}
        </p>
      )}
      {help.error && (
        <p role="alert" className="rounded-2xl bg-alert-bg text-alert-ink px-4 py-3 text-sm font-bold">
          Permintaan bantuan belum bisa dimuat. {help.error}
        </p>
      )}

      {/* Permintaan bantuan (realtime) */}
      {openHelp.map((r) => (
        <HelpRequestAlert
          key={r.id}
          request={{
            id: r.id,
            elderId: r.elderId,
            elderName: r.elderName ?? "Lansia",
            phone: "",
            requestedAt: r.createdAt,
            relativeTime: `pukul ${new Date(r.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }).replace(":", ".")}`,
            message: "",
            status: "pending",
          }}
          takenByName={r.status === "taken" ? (r.takenByName ?? "caregiver lain") : null}
          onTake={r.status === "open" ? () => onHelp(r.id, "take") : undefined}
          onResolve={() => (r.status === "open" ? onHelp(r.id, "take").then(() => onHelp(r.id, "done")) : onHelp(r.id, "done"))}
          busy={busy}
        />
      ))}

      {pendingLinks.length > 0 && (
        <p role="status" className="rounded-2xl border border-line/60 bg-surface px-4 py-3 text-sm text-ink">
          {pendingLinks.length} permintaan hubungan menunggu persetujuan lansia. Nama lansia tampil setelah disetujui.
        </p>
      )}

      {active.length === 0 ? (
        <section className={CARD} aria-labelledby="belum-terhubung">
          <h2 id="belum-terhubung" className="text-xl font-bold text-ink">
            Belum ada lansia terhubung
          </h2>
          <p className="text-sm text-ink-soft">
            Pindai kode QR di ponsel lansia. Lansia menyetujui di perangkatnya, lalu memilih apakah Anda boleh
            melihat hasil pemeriksaan.
          </p>
          <Link href="/caregiver/hubungkan" className={LINK_ROW}>
            <span>Hubungkan lansia</span>
            <ChevronRightIcon className="h-4 w-4 shrink-0" />
          </Link>
        </section>
      ) : (
        <>
          {active.length > 1 && (
            <div className="flex flex-wrap gap-2" role="group" aria-label="Pilih lansia">
              {active.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  aria-pressed={l.elderId === elder?.elderId}
                  onClick={() => setChosen(l.elderId)}
                  className={`min-h-[44px] px-4 rounded-full border font-bold text-sm ${
                    l.elderId === elder?.elderId ? "bg-primary text-white border-primary" : "bg-surface text-ink border-line/60"
                  }`}
                >
                  {l.elderName ?? "Lansia"}
                </button>
              ))}
            </div>
          )}

          {elder && (
            <section className={CARD} aria-labelledby="status-terkini">
              <div className="text-xs uppercase font-semibold text-ink-soft tracking-wider">
                {elder.elderName ?? "Lansia"}
              </div>

              {!last ? (
                <>
                  <h2 id="status-terkini" className="text-xl sm:text-2xl font-bold text-ink">
                    {elder.shareResults ? "Belum ada pemeriksaan" : "Hasil pemeriksaan belum dibagikan"}
                  </h2>
                  <p className="text-sm text-ink-soft">
                    {elder.shareResults
                      ? "Pemeriksaan yang dilakukan lansia atau bersama Anda akan tampil di sini."
                      : `${elder.elderName ?? "Lansia"} belum mengizinkan Anda melihat hasil pemeriksaan. Izin ini diatur oleh lansia di perangkatnya. Pemeriksaan yang Anda catat sendiri tetap tampil.`}
                  </p>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-3.5">
                    <StatusMark status={last.resultStatus ?? "insufficient"} size="md" />
                    <div>
                      <h2 id="status-terkini" className="text-xl sm:text-2xl font-bold text-ink">
                        {STATUS_HEADLINE[last.resultStatus ?? "insufficient"]}
                      </h2>
                      <p className="text-xs sm:text-sm text-ink-soft mt-0.5">
                        Pemeriksaan terakhir: {formatWhen(last.finishedAt ?? last.startedAt)} &bull;{" "}
                        {last.mode === "caregiver" ? "bersama caregiver" : "cek mandiri"}
                        {last.interrupted ? " • dihentikan karena tanda bahaya" : ""}
                      </p>
                    </div>
                  </div>
                  <div className={`rounded-xl p-3.5 text-sm space-y-1 border ${STATUS_BOX[last.resultStatus ?? "insufficient"]}`}>
                    <p className="font-semibold">Alasan:</p>
                    {detail && detail.id === last.id && detail.reasons.length > 0 ? (
                      <ul className="list-disc list-inside text-xs sm:text-sm space-y-1">
                        {detail.reasons.map((r) => (
                          <li key={r.ruleId}>
                            {r.text} <span className="opacity-80">(dari jawaban &ldquo;{r.answerLabel}&rdquo;)</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs sm:text-sm">
                        {last.resultStatus === "insufficient"
                          ? "Ada pertanyaan penting yang belum diketahui jawabannya, atau pemeriksaan belum selesai."
                          : "Tidak ada aturan perhatian yang terpicu dari jawaban yang dilaporkan."}
                      </p>
                    )}
                  </div>
                  {!elder.shareResults && (
                    <p className="text-xs text-ink-soft">
                      Hanya pemeriksaan yang Anda catat sendiri yang tampil, karena lansia belum mengizinkan berbagi hasil.
                    </p>
                  )}
                </>
              )}

              <div className="space-y-2 pt-1">
                <Link href="/caregiver/periksa" className={LINK_ROW}>
                  <span>Pemeriksaan bersama lansia</span>
                  <ChevronRightIcon className="h-4 w-4 shrink-0" />
                </Link>
                <Link href="/caregiver/riwayat" className={LINK_ROW}>
                  <span>Lihat seluruh riwayat</span>
                  <ChevronRightIcon className="h-4 w-4 shrink-0" />
                </Link>
                <Link href="/caregiver/hubungkan" className={LINK_ROW}>
                  <span>Hubungkan lansia lain</span>
                  <ChevronRightIcon className="h-4 w-4 shrink-0" />
                </Link>
              </div>
            </section>
          )}
        </>
      )}

      <p className="text-xs text-ink-soft">
        Hasil skrining, bukan diagnosis. Aplikasi tidak bisa memastikan lansia atau caregiver melihat pemberitahuan;
        dalam keadaan darurat hubungi 112 atau 119.
      </p>
    </div>
  );
}
