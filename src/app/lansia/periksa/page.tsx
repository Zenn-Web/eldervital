import type { Metadata } from "next";
import ScreeningFlow from "@/components/ScreeningFlow";

export const metadata: Metadata = { title: "Cek Mandiri" };

export default function SelfCheck() {
  return <ScreeningFlow mode="mandiri" homeHref="/lansia" homeLabel="Kembali ke beranda" />;
}
