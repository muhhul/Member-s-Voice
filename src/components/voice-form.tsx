"use client";

import { useActionState } from "react";
import { submitVoice, type SubmitState } from "@/app/actions";
import { TurnstileWidget } from "@/components/turnstile-widget";
import { CATEGORIES, CATEGORY_LABELS, MESSAGE_MAX, MESSAGE_MIN } from "@/lib/constants";

const initialState: SubmitState = { errors: {} };

export function VoiceForm({ turnstileSiteKey }: { turnstileSiteKey?: string }) {
  const [state, formAction, pending] = useActionState(submitVoice, initialState);

  return (
    <form action={formAction} className="card" noValidate>
      {state.errors._form ? (
        <p className="error" role="alert">
          {state.errors._form}
        </p>
      ) : null}

      <div className="field">
        <label htmlFor="category">Kategori</label>
        <select id="category" name="category" defaultValue="" required>
          <option value="" disabled>
            Pilih kategori
          </option>
          {CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {CATEGORY_LABELS[category]}
            </option>
          ))}
        </select>
        {state.errors.category ? <p className="error">{state.errors.category}</p> : null}
      </div>

      <div className="field">
        <label htmlFor="message">Suara Anda</label>
        <textarea
          id="message"
          name="message"
          maxLength={MESSAGE_MAX}
          required
          placeholder="Tuliskan masukan, keluhan, atau ide Anda."
        />
        <p className="hint">
          {MESSAGE_MIN}&ndash;{MESSAGE_MAX} karakter. Hindari menyebut nama atau detail yang bisa
          menunjuk ke diri Anda, kecuali Anda memang ingin diketahui.
        </p>
        {state.errors.message ? <p className="error">{state.errors.message}</p> : null}
      </div>

      {/* Honeypot: hidden from people, tempting to bots. Never shown, never labelled. */}
      <div className="honeypot" aria-hidden="true">
        <input type="text" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      {turnstileSiteKey ? (
        <div className="field">
          <TurnstileWidget siteKey={turnstileSiteKey} />
        </div>
      ) : null}

      <button type="submit" disabled={pending}>
        {pending ? "Mengirim..." : "Kirim"}
      </button>
    </form>
  );
}
