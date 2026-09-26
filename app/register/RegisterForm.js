"use client";

import { useActionState } from "react";

import { registerAction } from "../actions/auth.js";
import styles from "../login/page.module.css";

const initialState = { status: "", error: "" };

export default function RegisterForm({ nextPath = "/dashboard" }) {
  const [state, formAction, pending] = useActionState(registerAction, initialState);

  return (
    <form
      className={styles.form}
      id="register-form"
      action={formAction}
      aria-busy={pending}
      aria-describedby={state?.error ? "register-error" : undefined}
    >
      <input name="next" type="hidden" value={nextPath} />
      <div className={styles.field}>
        <label htmlFor="name">Nama</label>
        <input
          autoComplete="name"
          id="name"
          name="name"
          required
          type="text"
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="email">Email</label>
        <input
          autoComplete="email"
          id="email"
          name="email"
          required
          type="email"
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="password">Password</label>
        <input
          autoComplete="new-password"
          id="password"
          name="password"
          required
          type="password"
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="phone">Nomor telepon (opsional)</label>
        <input
          autoComplete="tel"
          id="phone"
          name="phone"
          type="tel"
        />
      </div>

      {state?.error && (
        <p className={styles.error} id="register-error" role="alert">
          {state.error}
        </p>
      )}

      <button className={styles.submit} disabled={pending} type="submit">
        {pending ? "Mendaftarkan…" : "Daftar"}
        <span aria-hidden="true">↗</span>
      </button>
    </form>
  );
}
