"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { MOCK_EXAMINATIONS } from "@/modules/caregiver/mockData";
import type { ExaminationRecord } from "@/modules/caregiver/types";
import { treeV1, type ResultStatus } from "@/lib/screening";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { errorMessage } from "@/lib/supabase/errors";
import { listExaminationDetails, type ExaminationDetail } from "@/lib/exam/history";
import { STATUS_HEADLINE } from "@/modules/caregiver/DashboardLive";

/** Pemeriksaan dari database ke bentuk yang dipakai tampilan riwayat. */
function toRecord(x: ExaminationDetail): ExaminationRecord {
  const at = x.finishedAt ?? x.startedAt;
  const status = x.resultStatus ?? "insufficient";
  const flagged = new Map(x.reasons.map((r) => [r.nodeId, r.level]));
  return {
    id: x.id,
    timestamp: at,
    dateFormatted: new Date(at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }),
    timeFormatted: new Date(at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB",
    mode: x.mode,
    status,
    headline: STATUS_HEADLINE[status],
    summary:
      x.reasons[0]?.text ??
      (status === "insufficient"
        ? "Ada pertanyaan penting yang belum diketahui jawabannya, atau pemeriksaan belum selesai."
        : "Tidak ada aturan perhatian yang terpicu."),
    reasons: x.reasons.map((r) => r.text),
    answers: x.answers.map((a) => ({
      nodeId: a.questionId,
      topic: treeV1.nodes[a.questionId]?.topic ?? "Pemeriksaan",
      // Teks pertanyaan hanya dari pohon versi yang sama; bila tidak ada, tampilkan id-nya.
      question: a.question ?? a.questionId,
      answerText: a.isUnknown ? "Belum diketahui" : a.label,
      flag: flagged.get(a.questionId) === "red" ? "alert" : flagged.get(a.questionId) || a.isUnknown ? "warn" : "ok",
    })),
  };
}
import StatusMark from "@/components/StatusMark";
import { Badge } from "@/components/ui/badge";
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon, CloseIcon } from "@/components/shared/Icons";
import { DateRangePicker, formatReadableDateID } from "@/components/ui/date-picker";

type FilterStatus = "all" | "attention" | "stable";
type PeriodFilter = "all" | "today" | "7days" | "30days" | "custom";

interface RawSavedRecord {
  p_id: string;
  p_finished_at: string;
  p_mode: "mandiri" | "caregiver";
  p_result_status: ResultStatus;
  p_reasons: string[];
  p_actions: string[];
  p_answers?: Array<{
    position: number;
    question_id: string;
    value: string;
    label: string;
    source: string;
    is_unknown: boolean;
    answered_at: string;
  }>;
}

export default function CaregiverHistoryPage() {
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("all");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [savedExams, setSavedExams] = useState<ExaminationRecord[]>([]);
  // Dengan database: riwayat sungguhan (RLS menentukan pemeriksaan mana yang boleh dilihat).
  const configured = isSupabaseConfigured();
  const [liveExams, setLiveExams] = useState<ExaminationRecord[] | null>(null);
  const [liveError, setLiveError] = useState<string | null>(null);

  useEffect(() => {
    if (!configured) return;
    let alive = true;
    listExaminationDetails("caregiver", { limit: 100 })
      .then((list) => alive && setLiveExams(list.map(toRecord)))
      .catch((e) => alive && setLiveError(errorMessage(e)));
    return () => {
      alive = false;
    };
  }, [configured]);

  useEffect(() => {
    function loadSaved() {
      if (typeof window === "undefined") return;
      try {
        const raw = localStorage.getItem("eldervital_saved_examinations");
        if (!raw) return;
        const parsed: RawSavedRecord[] = JSON.parse(raw);
        if (!Array.isArray(parsed)) return;

        const converted: ExaminationRecord[] = parsed.map((item) => ({
          id: item.p_id,
          timestamp: item.p_finished_at,
          dateFormatted: new Date(item.p_finished_at).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
          timeFormatted:
            new Date(item.p_finished_at).toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
            }) + " WIB",
          mode: item.p_mode || "mandiri",
          status: item.p_result_status || "green",
          headline:
            item.p_result_status === "green"
              ? "Tidak ada pemicu perhatian"
              : item.p_result_status === "yellow"
              ? "Perlu perhatian dan pemantauan"
              : item.p_result_status === "red"
              ? "Tanda bahaya terdeteksi"
              : "Data belum lengkap",
          summary: item.p_reasons?.[0] || "Pemeriksaan selesai.",
          reasons: item.p_reasons || [],
          answers: (item.p_answers || []).map((a) => ({
            nodeId: a.question_id,
            topic: "Pemeriksaan",
            question: `Pertanyaan #${a.position} (${a.question_id})`,
            answerText: a.label || a.value,
            flag: a.is_unknown ? "warn" : "ok",
          })),
        }));

        setSavedExams(converted);
      } catch {
        // ignore
      }
    }

    loadSaved();
    window.addEventListener("eldervital:examination_saved", loadSaved);
    return () => window.removeEventListener("eldervital:examination_saved", loadSaved);
  }, []);

  const allExams = useMemo(() => {
    if (configured) return liveExams ?? [];
    return [...savedExams, ...MOCK_EXAMINATIONS];
  }, [configured, liveExams, savedExams]);

  const filteredExams = useMemo(() => {
    return allExams.filter((exam) => {
      // 1. Status Filter
      if (filter === "attention" && !(exam.status === "yellow" || exam.status === "red")) {
        return false;
      }
      if (filter === "stable" && exam.status !== "green") {
        return false;
      }

      // 2. Period Filter
      if (periodFilter === "all") return true;

      const examDate = exam.timestamp ? exam.timestamp.slice(0, 10) : "";

      if (periodFilter === "today") {
        return (
          examDate === "2026-10-15" ||
          exam.dateFormatted.toLowerCase().includes("hari ini")
        );
      }

      if (periodFilter === "7days") {
        return examDate >= "2026-10-09";
      }

      if (periodFilter === "30days") {
        return examDate >= "2026-09-15";
      }

      if (periodFilter === "custom") {
        if (customStartDate && examDate < customStartDate) return false;
        if (customEndDate && examDate > customEndDate) return false;
        return true;
      }

      return true;
    });
  }, [allExams, filter, periodFilter, customStartDate, customEndDate]);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleApplyCustomRange = (start: string, end: string) => {
    setCustomStartDate(start);
    setCustomEndDate(end);
    if (start || end) {
      setPeriodFilter("custom");
    } else {
      setPeriodFilter("all");
    }
  };

  return (
    <div className="space-y-5 pb-12 max-w-2xl mx-auto px-1 sm:px-4">
      {/* Navigasi Balik */}
      <div className="flex items-center justify-between">
        <Link
          href="/caregiver"
          className="text-xs sm:text-sm font-semibold text-primary hover:underline inline-flex items-center gap-1.5 min-h-[44px]"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          <span>Kembali ke Beranda</span>
        </Link>
        <span className="text-xs text-ink-soft">
          {filteredExams.length} / {allExams.length} catatan
        </span>
      </div>

      <header className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-ink font-serif">
          Riwayat Pemeriksaan
        </h1>
        <p className="text-xs sm:text-sm text-ink-soft">
          {configured
            ? "Daftar hasil skrining lansia yang terhubung, beserta alasan dan detail jawaban."
            : "Daftar hasil skrining berkala Ibu Sari Rahayu beserta alasan klinis dan detail jawaban."}
        </p>
        {/* Wajib (aturan proyek): data demo diberi label simulasi. Hapus setelah halaman ini
            membaca listExaminations dari @/lib/exam/history. */}
        {configured ? (
          <>
            <p className="text-xs sm:text-sm text-ink-soft">
              Hanya pemeriksaan yang diizinkan lansia untuk Anda lihat, ditambah pemeriksaan yang Anda catat sendiri.
            </p>
            {liveError && (
              <p role="alert" className="rounded-xl bg-alert-bg text-alert-ink px-3 py-2 text-sm font-bold">
                Riwayat belum bisa dimuat. {liveError}
              </p>
            )}
            {liveExams === null && !liveError && (
              <p role="status" className="text-sm text-ink-soft">Memuat riwayat...</p>
            )}
          </>
        ) : (
          <p className="rounded-xl bg-warn-bg text-warn-ink px-3 py-2 text-xs sm:text-sm font-bold">
            Simulasi: riwayat ini data demo di perangkat ini, belum dibaca dari database.
          </p>
        )}
      </header>

      {/* Filter Tabs — Status & Periode */}
      <div className="space-y-2.5">
        {/* Status Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`px-4 py-2 text-xs sm:text-sm rounded-full font-medium transition-colors min-h-[40px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus whitespace-nowrap ${
              filter === "all"
                ? "bg-primary text-white font-bold shadow-xs"
                : "bg-surface text-ink-soft hover:bg-paper border border-line/60"
            }`}
          >
            Semua Status ({allExams.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("attention")}
            className={`px-4 py-2 text-xs sm:text-sm rounded-full font-medium transition-colors min-h-[40px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus whitespace-nowrap ${
              filter === "attention"
                ? "bg-warn-mark text-white font-bold shadow-xs"
                : "bg-surface text-ink-soft hover:bg-paper border border-line/60"
            }`}
          >
            Perlu Perhatian (
            {allExams.filter((e) => e.status === "yellow" || e.status === "red").length}
            )
          </button>
          <button
            type="button"
            onClick={() => setFilter("stable")}
            className={`px-4 py-2 text-xs sm:text-sm rounded-full font-medium transition-colors min-h-[40px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus whitespace-nowrap ${
              filter === "stable"
                ? "bg-ok-mark text-white font-bold shadow-xs"
                : "bg-surface text-ink-soft hover:bg-paper border border-line/60"
            }`}
          >
            Stabil (
            {allExams.filter((e) => e.status === "green").length}
            )
          </button>
        </div>

        {/* Period Filter Bar with DateRangePicker trigger */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
          <button
            type="button"
            onClick={() => setPeriodFilter("all")}
            className={`px-3 py-1.5 text-xs rounded-full font-medium transition-colors min-h-[36px] whitespace-nowrap ${
              periodFilter === "all"
                ? "bg-ink text-white font-bold shadow-xs"
                : "bg-paper text-ink-soft hover:bg-surface border border-line/60"
            }`}
          >
            Semua Waktu
          </button>
          <button
            type="button"
            onClick={() => setPeriodFilter("today")}
            className={`px-3 py-1.5 text-xs rounded-full font-medium transition-colors min-h-[36px] whitespace-nowrap ${
              periodFilter === "today"
                ? "bg-ink text-white font-bold shadow-xs"
                : "bg-paper text-ink-soft hover:bg-surface border border-line/60"
            }`}
          >
            Hari Ini
          </button>
          <button
            type="button"
            onClick={() => setPeriodFilter("7days")}
            className={`px-3 py-1.5 text-xs rounded-full font-medium transition-colors min-h-[36px] whitespace-nowrap ${
              periodFilter === "7days"
                ? "bg-ink text-white font-bold shadow-xs"
                : "bg-paper text-ink-soft hover:bg-surface border border-line/60"
            }`}
          >
            7 Hari Terakhir
          </button>
          <button
            type="button"
            onClick={() => setPeriodFilter("30days")}
            className={`px-3 py-1.5 text-xs rounded-full font-medium transition-colors min-h-[36px] whitespace-nowrap ${
              periodFilter === "30days"
                ? "bg-ink text-white font-bold shadow-xs"
                : "bg-paper text-ink-soft hover:bg-surface border border-line/60"
            }`}
          >
            30 Hari Terakhir
          </button>
          <button
            type="button"
            onClick={() => setIsDatePickerOpen(true)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full font-medium transition-colors min-h-[36px] whitespace-nowrap border ${
              periodFilter === "custom"
                ? "bg-primary text-white border-primary font-bold shadow-xs"
                : "bg-surface text-primary border-primary/30 hover:bg-primary/5"
            }`}
          >
            <CalendarIcon size={14} />
            <span>
              {periodFilter === "custom" && (customStartDate || customEndDate)
                ? `${formatReadableDateID(customStartDate)} - ${formatReadableDateID(customEndDate)}`
                : "Rentang Tanggal..."}
            </span>
          </button>
        </div>

        {/* Active Custom Filter Badge with quick reset */}
        {periodFilter === "custom" && (customStartDate || customEndDate) && (
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-primary/5 border border-primary/20 text-xs text-primary font-medium animate-in fade-in duration-150">
            <span>
              Menampilkan filter rentang:{" "}
              <strong>
                {customStartDate ? formatReadableDateID(customStartDate) : "Awal"} s/d{" "}
                {customEndDate ? formatReadableDateID(customEndDate) : "Sekarang"}
              </strong>
            </span>
            <button
              type="button"
              onClick={() => {
                setPeriodFilter("all");
                setCustomStartDate("");
                setCustomEndDate("");
              }}
              className="hover:underline flex items-center gap-1 text-ink-soft hover:text-ink font-semibold ml-2"
            >
              <span>Reset</span>
              <CloseIcon size={12} />
            </button>
          </div>
        )}
      </div>

      {/* Daftar Catatan Riwayat */}
      <div className="space-y-4">
        {filteredExams.length === 0 ? (
          <div className="rounded-2xl border border-line/60 bg-surface p-8 text-center text-ink-soft text-sm">
            Tidak ada pemeriksaan pada kategori ini.
          </div>
        ) : (
          filteredExams.map((exam) => {
            const isExpanded = expandedId === exam.id;
            return (
              <article
                key={exam.id}
                className="rounded-2xl border border-line/60 bg-surface p-4 sm:p-5 space-y-3.5 shadow-none"
              >
                {/* Baris Atas: Tanggal, Waktu, & Mode */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-line/60 pb-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-ink text-sm sm:text-base">
                      {exam.dateFormatted} &bull; {exam.timeFormatted}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {exam.mode === "mandiri" ? "Cek Mandiri (Lansia)" : "Didampingi Caregiver"}
                    </Badge>
                  </div>
                  <Badge
                    variant={
                      exam.status === "green"
                        ? "ok"
                        : exam.status === "yellow"
                        ? "warn"
                        : "alert"
                    }
                    className="self-start sm:self-auto text-xs"
                  >
                    {exam.status === "green"
                      ? "Stabil"
                      : exam.status === "yellow"
                      ? "Perlu Perhatian"
                      : "Tanda Bahaya"}
                  </Badge>
                </div>

                {/* Ringkasan & Alasan */}
                <div className="flex items-start gap-3">
                  <StatusMark status={exam.status} size="sm" className="mt-0.5" />
                  <div className="space-y-1.5 flex-1">
                    <h2 className="text-base font-bold text-ink">{exam.headline}</h2>
                    <p className="text-xs sm:text-sm text-ink-soft">{exam.summary}</p>

                    {exam.reasons.length > 0 && (
                      <div className="pt-1">
                        <span className="text-xs font-semibold text-ink">Alasan Klinis:</span>
                        <ul className="text-xs text-ink-soft space-y-0.5 list-disc list-inside mt-0.5">
                          {exam.reasons.map((r, i) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tombol Ekspansi Jawaban Lengkap (Frame 12b) */}
                <div className="pt-2 border-t border-line/60 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => toggleExpand(exam.id)}
                    className="text-xs sm:text-sm font-semibold text-primary hover:underline inline-flex items-center gap-1.5 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus rounded-md px-1"
                  >
                    <span>
                      {isExpanded ? "Tutup Rincian Tanya-Jawab" : "Lihat Rincian Jawaban Lengkap"}
                    </span>
                    <ChevronRightIcon
                      className={`h-4 w-4 transition-transform duration-150 ${
                        isExpanded ? "-rotate-90" : "rotate-90"
                      }`}
                    />
                  </button>
                  <span className="text-[11px] text-ink-soft">
                    {exam.answers.length} pertanyaan tercatat
                  </span>
                </div>

                {/* Rincian Tanya-Jawab (Frame 12b) */}
                {isExpanded && (
                  <div className="mt-3 rounded-lg border border-line bg-paper/60 p-3.5 space-y-3 animate-in fade-in duration-150">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-ink-soft border-b border-line pb-1.5">
                      Rincian Pertanyaan & Jawaban Lansia
                    </h3>
                    <div className="space-y-2.5">
                      {exam.answers.map((ans, idx) => (
                        <div
                          key={idx}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-2 rounded-md bg-surface border border-line/60 text-xs"
                        >
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-ink-soft uppercase font-semibold">
                              {ans.topic}
                            </span>
                            <div className="text-xs font-medium text-ink">{ans.question}</div>
                          </div>
                          <div className="flex items-center gap-1.5 self-start sm:self-auto shrink-0">
                            <span className="font-bold text-ink">{ans.answerText}</span>
                            {ans.flag === "warn" && (
                              <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-warn-bg text-warn-ink border border-warn-mark/30">
                                Gejala
                              </span>
                            )}
                            {ans.flag === "alert" && (
                              <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-alert-bg text-alert-ink border border-alert-mark/30">
                                Bahaya
                              </span>
                            )}
                            {ans.flag === "ok" && (
                              <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-ok-bg text-ok-ink">
                                Tanpa pemicu
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>

      {/* Date Range Picker Modal */}
      <DateRangePicker
        isOpen={isDatePickerOpen}
        onClose={() => setIsDatePickerOpen(false)}
        onApply={handleApplyCustomRange}
        initialStart={customStartDate}
        initialEnd={customEndDate}
        title="Filter Rentang Riwayat"
      />
    </div>
  );
}
