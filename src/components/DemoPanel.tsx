"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { DEMO_HISTORY_EVENT, DEMO_HISTORY_KEY } from "@/lib/demo-history";
import { Button } from "@/components/ui/button";
import { SlidersIcon, CloseIcon } from "@/components/shared/Icons";

export default function DemoPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const isConfigured = isSupabaseConfigured();
  // Jumlah catatan di riwayat demo lokal (simulasi). Antrean penyimpanan sungguhan
  // dikelola @/lib/exam/outbox dan tidak ditampilkan di panel ini.
  const [demoCount, setDemoCount] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const handleUpdate = () => {
      try {
        const list = JSON.parse(localStorage.getItem(DEMO_HISTORY_KEY) ?? "[]");
        setDemoCount(Array.isArray(list) ? list.length : 0);
      } catch {
        setDemoCount(0);
      }
    };
    handleUpdate();
    window.addEventListener(DEMO_HISTORY_EVENT, handleUpdate);
    return () => window.removeEventListener(DEMO_HISTORY_EVENT, handleUpdate);
  }, []);

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const simulateScenario = (scenario: "green" | "yellow" | "red" | "insufficient") => {
    const labels = {
      green: "Skenario Hijau (Stabil - Semua Normal)",
      yellow: "Skenario Kuning (Perlu Pemantauan - Batuk > 3 Hari)",
      red: "Skenario Merah (Tanda Bahaya - Nyeri Dada Interupsi)",
      insufficient: "Skenario Data Tidak Cukup (Jawaban Ragu)",
    };

    const simulatedRecord = {
      p_id: `demo-${scenario}-${Date.now()}`,
      p_elder_id: "00000000-0000-0000-0000-000000000001",
      p_mode: "mandiri",
      p_tree_id: "tree.v1",
      p_tree_version: "1.0.0",
      p_started_at: new Date(Date.now() - 120000).toISOString(),
      p_finished_at: new Date().toISOString(),
      p_status: scenario === "red" ? "terhenti" : "selesai",
      p_result_status: scenario,
      p_reasons:
        scenario === "red"
          ? ["Ditemukan tanda bahaya nyeri dada hebat."]
          : scenario === "yellow"
          ? ["Batuk berlangsung lebih dari 3 hari."]
          : scenario === "green"
          ? ["Pemeriksaan normal tanpa keluhan."]
          : ["Data tidak cukup karena jawaban penting belum diketahui."],
      p_actions: [
        scenario === "red"
          ? "Segera hubungi 112 atau 119."
          : "Pantau gejala dan istirahat cukup.",
      ],
      p_interrupted: scenario === "red",
      p_is_simulated: true,
      p_answers: [],
    };

    try {
      const raw = localStorage.getItem(DEMO_HISTORY_KEY);
      const list = raw ? JSON.parse(raw) : [];
      list.unshift(simulatedRecord);
      localStorage.setItem(DEMO_HISTORY_KEY, JSON.stringify(list));
      window.dispatchEvent(
        new CustomEvent(DEMO_HISTORY_EVENT, { detail: simulatedRecord })
      );
      triggerToast(`${labels[scenario]} berhasil disimulasikan.`);
    } catch {
      triggerToast("Gagal menyimpan simulasi.");
    }
  };

  const clearDemoData = () => {
    try {
      localStorage.removeItem(DEMO_HISTORY_KEY);
      setDemoCount(0);
      triggerToast("Penyimpanan simulasi lokal dibersihkan.");
    } catch {
      // ignore
    }
  };

  return (
    <aside
      aria-label="Panel Pintas Demo Juri"
      className="fixed bottom-20 md:bottom-4 right-4 z-40 select-none text-xs"
    >
      {/* Toast Feedback */}
      {toast && (
        <div className="mb-2 p-2.5 rounded-lg bg-ink text-white font-medium shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-150">
          {toast}
        </div>
      )}

      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-2.5 text-ink shadow-md hover:bg-paper transition-all min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          title="Buka Panel Pintas Demo"
        >
          <SlidersIcon className="h-4 w-4 text-primary" />
          <span className="font-bold text-xs">Pintas Demo</span>
          {demoCount > 0 && (
            <span className="h-2 w-2 rounded-full bg-alert-mark" />
          )}
        </button>
      )}

      {/* Expanded Modal / Drawer */}
      {isOpen && (
        <div className="w-80 rounded-2xl border border-primary/30 bg-surface p-4 shadow-2xl space-y-3.5 animate-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-line/60 pb-2">
            <div className="flex items-center gap-1.5">
              <SlidersIcon className="h-4 w-4 text-primary" />
              <strong className="text-sm font-bold text-ink">Pintas Demo 5 Menit</strong>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-ink-soft hover:bg-paper hover:text-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              aria-label="Tutup panel"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          </div>

          {/* Status Database */}
          <div className="rounded-xl bg-paper p-2.5 text-[11px] space-y-1 border border-line/60">
            <div className="flex items-center justify-between">
              <span className="text-ink-soft">Status Database:</span>
              <span
                className={`font-bold px-2 py-0.5 rounded-full ${
                  isConfigured
                    ? "bg-ok-bg text-ok-ink"
                    : "bg-warn-bg text-warn-ink"
                }`}
              >
                {isConfigured ? "Supabase Aktif" : "Prototipe Lokal"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-ink-soft">Riwayat demo (simulasi):</span>
              <span className="font-semibold text-ink">
                {demoCount} catatan
              </span>
            </div>
          </div>

          {/* Navigasi Cepat Antar Layar */}
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-ink-soft uppercase tracking-wider">
              Navigasi Layar (Demo Alur)
            </span>
            <div className="grid grid-cols-2 gap-1.5 pt-0.5">
              <Link
                href="/"
                className="p-1.5 rounded-md border border-line bg-paper/60 hover:bg-paper text-center font-medium text-ink"
              >
                Onboarding (01)
              </Link>
              <Link
                href="/lansia"
                className="p-1.5 rounded-md border border-line bg-paper/60 hover:bg-paper text-center font-medium text-ink"
              >
                Beranda Lansia (07)
              </Link>
              <Link
                href="/lansia/periksa"
                className="p-1.5 rounded-md border border-primary/20 bg-primary/5 hover:bg-primary/10 text-center font-bold text-primary"
              >
                Cek Mandiri (08)
              </Link>
              <Link
                href="/caregiver"
                className="p-1.5 rounded-md border border-primary/20 bg-primary/5 hover:bg-primary/10 text-center font-bold text-primary"
              >
                Dashboard CG (10)
              </Link>
              <Link
                href="/caregiver/riwayat"
                className="p-1.5 rounded-md border border-line bg-paper/60 hover:bg-paper text-center font-medium text-ink"
              >
                Riwayat CG (12)
              </Link>
              <Link
                href="/caregiver/periksa"
                className="p-1.5 rounded-md border border-line bg-paper/60 hover:bg-paper text-center font-medium text-ink"
              >
                Cek Bersama (11)
              </Link>
            </div>
          </div>

          {/* Skenario Klinis Instan */}
          <div className="space-y-1 pt-1 border-t border-line/60">
            <span className="text-[11px] font-bold text-ink-soft uppercase tracking-wider">
              Simulasi Skenario Klinis
            </span>
            <div className="grid grid-cols-2 gap-1.5 pt-0.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => simulateScenario("green")}
                className="text-[11px] h-8 justify-start text-ok-ink hover:bg-ok-bg/50 border-ok-mark/30"
              >
                <span className="h-2 w-2 rounded-full bg-ok-mark shrink-0 mr-1.5" aria-hidden="true" />
                Normal (Hijau)
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => simulateScenario("yellow")}
                className="text-[11px] h-8 justify-start text-warn-ink hover:bg-warn-bg/50 border-warn-mark/30"
              >
                <span className="h-2 w-2 rounded-sm bg-warn-mark shrink-0 mr-1.5" aria-hidden="true" />
                Batuk (Kuning)
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => simulateScenario("red")}
                className="text-[11px] h-8 justify-start text-alert-ink hover:bg-alert-bg/50 border-alert-mark/30"
              >
                <span className="h-2 w-2 rounded-full bg-alert-mark shrink-0 mr-1.5" aria-hidden="true" />
                Darurat (Merah)
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => simulateScenario("insufficient")}
                className="text-[11px] h-8 justify-start text-ink-soft hover:bg-paper border-line"
              >
                <span className="h-2 w-2 rounded-full border border-dashed border-ink-soft shrink-0 mr-1.5" aria-hidden="true" />
                Ragu (Insuf.)
              </Button>
            </div>
          </div>

          {/* Reset / Bersihkan */}
          <div className="pt-1 border-t border-line/60 flex items-center justify-between">
            <button
              type="button"
              onClick={clearDemoData}
              className="text-[10px] text-ink-soft hover:text-alert-ink underline"
            >
              Reset Data Demo
            </button>
            <span className="text-[10px] text-ink-soft italic">
              ElderVital Hackathon 2026
            </span>
          </div>
        </div>
      )}
    </aside>
  );
}
