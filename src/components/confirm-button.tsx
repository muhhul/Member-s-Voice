"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

function TrashIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 7h16M10 4h4M9.5 11v6M14.5 11v6M6 7l1 12.5a1.5 1.5 0 0 0 1.5 1.4h7a1.5 1.5 0 0 0 1.5-1.4L18 7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Tombol kirim yang menuntut dua klik. Dipilih ketimbang window.confirm yang
 * tampilannya ditentukan browser dan diblokir di sebagian konteks.
 * Harus berada di dalam <form>: useFormStatus membaca status form itu.
 *
 * Varian icon dipakai untuk aksi merusak di dalam baris tabel - aksi yang tidak
 * bisa dibatalkan tidak pantas jadi elemen paling nyaring di layar. Klik kedua
 * baru berwarna merah tegas.
 */
export function ConfirmButton({
  label,
  confirmLabel,
  className = "secondary",
  icon,
}: {
  label: string;
  confirmLabel: string;
  className?: string;
  icon?: "trash";
}) {
  const [armed, setArmed] = useState(false);
  const { pending } = useFormStatus();

  if (!armed) {
    if (icon === "trash") {
      return (
        <button type="button" className="icon-btn" onClick={() => setArmed(true)} title={label}>
          <TrashIcon />
          <span className="sr-only">{label}</span>
        </button>
      );
    }
    return (
      <button type="button" className={className} onClick={() => setArmed(true)}>
        {label}
      </button>
    );
  }

  return (
    <span className="row-actions">
      <button type="submit" className="danger" disabled={pending}>
        {pending ? "Memproses..." : confirmLabel}
      </button>
      <button type="button" className="secondary" onClick={() => setArmed(false)}>
        Batal
      </button>
    </span>
  );
}
