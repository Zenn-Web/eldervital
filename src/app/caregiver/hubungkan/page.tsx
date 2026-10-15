import type { Metadata } from "next";
import ConnectElder from "@/components/checks/ConnectElder";

export const metadata: Metadata = { title: "Hubungkan lansia" };

export default function CaregiverConnectPage() {
  return <ConnectElder />;
}
