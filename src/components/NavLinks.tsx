"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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
        return (
          <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined}>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
