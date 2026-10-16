"use client";

import { useSyncExternalStore } from "react";
import { useElderSession } from "./ElderSession";

function subscribeProfile(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("eldervital:profile-updated", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("eldervital:profile-updated", callback);
    window.removeEventListener("storage", callback);
  };
}

function getDemoNameSnapshot() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("eldervital_demo_name") || "";
}

/** Nama panggilan lansia dari profil; fallback dipakai selama simulasi. */
export default function ElderName({ fallback }: { fallback: string }) {
  const { profile } = useElderSession();
  const demoName = useSyncExternalStore(subscribeProfile, getDemoNameSnapshot, () => "");

  return <>{profile?.displayName || demoName || fallback}</>;
}
