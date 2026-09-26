"use client";

import { useActionState } from "react";

import { loginAction } from "../actions/auth.js";
import styles from "./page.module.css";

const initialState = { error: "" };

export default function LoginForm({ nextPath = "/dashboard" }) {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form
      className={styles.form}
      id="login-form"
      action={formAction}
      aria-busy={pending}
      aria-describedby={state?.error ? "login-error" : undefined}
    >
      <input name="next" type="hidden" value={nextPath} />
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
          autoComplete="current-password"
          id="password"
          name="password"
          required
          type="password"
        />
      </div>

      {state?.error && (
        <p className={styles.error} id="login-error" role="alert">
          {state.error}
        </p>
      )}

      <button className={styles.submit} disabled={pending} type="submit">
        {pending ? "Memeriksa…" : "Masuk"}
        <span aria-hidden="true">↗</span>
      </button>
    </form>
  );
}
