"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { HandshakeIcon, ClockIcon, ChevronRightIcon } from "@/components/shared/Icons";
import { useElderSession } from "@/components/session/ElderSession";
import { cancelHelpRequest, createHelpRequest, useHelpRequests } from "@/lib/help";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { errorMessage } from "@/lib/supabase/errors";

/** Dengan database: permintaan bantuan sungguhan (realtime). Tanpa database: simulasi. */
export default function RequestHelp() {
  return isSupabaseConfigured() ? <RequestHelpLive /> : <RequestHelpDemo />;
}

const HELP_BUTTON =
  "w-full text-lg sm:text-xl font-bold rounded-full min-h-[56px] flex items-center justify-center gap-3 border border-line/60 hover:border-primary active:border-primary bg-surface transition-all shadow-xs";

/**
 * Permintaan bantuan sungguhan: tersimpan di help_requests dan tampil realtime di dashboard
 * caregiver yang terhubung. Status di sini ikut berubah saat caregiver menanggapi.
 */
function RequestHelpLive() {
  const { profile } = useElderSession();
  const { requests, refresh } = useHelpRequests("lansia", Boolean(profile));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const current = requests?.find((r) => r.elderId === profile?.id) ?? null;

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      refresh();
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

  if (!current) {
    return (
      <div className="space-y-2">
        <Button
          type="button"
          variant="outline"
          size="senior"
          disabled={busy || !profile}
          onClick={() => profile && run(() => createHelpRequest(profile.id))}
          className={HELP_BUTTON}
        >
          <HandshakeIcon size={22} className="text-sogan" />
          <span>{busy ? "Mengirim..." : "Minta Didampingi Caregiver"}</span>
        </Button>
        {errorBox}
      </div>
    );
  }

  return (
    <div className="p-5 sm:p-6 border border-sogan/40 bg-surface rounded-2xl space-y-4 shadow-none" role="status" aria-live="polite">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-sogan/15 text-sogan flex items-center justify-center shrink-0 border border-sogan/30">
          <ClockIcon size={24} />
        </div>
        <div className="space-y-1">
          <h3 className="font-serif text-xl sm:text-2xl font-bold text-ink">
            {current.status === "taken"
              ? `${current.takenByName ?? "Caregiver"} sedang menanggapi`
              : "Permintaan terkirim"}
          </h3>
          <p className="text-sm sm:text-base text-ink-soft leading-normal">
            {current.status === "taken"
              ? "Caregiver sudah melihat permintaan Anda dan akan mendampingi pemeriksaan."
              : "Permintaan tampil di aplikasi caregiver yang terhubung. Halaman ini berubah saat caregiver menanggapi."}
          </p>
        </div>
      </div>

      <div className="p-3.5 bg-paper rounded-xl border border-line/60 text-xs sm:text-sm text-ink-soft">
        <strong>Pemberitahuan:</strong> Aplikasi tidak bisa memastikan caregiver langsung melihat permintaan ini. Dalam
        keadaan darurat, segera hubungi <strong>112</strong> atau <strong>119</strong>.
      </div>
      {errorBox}

      <button
        type="button"
        disabled={busy}
        onClick={() => run(() => cancelHelpRequest(current.id))}
        className="w-full min-h-[48px] text-sm sm:text-base font-bold text-ink-soft hover:text-ink rounded-full transition-colors"
      >
        Batalkan permintaan
      </button>
    </div>
  );
}

/** Mode "Minta caregiver" (Frame 07 & 07b), versi simulasi tanpa database. */
function RequestHelpDemo() {
  const [sent, setSent] = useState(false);

  if (!sent) {
    return (
      <Button
        type="button"
        variant="outline"
        size="senior"
        onClick={() => setSent(true)}
        className="w-full text-lg sm:text-xl font-bold rounded-full min-h-[56px] flex items-center justify-center gap-3 border border-line/60 hover:border-primary active:border-primary bg-surface transition-all shadow-xs"
      >
        <HandshakeIcon size={22} className="text-sogan" />
        <span>Minta Didampingi Caregiver</span>
      </Button>
    );
  }

  // Frame 07b: Layar Tunggu Minta Caregiver
  return (
    <div className="p-5 sm:p-6 border border-sogan/40 bg-surface rounded-2xl space-y-4 shadow-none" role="status">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-sogan/15 text-sogan flex items-center justify-center shrink-0 border border-sogan/30">
          <ClockIcon size={24} />
        </div>
        <div className="space-y-1">
          <h3 className="font-serif text-xl sm:text-2xl font-bold text-ink">
            Permintaan Terkirim ke Rina (simulasi)
          </h3>
          <p className="text-sm sm:text-base text-ink-soft leading-normal">
            Silakan tunggu sebentar, keluarga akan membuka aplikasi dan mendampingi Anda mengisi jawaban.
          </p>
        </div>
      </div>

      <div className="p-3.5 bg-paper rounded-xl border border-line/60 text-xs sm:text-sm text-ink-soft">
        <strong>Pemberitahuan:</strong> Aplikasi tidak bisa menjamin caregiver langsung membaca pesan. Dalam keadaan darurat, segera hubungi <strong>112</strong> atau <strong>119</strong>.
      </div>

      <div className="flex flex-col gap-2.5 pt-2">
        <Link
          className="w-full min-h-[48px] px-5 py-3 rounded-full bg-primary text-white font-bold text-center flex items-center justify-center gap-1.5 text-base sm:text-lg hover:bg-primary-strong transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-focus"
          href="/caregiver/periksa"
        >
          <span>Buka Tampilan Caregiver (Demo)</span>
          <ChevronRightIcon size={18} />
        </Link>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="w-full min-h-[40px] text-sm font-bold text-ink-soft hover:text-ink rounded-full transition-colors"
        >
          Batalkan & Cek Mandiri Saja
        </button>
      </div>
    </div>
  );
}
