import NavLinks from "@/components/NavLinks";
import SimBanner from "@/components/SimBanner";

const ITEMS = [
  { href: "/caregiver", label: "Beranda", exact: true },
  { href: "/caregiver/riwayat", label: "Riwayat" },
  { href: "/caregiver/tentang", label: "Tentang" },
  { href: "/caregiver/pengaturan", label: "Pengaturan" },
] as const;

export default function CaregiverLayout({ children }: LayoutProps<"/caregiver">) {
  return (
    <>
      <SimBanner>Prototipe. Belum tersambung ke database, jadi belum ada data nyata.</SimBanner>
      <main id="isi" className="page">
        {children}
      </main>
      <NavLinks items={ITEMS} label="Navigasi caregiver" />
    </>
  );
}
