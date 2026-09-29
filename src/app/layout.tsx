import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "PWPD Member's Voice",
  description: "Kotak suara anonim untuk seluruh member PWPD.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>
        <header className="topbar">
          <div className="topbar__inner">
            {/*
              The logo is the way back to the form. aria-label names the
              destination, so the image itself is decorative: without it a
              screen reader would read the company name and leave the reader
              guessing where the link goes.
            */}
            <Link className="topbar__home" href="/" aria-label="Toyota Indonesia - beranda">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="topbar__logo" src="/brand/logo.webp" alt="" />
            </Link>
            <span className="topbar__rule" aria-hidden="true" />
            <span className="topbar__unit">
              <strong>PWPD Sunter</strong>
              <span>Press &amp; Welding Production Division</span>
            </span>
            <span className="topbar__spacer" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="topbar__tagline"
              src="/brand/tagline.webp"
              alt="Always A Better Way"
            />
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
