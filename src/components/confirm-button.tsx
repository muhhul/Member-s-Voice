"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

/**
 * A submit button that requires two clicks. Preferred over window.confirm,
 * which is styled by the browser and blocked in some embedded contexts.
 * Must be rendered inside a <form>: useFormStatus reads that form's state.
 */
export function ConfirmButton({
  label,
  confirmLabel,
  className = "secondary",
}: {
  label: string;
  confirmLabel: string;
  className?: string;
}) {
  const [armed, setArmed] = useState(false);
  const { pending } = useFormStatus();

  if (!armed) {
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
