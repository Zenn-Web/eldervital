"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { UserIcon } from "@/components/shared/Icons";
import { useElderSession } from "./ElderSession";
import { listElderLinks, type ElderLink } from "@/lib/pairing";

/**
 * Kartu "Keluarga Terhubung" di beranda lansia: caregiver yang terhubung sungguhan, atau
 * permintaan yang menunggu persetujuan. Selama simulasi menampilkan contoh.
 */
export default function ElderLinksCard() {
  const { configured, profile } = useElderSession();
  const [links, setLinks] = useState<ElderLink[] | null>(null);

  useEffect(() => {
    if (!profile) return;
    let alive = true;
    listElderLinks()
      .then((l) => alive && setLinks(l))
      .catch(() => alive && setLinks(null)); // offline: beranda tetap bisa dipakai
    return () => {
      alive = false;
    };
  }, [profile]);

  const pending = links?.find((l) => l.status === "pending");
  const active = links?.filter((l) => l.status === "active") ?? [];
  const label = !configured
    ? "Rina Lestari (Caregiver)"
    : pending
      ? `${pending.caregiverName} ingin terhubung`
      : active.length > 0
        ? active.map((l) => l.caregiverName).join(", ")
        : links === null
          ? "Memuat..."
          : "Belum ada caregiver terhubung";

  return (
    <div
      className="p-4 rounded-2xl bg-surface border border-line/60 flex items-center justify-between gap-3 shadow-none"
      role={pending ? "status" : undefined}
    >
      <div className="flex items-center gap-3.5">
        <div
          className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0"
          aria-hidden="true"
        >
          <UserIcon size={20} />
        </div>
        <div>
          <span className="text-xs text-ink-soft block font-medium">Keluarga Terhubung</span>
          <span className="text-sm font-bold text-ink">{label}</span>
        </div>
      </div>
      <Link
        href={configured ? "/lansia/hubungkan" : "/"}
        className="min-h-[44px] px-4 py-2 rounded-full border border-primary/30 bg-paper hover:bg-primary hover:text-white text-primary text-sm font-bold transition-colors flex items-center justify-center shrink-0 focus-visible:ring-4 focus-visible:ring-focus"
      >
        {pending ? "Lihat permintaan" : active.length > 0 ? "Atur" : "Lihat QR"}
      </Link>
    </div>
  );
}
