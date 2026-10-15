"use client";

import { isSupabaseConfigured } from "@/lib/supabase/client";
import { CaregiverDashboardLive } from "@/modules/caregiver/DashboardLive";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  MOCK_ELDER,
  MOCK_HELP_REQUEST,
  MOCK_SIGNAL_DAYS,
  MOCK_EXAMINATIONS,
  INITIAL_FOLLOW_UPS,
} from "@/modules/caregiver/mockData";
import type { FollowUpAction, ExaminationRecord } from "@/modules/caregiver/types";
import type { ResultStatus } from "@/lib/screening";
import CaregiverHeader from "@/modules/caregiver/components/CaregiverHeader";
import HelpRequestAlert from "@/modules/caregiver/components/HelpRequestAlert";
import SignalGrid from "@/modules/caregiver/components/SignalGrid";
import FollowUpDialog from "@/modules/caregiver/components/FollowUpDialog";
import FollowUpList from "@/modules/caregiver/components/FollowUpList";
import StatusMark from "@/components/StatusMark";
import { Button } from "@/components/ui/button";
import { CloseIcon, ChevronRightIcon } from "@/components/shared/Icons";

/** Dengan database: dashboard dari data sungguhan. Tanpa database: tampilan demo (simulasi). */
export default function CaregiverDashboard() {
  return isSupabaseConfigured() ? <CaregiverDashboardLive /> : <CaregiverDashboardDemo />;
}

function CaregiverDashboardDemo() {
  const [elder] = useState(MOCK_ELDER);
  const [helpRequest, setHelpRequest] = useState(MOCK_HELP_REQUEST);
  const [followUps, setFollowUps] = useState<FollowUpAction[]>(INITIAL_FOLLOW_UPS);
  const [isFollowUpOpen, setIsFollowUpOpen] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  const handleSaveFollowUp = (newAction: Omit<FollowUpAction, "id" | "recordedAt">) => {
    const actionWithMeta: FollowUpAction = {
      ...newAction,
      id: `fu-${Date.now()}`,
      recordedAt: "Baru saja",
    };
    setFollowUps((prev) => [actionWithMeta, ...prev]);
    setSaveToast("Catatan tindak lanjut berhasil disimpan.");
    setTimeout(() => setSaveToast(null), 4000);
  };

  const handleResolveHelp = () => {
    setHelpRequest((prev) => ({ ...prev, status: "resolved" }));
    setSaveToast("Permintaan bantuan telah ditandai selesai.");
    setTimeout(() => setSaveToast(null), 4000);
  };

  const [latestExam, setLatestExam] = useState<ExaminationRecord>(MOCK_EXAMINATIONS[0]);
  const [elderStatus, setElderStatus] = useState<ResultStatus>(elder.status);
  const [elderSummary, setElderSummary] = useState<string>(elder.statusSummary);

  useEffect(() => {
    const handleSaved = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail) return;
      const status = (detail.p_result_status || "yellow") as ResultStatus;
      setElderStatus(status);
      setElderSummary(
        detail.p_reasons?.[0] || "Pemeriksaan terbaru telah selesai dicatat."
      );
      setLatestExam({
        id: detail.p_id || "exam-new",
        timestamp: detail.p_finished_at || new Date().toISOString(),
        dateFormatted: "Hari ini",
        timeFormatted:
          new Date(detail.p_finished_at || Date.now()).toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          }) + " WIB",
        mode: (detail.p_mode as "mandiri" | "caregiver") || "mandiri",
        status: status,
        headline:
          status === "green"
            ? "Kondisi stabil"
            : status === "yellow"
            ? "Perlu perhatian dan pemantauan"
            : status === "red"
            ? "Tanda bahaya terdeteksi"
            : "Data belum lengkap",
        summary: detail.p_reasons?.[0] || "Pemeriksaan selesai.",
        reasons: detail.p_reasons || [],
        answers: [],
      });
      setSaveToast("Pemeriksaan baru terdeteksi. Data dashboard diperbarui.");
      setTimeout(() => setSaveToast(null), 4000);
    };

    window.addEventListener("eldervital:examination_saved", handleSaved);
    return () => window.removeEventListener("eldervital:examination_saved", handleSaved);
  }, []);

  return (
    <div className="space-y-5 pb-12 max-w-2xl mx-auto px-1 sm:px-4">
      {/* Toast Notifikasi Feedback Cepat */}
      {saveToast && (
        <div
          role="status"
          className="rounded-2xl bg-primary text-white text-sm px-4 py-3 font-medium shadow-md flex items-center justify-between animate-in fade-in duration-200"
        >
          <span>{saveToast}</span>
          <button
            type="button"
            onClick={() => setSaveToast(null)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors ml-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label="Tutup notifikasi"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Profil Lansia Terhubung */}
      <CaregiverHeader elder={elder} />

      {/* Notifikasi Permintaan Bantuan Lansia (Bila Ada) */}
      <HelpRequestAlert
        request={helpRequest}
        onOpenFollowUp={() => setIsFollowUpOpen(true)}
        onResolve={handleResolveHelp}
      />

      {/* Kartu Status Utama Hari Ini */}
      <section
        aria-labelledby="status-hari-ini"
        className="rounded-2xl border border-line/60 bg-surface p-4 sm:p-6 space-y-4 shadow-none"
      >
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3.5">
            <StatusMark status={elderStatus} size="md" />
            <div>
              <div className="text-xs uppercase font-semibold text-ink-soft tracking-wider">
                Status Skrining Terkini
              </div>
              <h2 id="status-hari-ini" className="text-xl sm:text-2xl font-bold text-ink">
                {elderStatus === "green"
                  ? "Tidak Ada Pemicu Perhatian"
                  : elderStatus === "yellow"
                  ? "Perlu Perhatian & Pemantauan"
                  : elderStatus === "red"
                  ? "Tanda Bahaya Terdeteksi"
                  : "Data Belum Lengkap"}
              </h2>
              <p className="text-xs sm:text-sm text-ink-soft mt-0.5">
                Pemeriksaan terakhir: {latestExam.dateFormatted}, {latestExam.timeFormatted}.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsFollowUpOpen(true)}
              className="border-line text-ink bg-paper/60 hover:bg-paper rounded-full"
            >
              + Catat Tindak Lanjut
            </Button>
          </div>
        </div>

        <div
          className={`rounded-xl p-3.5 text-sm space-y-1 border ${
            elderStatus === "green"
              ? "bg-ok-bg/30 border-ok-mark/30 text-ok-ink"
              : elderStatus === "yellow"
              ? "bg-warn-bg/30 border-warn-mark/30 text-warn-ink"
              : elderStatus === "red"
              ? "bg-alert-bg/30 border-alert-mark/30 text-alert-ink"
              : "bg-paper border-line text-ink"
          }`}
        >
          <p className="font-semibold">Temuan Utama:</p>
          <p className="text-xs sm:text-sm">{elderSummary}</p>
        </div>

        {/* Panel Tombol Aksi Cepat Caregiver */}
        <div className="pt-2">
          <Link
            href="/caregiver/periksa"
            className="flex items-center justify-between px-4 py-3 rounded-full border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors text-primary font-bold text-sm min-h-[44px]"
          >
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary" />
              <span>Pemeriksaan Bersama Lansia</span>
            </span>
            <ChevronRightIcon className="h-4 w-4 shrink-0" />
          </Link>
        </div>
      </section>

      {/* Signal Grid Tren 7 Hari */}
      <SignalGrid days={MOCK_SIGNAL_DAYS} />

      {/* Bagian Riwayat Tindak Lanjut & Pemeriksaan Terakhir */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Riwayat Catatan Tindak Lanjut */}
        <FollowUpList followUps={followUps} />

        {/* Ringkasan Pemeriksaan Terakhir */}
        <section
          aria-labelledby="pemeriksaan-terakhir"
          className="rounded-2xl border border-line/60 bg-surface p-4 sm:p-5 space-y-3"
        >
          <div className="flex items-center justify-between">
            <h2 id="pemeriksaan-terakhir" className="text-base font-bold text-ink">
              Rincian Pemeriksaan Terakhir
            </h2>
            <span className="text-xs text-ink-soft">{latestExam.timeFormatted}</span>
          </div>

          <div className="rounded-lg border border-line bg-paper/50 p-3.5 space-y-2">
            <div className="flex items-center gap-2">
              <StatusMark status={latestExam.status} size="sm" />
              <span className="text-sm font-bold text-ink">{latestExam.headline}</span>
            </div>
            <p className="text-xs text-ink-soft">{latestExam.summary}</p>
            <ul className="text-xs text-ink-soft space-y-1 list-disc list-inside pt-1">
              {latestExam.reasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>

          <div className="pt-1">
            <Link
              href="/caregiver/riwayat"
              className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1 min-h-[44px]"
            >
              <span>Lihat seluruh daftar riwayat</span>
              <ChevronRightIcon className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>
      </div>

      {/* Modal Dialog Tindak Lanjut */}
      <FollowUpDialog
        isOpen={isFollowUpOpen}
        onClose={() => setIsFollowUpOpen(false)}
        onSave={handleSaveFollowUp}
        elderName={elder.name}
      />
    </div>
  );
}
