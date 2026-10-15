import NavLinks from "@/components/NavLinks";
import SimBanner from "@/components/SimBanner";
import CaregiverSession from "@/components/session/CaregiverSession";
import { isSupabaseConfigured } from "@/lib/supabase/client";

const ITEMS = [
  { href: "/caregiver", label: "Beranda", exact: true },
  { href: "/caregiver/riwayat", label: "Riwayat" },
  { href: "/caregiver/tentang", label: "Tentang" },
  { href: "/caregiver/pengaturan", label: "Pengaturan" },
] as const;

export default function CaregiverLayout({ children }: LayoutProps<"/caregiver">) {
  return (
    <>
      <SimBanner>
        {isSupabaseConfigured()
          ? "Prototipe. Bagian yang masih simulasi diberi label di layarnya."
          : "Prototipe. Belum tersambung ke database, jadi belum ada data nyata."}
      </SimBanner>
      <main id="isi" className="page">
        <CaregiverSession>{children}</CaregiverSession>
      </main>
      <NavLinks items={ITEMS} label="Navigasi caregiver" />
    </>
  );
}
