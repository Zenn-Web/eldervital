import type { Metadata } from "next";
import ElderCheck from "@/components/checks/ElderCheck";

export const metadata: Metadata = { title: "Cek Mandiri" };

export default function SelfCheck() {
  return <ElderCheck />;
}
