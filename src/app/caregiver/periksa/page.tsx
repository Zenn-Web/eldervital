import type { Metadata } from "next";
import CaregiverCheck from "@/components/checks/CaregiverCheck";

export const metadata: Metadata = { title: "Pemeriksaan bersama" };

export default function AssistedCheck() {
  return <CaregiverCheck />;
}
