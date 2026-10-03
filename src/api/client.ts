import { API_BASE_URL, REQUEST_TIMEOUT_MS } from '@/src/constants/config';
import { getAccessToken } from '@/src/api/supabase';
import type { ApiError } from '@/src/types';

let authToken: string | null = null;

/** Manual override (kept for session restore); otherwise read from Supabase. */
export function setAuthToken(token: string | null) {
  authToken = token;
}

export function normalizeError(error: unknown, fallback = 'Something went wrong.'): ApiError {
  if (error instanceof ApiErrorShape) {
    return { message: error.message, status: error.status, code: error.code };
  }
  if (error instanceof Error) {
    return { message: error.message || fallback, code: 'unknown' };
  }
  return { message: fallback, code: 'unknown' };
}

class ApiErrorShape extends Error {
  status?: number;
  code: string;
  constructor(message: string, opts?: { status?: number; code?: string }) {
    super(message);
    this.status = opts?.status;
    this.code = opts?.code ?? 'api_error';
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST';
  body?: unknown;
  token?: string | null;
  timeoutMs?: number;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? REQUEST_TIMEOUT_MS);

  try {
    // Prefer the live Supabase session so an automatic refresh is reflected
    // in API calls; the direct login token remains a fallback during the
    // SecureStore persistence race immediately after sign-in.
    const token = options.token ?? (await getAccessToken()) ?? authToken;
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? 'GET',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
    });

    const text = await res.text();
    let data: T | undefined;
    try {
      data = text ? (JSON.parse(text) as T) : undefined;
    } catch {
      if (res.ok) throw new ApiErrorShape('The server returned an invalid response. Please retry.', { code: 'invalid_response' });
    }

    if (!res.ok) {
      const detail =
        typeof data === 'object' && data !== null && 'detail' in data
          ? String((data as { detail: unknown }).detail)
          : `Request failed (${res.status})`;
      // Keep backend auth failures visible to the current screen. A 401 can
      // mean the API rejected a still-valid Supabase session; callers should
      // offer retry/sign-out guidance instead of forcing an auth loop.
      throw new ApiErrorShape(res.status === 401
        ? 'The server rejected the current session. Retry; if it persists, sign out from Profile and sign in again. If a fresh sign-in still fails, ask the operator to check the API authentication configuration.'
        : detail, {
        status: res.status,
        code: res.status === 401 ? 'unauthorized' : res.status >= 500 ? 'server' : 'validation',
      });
    }
    return data as T;
  } catch (error) {
    if (error instanceof ApiErrorShape) throw error;
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiErrorShape('Request timed out. Please try again.', { code: 'timeout' });
    }
    throw new ApiErrorShape('Unable to reach the ShaktiOS server. Please try again.', {
      code: 'network',
    });
  } finally {
    clearTimeout(timeout);
  }
}
