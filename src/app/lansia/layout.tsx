import NavLinks from "@/components/NavLinks";
import SimBanner from "@/components/SimBanner";
import ElderSession from "@/components/session/ElderSession";
import { isSupabaseConfigured } from "@/lib/supabase/client";

const ITEMS = [
  { href: "/lansia", label: "Beranda", exact: true },
  { href: "/lansia/periksa", label: "Cek Mandiri" },
] as const;

export default function ElderLayout({ children }: LayoutProps<"/lansia">) {
  return (
    <div className="elder">
      <SimBanner>
        {isSupabaseConfigured()
          ? "Prototipe Demo. Pengingat masih simulasi. Pertanyaan belum ditinjau tenaga kesehatan."
          : "Prototipe Demo. Data dan pengingat bersifat simulasi."}
      </SimBanner>
      <main id="isi" className="page">
        <ElderSession>{children}</ElderSession>
      </main>
      <NavLinks items={ITEMS} label="Navigasi utama" />
    </div>
  );
}
