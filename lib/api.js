// This module is server-only because next/headers is intentionally used here.
// Next treats next/headers as a server boundary; the standalone server-only
// package is not installed in this project.
import { cookies } from 'next/headers';

if (typeof window !== 'undefined') {
  throw new Error('lib/api.js can only be imported from server code.');
}

const CONFIG_NAMES = {
  baseUrl: 'API_BASE_URL',
  project: 'API_PROJECT_ID',
  apiKey: 'API_KEY',
};

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

function readRequiredConfig(name) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required API configuration: ${name}`);
  }

  return value;
}

function getApiConfig() {
  return {
    baseUrl: readRequiredConfig(CONFIG_NAMES.baseUrl).replace(/\/+$/, ''),
    project: readRequiredConfig(CONFIG_NAMES.project).replace(/^\/+|\/+$/g, ''),
    apiKey: readRequiredConfig(CONFIG_NAMES.apiKey),
  };
}

function buildApiUrl(baseUrl, project, endpoint) {
  if (typeof endpoint !== 'string' || endpoint.trim() === '') {
    throw new TypeError('API endpoint must be a non-empty string.');
  }

  const cleanEndpoint = `/${endpoint.replace(/^\/+/, '')}`;
  return `${baseUrl}/${project}${cleanEndpoint}`;
}

function parseResponseBody(text) {
  if (!text.trim()) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function getHttpErrorMessage(data, status) {
  if (data && typeof data === 'object' && typeof data.message === 'string' && data.message.trim()) {
    return data.message.trim();
  }

  return `Request gagal: status ${status}`;
}

async function getSessionToken() {
  try {
    const cookieStore = await cookies();
    return cookieStore.get('session_token')?.value || '';
  } catch {
    return '';
  }
}

export async function apiFetch(endpoint, options = {}) {
  const { baseUrl, project, apiKey } = getApiConfig();
  const url = buildApiUrl(baseUrl, project, endpoint);
  const bearerToken = await getSessionToken();

  const headers = new Headers({
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-API-Key': apiKey,
  });

  if (bearerToken) {
    headers.set('Authorization', `Bearer ${bearerToken}`);
  }

  if (options.headers) {
    const callerHeaders = new Headers(options.headers);
    callerHeaders.forEach((value, name) => headers.set(name, value));
  }

  let response;

  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (cause) {
    throw new ApiError('API request gagal terhubung ke server.', { cause });
  }

  let data;

  try {
    data = parseResponseBody(await response.text());
  } catch (cause) {
    throw new ApiError('Respons API tidak dapat dibaca.', {
      status: response.status,
      cause,
    });
  }

  if (!response.ok) {
    throw new ApiError(getHttpErrorMessage(data, response.status), {
      status: response.status,
      data,
    });
  }

  return data;
}
