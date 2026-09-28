"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { href: string; label: string };

/**
 * Client component semata-mata untuk usePathname: tanpa penanda halaman aktif,
 * kedua tautan terlihat identik meski kamu sedang berada di salah satunya.
 */
export function AdminNav({ items }: { items: Item[] }) {
  const pathname = usePathname();

  return (
    <>
      {items.map((item) => {
        const active =
          item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            className="admin-bar__link"
            href={item.href}
            aria-current={active ? "page" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </>
  );
}
