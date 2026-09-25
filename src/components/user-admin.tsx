"use client";

import { useActionState } from "react";
import {
  createUser,
  resetPassword,
  type UserFormState,
} from "@/app/admin/(protected)/users/actions";

const initialState: UserFormState = { errors: {} };

export function CreateUserForm() {
  const [state, formAction, pending] = useActionState(createUser, initialState);

  return (
    <form action={formAction} className="card" style={{ marginBottom: 24 }}>
      <h2>Buat Akun Baru</h2>

      {state.ok ? (
        <p className="ok" role="status">
          {state.ok}
        </p>
      ) : null}

      <div className="field">
        <label htmlFor="new-email">Email</label>
        <input id="new-email" name="email" type="email" required />
        {state.errors.email ? <p className="error">{state.errors.email}</p> : null}
      </div>

      <div className="field">
        <label htmlFor="new-name">Nama</label>
        <input id="new-name" name="name" type="text" required />
        {state.errors.name ? <p className="error">{state.errors.name}</p> : null}
      </div>

      <div className="field">
        <label htmlFor="new-role">Peran</label>
        <select id="new-role" name="role" defaultValue="viewer">
          <option value="viewer">Manajemen (hanya membaca)</option>
          <option value="master">Master (kelola akun)</option>
        </select>
        {state.errors.role ? <p className="error">{state.errors.role}</p> : null}
      </div>

      <div className="field">
        <label htmlFor="new-password">Kata sandi awal</label>
        {/* type=text on purpose: the master is reading this value out to hand
            over, not typing their own secret. Masking invites typos. */}
        <input
          id="new-password"
          name="password"
          type="text"
          autoComplete="off"
          required
          minLength={12}
        />
        <p className="hint">
          Minimal 12 karakter. Sampaikan lewat jalur pribadi, bukan grup.
        </p>
        {state.errors.password ? <p className="error">{state.errors.password}</p> : null}
      </div>

      <button type="submit" disabled={pending}>
        {pending ? "Menyimpan..." : "Buat Akun"}
      </button>
    </form>
  );
}

export function ResetPasswordForm({ userId }: { userId: string }) {
  const [state, formAction, pending] = useActionState(resetPassword, initialState);

  return (
    <form action={formAction}>
      <input type="hidden" name="userId" value={userId} />
      <div className="row-actions">
        <input
          name="password"
          type="text"
          autoComplete="off"
          placeholder="kata sandi baru"
          minLength={12}
          required
          style={{ minWidth: 170 }}
        />
        <button className="secondary" type="submit" disabled={pending}>
          {pending ? "..." : "Ganti"}
        </button>
      </div>
      {state.errors.password ? <p className="error">{state.errors.password}</p> : null}
      {state.errors.userId ? <p className="error">{state.errors.userId}</p> : null}
      {state.ok ? <p className="ok">{state.ok}</p> : null}
    </form>
  );
}
