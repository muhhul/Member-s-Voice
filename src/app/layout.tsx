import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Member's Voice",
  description: "Kotak suara anonim untuk seluruh karyawan.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>
        <header className="site-header">
          <div className="site-header__inner">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="site-header__logo" src="/logo.svg" alt="" />
            <p className="site-header__title">Member&apos;s Voice</p>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
