import { getAuthToken } from './token';

// IMPORTANT:
// - If you run the backend on your computer and the app on a physical phone,
//   "localhost" will NOT work. Use your machine's LAN IP (e.g. http://192.168.1.10:8080).
export const API_BASE_URL = 'http://192.168.1.104:8080';

type ApiError = Error & { status?: number };

export async function apiFetch<T>(
  path: string,
  init: RequestInit & { auth?: boolean } = { auth: true }
): Promise<T> {
  const url = API_BASE_URL + path;

  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

  if (init.auth !== false) {
    const token = await getAuthToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  console.log(`[API] ${init.method ?? 'GET'} ${path}`);
  let res: Response;
  try {
    res = await fetch(url, { ...init, headers, signal: controller.signal });
  } catch (e: any) {
    clearTimeout(timeout);
    const msg = e?.name === 'AbortError' ? 'Request timed out. Check your connection.' : e?.message;
    console.error(`[API] ${init.method ?? 'GET'} ${path} — FAILED:`, msg);
    if (e?.name === 'AbortError') throw new Error('Request timed out. Check your connection.');
    throw e;
  }
  clearTimeout(timeout);
  console.log(`[API] ${init.method ?? 'GET'} ${path} — ${res.status}`);

  if (res.status === 204) {
    return undefined as unknown as T;
  }

  const text = await res.text();
  const data = text ? safeJSONParse(text) : null;

  if (!res.ok) {
    const e: ApiError = new Error((data as any)?.error || `Request failed (${res.status})`);
    e.status = res.status;
    throw e;
  }

  return data as T;
}

function safeJSONParse(s: string) {
  try {
    return JSON.parse(s);
  } catch {
    return s;
  }
}

