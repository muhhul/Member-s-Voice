"use client";

import { useActionState, useState } from "react";
import { submitVoice, type SubmitState } from "@/app/actions";
import { TurnstileWidget } from "@/components/turnstile-widget";
import { CATEGORIES, CATEGORY_LABELS, MESSAGE_MAX, MESSAGE_MIN } from "@/lib/constants";

const initialState: SubmitState = { errors: {} };

export function VoiceForm({ turnstileSiteKey }: { turnstileSiteKey?: string }) {
  const [state, formAction, pending] = useActionState(submitVoice, initialState);
  const [length, setLength] = useState(0);

  const tooShort = length > 0 && length < MESSAGE_MIN;

  return (
    <form action={formAction} noValidate>
      <div className="anon-notice">
        <span className="anon-notice__icon" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <rect x="4.5" y="10" width="15" height="10.5" rx="2.5" fill="#fff" />
            <path
              d="M8 10V7.5a4 4 0 0 1 8 0V10"
              stroke="#fff"
              strokeWidth="2.1"
              strokeLinecap="round"
            />
            <circle cx="12" cy="15.2" r="1.7" fill="#3c3c3c" />
          </svg>
        </span>
        <div>
          <p className="anon-notice__title">Member Voice ini bersifat anonim.</p>
          <p className="anon-notice__body">
            Anda tidak perlu memasukkan nama atau identitas pribadi. Yang dikirim hanya kategori
            dan isi suara Anda.
          </p>
        </div>
      </div>

      {state.errors._form ? (
        <p className="error" role="alert" style={{ marginBottom: 16 }}>
          {state.errors._form}
        </p>
      ) : null}

      <div className="field">
        <label htmlFor="category">
          Kategori <span className="req">*</span>
        </label>
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

      <div className="field" style={{ marginBottom: 0 }}>
        <label htmlFor="message">
          Suara Anda <span className="req">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          maxLength={MESSAGE_MAX}
          required
          placeholder="Tuliskan masukan, keluhan, atau ide Anda..."
          onChange={(event) => setLength(event.target.value.trim().length)}
        />
        <div className="hint-row">
          <svg
            className="hint-row__icon"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="9.5" stroke="#8a8a8a" strokeWidth="2" />
            <path d="M12 11v5.5" stroke="#8a8a8a" strokeWidth="2.2" strokeLinecap="round" />
            <circle cx="12" cy="7.6" r="1.25" fill="#8a8a8a" />
          </svg>
          <span className="hint-row__text">
            Hindari menyebut nama atau detail yang bisa menunjuk ke diri Anda, kecuali memang
            ingin diketahui.
          </span>
          <span className={tooShort ? "counter counter--warn" : "counter"}>
            {tooShort ? `min. ${MESSAGE_MIN} — ` : ""}
            {length} / {MESSAGE_MAX}
          </span>
        </div>
        {state.errors.message ? <p className="error">{state.errors.message}</p> : null}
      </div>

      {/* Honeypot: tersembunyi dari manusia, menggoda bagi bot. */}
      <div className="honeypot" aria-hidden="true">
        <input type="text" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      {turnstileSiteKey ? (
        <div className="field" style={{ marginTop: 20, marginBottom: 0 }}>
          <TurnstileWidget siteKey={turnstileSiteKey} />
        </div>
      ) : null}

      <button className="btn-send" type="submit" disabled={pending}>
        {pending ? (
          "Mengirim..."
        ) : (
          <>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M21.4 2.6 2.9 9.9c-.8.3-.8 1.4 0 1.7l6.5 2.3 2.3 6.5c.3.8 1.4.8 1.7 0l7.3-18.5c.3-.7-.4-1.4-1.1-1.1Z"
                fill="currentColor"
              />
              <path d="M21.4 2.6 9.4 13.9" stroke="#e50014" strokeWidth="1.6" />
            </svg>
            Kirim Member Voice
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="m9 5 7 7-7 7"
                stroke="currentColor"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </>
        )}
      </button>
    </form>
  );
}
