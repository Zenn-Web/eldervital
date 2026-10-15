"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  ClipboardCheckIcon,
  HistoryIcon,
  InfoIcon,
  SettingsIcon,
} from "@/components/shared/Icons";

type IconKey = "beranda" | "periksa" | "riwayat" | "tentang" | "pengaturan";

const ICON_MAP: Record<IconKey, React.FC<{ size?: number; className?: string }>> = {
  beranda: HomeIcon,
  periksa: ClipboardCheckIcon,
  riwayat: HistoryIcon,
  tentang: InfoIcon,
  pengaturan: SettingsIcon,
};

function getIconKey(label: string): IconKey {
  const slug = label.toLowerCase().replace(/\s+/g, "-");
  if (slug.includes("beranda")) return "beranda";
  if (slug.includes("periksa") || slug.includes("cek")) return "periksa";
  if (slug.includes("riwayat")) return "riwayat";
  if (slug.includes("tentang")) return "tentang";
  if (slug.includes("pengaturan")) return "pengaturan";
  return "beranda";
}

interface Item {
  href: string;
  label: string;
  /** true: aktif hanya bila path sama persis (untuk halaman beranda tiap peran). */
  exact?: boolean;
}

export default function NavLinks({ items, label }: { items: readonly Item[]; label: string }) {
  const pathname = usePathname();
  return (
    <nav className="bottom-nav" aria-label={label}>
      {items.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        const iconKey = getIconKey(item.label);
        const Icon = ICON_MAP[iconKey];
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`nav-link ${active ? "nav-link--active" : ""}`}
          >
            <Icon size={22} className="nav-link__icon" />
            <span className="nav-link__label">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
