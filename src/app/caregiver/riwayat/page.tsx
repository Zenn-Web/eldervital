"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { MOCK_EXAMINATIONS } from "@/modules/caregiver/mockData";
import type { ExaminationRecord } from "@/modules/caregiver/types";
import type { ResultStatus } from "@/lib/screening";
import StatusMark from "@/components/StatusMark";
import { Badge } from "@/components/ui/badge";

type FilterStatus = "all" | "attention" | "stable";

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
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [savedExams, setSavedExams] = useState<ExaminationRecord[]>([]);

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
              ? "Kondisi stabil"
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
    return [...savedExams, ...MOCK_EXAMINATIONS];
  }, [savedExams]);

  const filteredExams = allExams.filter((exam) => {
    if (filter === "attention") return exam.status === "yellow" || exam.status === "red";
    if (filter === "stable") return exam.status === "green";
    return true;
  });

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto px-1 sm:px-4">
      {/* Navigasi Balik */}
      <div className="flex items-center justify-between">
        <Link
          href="/caregiver"
          className="text-xs sm:text-sm font-semibold text-primary hover:underline inline-flex items-center gap-1.5"
        >
          &larr; Kembali ke Beranda Caregiver
        </Link>
        <span className="text-xs text-ink-soft">
          Menampilkan {filteredExams.length} dari {allExams.length} catatan
        </span>
      </div>

      <header className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-ink">
          Riwayat Pemeriksaan Lansia
        </h1>
        <p className="text-xs sm:text-sm text-ink-soft">
          Daftar hasil skrining berkala Ibu Sari Rahayu, alasan klinis, dan detail jawaban tanya-jawab.
        </p>
      </header>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-line pb-3 overflow-x-auto">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`px-3.5 py-1.5 text-xs sm:text-sm rounded-lg font-medium transition-colors ${
            filter === "all"
              ? "bg-primary text-white font-bold"
              : "bg-surface text-ink-soft hover:bg-paper border border-line"
          }`}
        >
          Semua ({allExams.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter("attention")}
          className={`px-3.5 py-1.5 text-xs sm:text-sm rounded-lg font-medium transition-colors ${
            filter === "attention"
              ? "bg-warn-mark text-white font-bold"
              : "bg-surface text-ink-soft hover:bg-paper border border-line"
          }`}
        >
          Perlu Perhatian (
          {allExams.filter((e) => e.status === "yellow" || e.status === "red").length}
          )
        </button>
        <button
          type="button"
          onClick={() => setFilter("stable")}
          className={`px-3.5 py-1.5 text-xs sm:text-sm rounded-lg font-medium transition-colors ${
            filter === "stable"
              ? "bg-ok-mark text-white font-bold"
              : "bg-surface text-ink-soft hover:bg-paper border border-line"
          }`}
        >
          Stabil (
          {allExams.filter((e) => e.status === "green").length}
          )
        </button>
      </div>

      {/* Daftar Catatan Riwayat */}
      <div className="space-y-4">
        {filteredExams.length === 0 ? (
          <div className="rounded-xl border border-line bg-surface p-8 text-center text-ink-soft text-sm">
            Tidak ada pemeriksaan pada kategori ini.
          </div>
        ) : (
          filteredExams.map((exam) => {
            const isExpanded = expandedId === exam.id;
            return (
              <article
                key={exam.id}
                className="rounded-xl border border-line bg-surface p-4 sm:p-5 space-y-3.5 shadow-none"
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
                    className="text-xs sm:text-sm font-semibold text-primary hover:underline inline-flex items-center gap-1.5"
                  >
                    <span>
                      {isExpanded ? "Tutup Rincian Tanya-Jawab" : "Lihat Rincian Jawaban Lengkap"}
                    </span>
                    <span aria-hidden="true">{isExpanded ? "&uarr;" : "&darr;"}</span>
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
                                Aman
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
    </div>
  );
}
