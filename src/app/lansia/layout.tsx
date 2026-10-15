import NavLinks from "@/components/NavLinks";
import SimBanner from "@/components/SimBanner";

const ITEMS = [
  { href: "/lansia", label: "Beranda", exact: true },
  { href: "/lansia/periksa", label: "Cek Mandiri" },
] as const;

export default function ElderLayout({ children }: LayoutProps<"/lansia">) {
  return (
    <div className="elder">
      <SimBanner>Prototipe Demo. Data dan pengingat bersifat simulasi.</SimBanner>
      <main id="isi" className="page">
        {children}
      </main>
      <NavLinks items={ITEMS} label="Navigasi utama" />
    </div>
  );
}
