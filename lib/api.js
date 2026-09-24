export const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || 'https://hmif.if.unram.ac.id/api/v3';
export const PROJECT = process.env.NEXT_PUBLIC_PROJECT_ID || process.env.API_PROJECT_ID || 'cosplay';
export const KEY = process.env.NEXT_PUBLIC_API_KEY || process.env.API_KEY || 'pk_cosplay_6350b80af60ac883';

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

  const base = (process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || BASE).replace(/\/+$/, '');
  const project = (process.env.NEXT_PUBLIC_PROJECT_ID || process.env.API_PROJECT_ID || PROJECT).replace(/^\/+|\/+$/g, '');
  const apiKey = (process.env.NEXT_PUBLIC_API_KEY || process.env.API_KEY || KEY).trim();

  const bearerToken = token || (auth ? (await getSessionToken()) || process.env.NEXT_PUBLIC_DEV_TOKEN : '');

  const headers = {
    Accept: 'application/json',
    'X-API-Key': apiKey,
    ...customHeaders,
  };

  if (bearerToken) {
    headers.Authorization = 'Bearer ' + bearerToken;
  }

  let verb = (method || 'GET').toUpperCase();
  let suffix = '';

  if (verb === 'PUT' || verb === 'DELETE') {
    headers['X-HTTP-Method-Override'] = verb;
    suffix = (path.indexOf('?') === -1 ? '?' : '&') + '_method=' + verb;
    verb = 'POST';
  }

  let requestBody = undefined;
  if (body !== undefined && body !== null) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
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
