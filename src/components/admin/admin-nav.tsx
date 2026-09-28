"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { href: string; label: string; icon: "voices" | "users" };

const ICONS: Record<Item["icon"], React.ReactNode> = {
  voices: (
    <>
      <path
        d="M4 5.5h16v10H9l-5 4v-4H4z"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinejoin="round"
        fill="none"
      />
      <path d="M8 9.5h8M8 12.5h5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.1" stroke="currentColor" strokeWidth="1.9" fill="none" />
      <path
        d="M3.5 19.5c0-3 2.5-5.2 5.5-5.2s5.5 2.2 5.5 5.2"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M16 5.4a3.1 3.1 0 0 1 0 5.9M17.2 14.7c2.1.6 3.6 2.4 3.6 4.8"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        fill="none"
      />
    </>
  ),
};

/**
 * A client component purely for usePathname: without an active-page marker
 * both links look identical even while you are standing on one of them.
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
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              {ICONS[item.icon]}
            </svg>
            {item.label}
          </Link>
        );
      })}
    </>
  );
}
