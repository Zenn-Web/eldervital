import type { Metadata } from "next";
import ElderConnect from "@/components/checks/ElderConnect";

export const metadata: Metadata = { title: "Hubungkan caregiver" };

export default function ElderConnectPage() {
  return <ElderConnect />;
}
