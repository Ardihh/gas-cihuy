import "server-only";

import { readApiConfiguration } from "./api-config.mjs";

export class ApiError extends Error {
  constructor(message, { status = null, data = null, cause } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;

    if (cause !== undefined) {
      this.cause = cause;
    }
  }
}

async function getSessionToken() {
  if (typeof window !== 'undefined') {
    return '';
  }

  try {
    const nextHeaders = await import('next/headers');
    const cookieStore = await nextHeaders.cookies();
    return cookieStore.get('session_token')?.value || '';
  } catch {
    return '';
  }
}

export async function apiFetch(path, options = {}) {
  const {
    method = 'GET',
    body,
    token,
    auth = true,
    headers: customHeaders = {},
    ...fetchOptions
  } = options;

  const { base, project, apiKey } = readApiConfiguration();
  const explicitToken = typeof token === "string" ? token.trim() : "";
  const bearerToken = explicitToken || (auth ? await getSessionToken() : "");
  const headers = new Headers(customHeaders);

  headers.set("Accept", "application/json");
  headers.set("X-API-Key", apiKey);
  headers.delete("Authorization");

  if (bearerToken) {
    headers.set("Authorization", `Bearer ${bearerToken}`);
  }

  let verb = (method || 'GET').toUpperCase();
  let suffix = '';

  if (verb === 'PUT' || verb === 'DELETE') {
    headers.set('X-HTTP-Method-Override', verb);
    suffix = (path.indexOf('?') === -1 ? '?' : '&') + '_method=' + verb;
    verb = 'POST';
  }

  let requestBody = undefined;
  if (body !== undefined && body !== null) {
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    requestBody = typeof body === 'string' ? body : JSON.stringify(body);
  }

  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${base}/${project}${cleanPath}${suffix}`;

  let res;
  try {
    res = await fetch(url, {
      method: verb,
      headers,
      body: requestBody,
      ...fetchOptions,
    });
  } catch (cause) {
    throw new ApiError('API request gagal terhubung ke server.', { cause });
  }

  const text = await res.text().catch(() => '');
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = text;
  }

  if (!res.ok) {
    const errorMsg = (typeof data === 'object' && data?.message) || res.statusText || `Request gagal: status ${res.status}`;
    throw new ApiError(errorMsg, {
      status: res.status,
      data,
    });
  }

  return data;
}
