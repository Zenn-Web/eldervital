import type { Metadata } from "next";
import ScreeningFlow from "@/components/ScreeningFlow";

export const metadata: Metadata = { title: "Pemeriksaan bersama" };

export default function AssistedCheck() {
  return <ScreeningFlow mode="caregiver" homeHref="/caregiver" homeLabel="Kembali ke beranda" />;
}
