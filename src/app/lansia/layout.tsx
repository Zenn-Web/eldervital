import NavLinks from "@/components/NavLinks";
import SimBanner from "@/components/SimBanner";

const ITEMS = [{ href: "/lansia", label: "Beranda", exact: true }] as const;

export default function ElderLayout({ children }: LayoutProps<"/lansia">) {
  return (
    <div className="elder">
      <SimBanner>Prototipe. Data dan pengingat pada versi ini bersifat simulasi.</SimBanner>
      <main id="isi" className="page">
        {children}
      </main>
      <NavLinks items={ITEMS} label="Navigasi utama" />
    </div>
  );
}
