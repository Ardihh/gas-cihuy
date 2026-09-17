// lib/api.js
import { cookies } from 'next/headers';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const PROJECT = process.env.NEXT_PUBLIC_PROJECT_ID;
const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

export async function apiFetch(endpoint, options = {}) {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${BASE_URL}/${PROJECT}${cleanEndpoint}`;

  let bearerToken = '';
  try {
    const cookieStore = await cookies();
    bearerToken = cookieStore.get('session_token')?.value || '';
  } catch (e) {
    // Dipanggil dari Client Component
  }

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-API-Key': API_KEY, // Layer 1: Akses Backend Kelompok
  };

  if (bearerToken) {
    headers['Authorization'] = `Bearer ${bearerToken}`; // Layer 2: User Session JWT
  }

  const res = await fetch(url, {
    ...options,
    headers: { ...headers, ...options.headers },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `Request gagal: status ${res.status}`);
  }

  return data;
}
