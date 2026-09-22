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
    // Centralized auth: explicit per-call token → cached token → live Supabase session.
    const token = options.token ?? authToken ?? (await getAccessToken());
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
    const data = text ? (JSON.parse(text) as T) : (undefined as T);

    if (!res.ok) {
      const detail =
        typeof data === 'object' && data !== null && 'detail' in data
          ? String((data as { detail: unknown }).detail)
          : `Request failed (${res.status})`;
      // 401 surfaces as session expiry; screens route back to login.
      throw new ApiErrorShape(detail, {
        status: res.status,
        code: res.status === 401 ? 'unauthorized' : res.status >= 500 ? 'server' : 'validation',
      });
    }
    return data;
  } catch (error) {
    if (error instanceof ApiErrorShape) throw error;
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiErrorShape('Request timed out. Please try again.', { code: 'timeout' });
    }
    throw new ApiErrorShape('Unable to reach the ShaktiOS server. Please try again.', {
      code: 'network',
    });
  } finally {
    clearTimeout(timeout);
  }
}
