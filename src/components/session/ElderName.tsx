"use client";

import { useElderSession } from "./ElderSession";

/** Nama panggilan lansia dari profil; fallback dipakai selama simulasi. */
export default function ElderName({ fallback }: { fallback: string }) {
  const { profile } = useElderSession();
  return <>{profile?.displayName ?? fallback}</>;
}
