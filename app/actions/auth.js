// app/actions/auth.js
'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const PROJECT = process.env.NEXT_PUBLIC_PROJECT_ID;

export async function loginAction(formData) {
  const email = formData.get('email');
  const password = formData.get('password');

  const res = await fetch(`${BASE_URL}/${PROJECT}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    cache: 'no-store',
  });

  const data = await res.json();
  if (!res.ok || !data.success || !data.token) {
    return { error: data.message || 'Login gagal.' };
  }

  const cookieStore = await cookies();
  cookieStore.set('session_token', data.token, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });
  cookieStore.set('user_profile', JSON.stringify(data.user), {
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });

  redirect('/dashboard');
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete('session_token');
  cookieStore.delete('user_profile');
  redirect('/login');
}
