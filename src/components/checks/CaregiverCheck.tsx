"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ScreeningFlow from "@/components/ScreeningFlow";
import { useCaregiverSession } from "@/components/session/CaregiverSession";
import { Notice, PRIMARY } from "@/components/session/ElderSession";
import { listCaregiverLinks, type CaregiverLink } from "@/lib/pairing";
import { errorMessage } from "@/lib/supabase/errors";

/**
 * Pemeriksaan bersama lansia. Hasil disimpan dengan mode "caregiver" untuk lansia yang
 * dipilih; RLS hanya mengizinkannya bila hubungan aktif.
 */
export default function CaregiverCheck() {
  const { configured, profile } = useCaregiverSession();
  const [links, setLinks] = useState<CaregiverLink[] | null>(null);
  const [chosen, setChosen] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    let alive = true;
    listCaregiverLinks()
      .then((l) => alive && setLinks(l.filter((x) => x.status === "active")))
      .catch((e) => alive && setError(errorMessage(e)));
    return () => {
      alive = false;
    };
  }, [profile]);

  const flow = { mode: "caregiver" as const, homeHref: "/caregiver", homeLabel: "Kembali ke beranda" };

  // Simulasi (tanpa database): alur tetap bisa didemokan, hasil masuk riwayat demo lokal.
  if (!configured || !profile) return <ScreeningFlow {...flow} saveTarget={null} />;

  if (error) return <Notice title="Daftar lansia belum bisa dimuat" text={error} />;
  if (links === null) return <p role="status" className="text-base text-ink-soft py-6">Memuat lansia terhubung...</p>;
  if (links.length === 0) {
    return (
      <Notice
        title="Belum ada lansia terhubung"
        text="Hubungkan lansia terlebih dahulu. Lansia perlu menyetujui di perangkatnya sebelum pemeriksaan bisa dicatat."
      >
        <Link href="/caregiver/hubungkan" className={PRIMARY}>
          Hubungkan lansia
        </Link>
      </Notice>
    );
  }

  const elder = links.length === 1 ? links[0] : (links.find((l) => l.elderId === chosen) ?? null);
  if (!elder) {
    return (
      <section className="space-y-4 max-w-md mx-auto py-4" aria-labelledby="pilih-lansia">
        <h1 id="pilih-lansia" className="font-serif text-2xl sm:text-3xl font-bold text-ink">
          Periksa siapa?
        </h1>
        <div className="space-y-3">
          {links.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => setChosen(l.elderId)}
              className="w-full min-h-[60px] px-5 rounded-2xl border border-line/60 bg-surface text-left text-lg font-bold text-ink hover:bg-paper focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-focus"
            >
              {l.elderName ?? "Lansia"}
            </button>
          ))}
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-ink-soft max-w-md mx-auto">Pemeriksaan untuk {elder.elderName ?? "lansia"}</p>
      <ScreeningFlow {...flow} saveTarget={{ role: "caregiver", userId: profile.id, elderId: elder.elderId }} />
    </div>
  );
}
