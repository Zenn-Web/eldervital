import type { Metadata } from "next";
import { OnboardingFlow } from "@/modules/onboarding/OnboardingFlow";

export const metadata: Metadata = {
  title: "ElderVital — Pemantauan Kondisi & Skrining Gejala Harian",
  description:
    "Pemeriksaan gejala harian untuk usia 50 sampai 65 tahun. Mandiri dengan suara atau didampingi caregiver.",
};

export default function Home() {
  return <OnboardingFlow />;
}
