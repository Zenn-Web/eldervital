import type { Metadata } from "next";
import ElderSettings from "@/components/checks/ElderSettings";

export const metadata: Metadata = { title: "Pengaturan" };

export default function ElderSettingsPage() {
  return <ElderSettings />;
}
