import { API_BASE_URL, REQUEST_TIMEOUT_MS } from '@/src/constants/config';
import { getAccessToken } from '@/src/api/supabase';
import type { ApiError } from '@/src/types';

let authToken: string | null = null;
let authIdentity: string | null = null;
let authRevision = 0;

/** Session ownership changes invalidate pending reads/uploads, but token refresh does not. */
export function setAuthToken(token: string | null, identity: string | null = token) {
  if (identity !== authIdentity) ++authRevision;
  authIdentity = identity;
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
  signal?: AbortSignal;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const revision = authRevision;
  const assertCurrentSession = () => {
    if (revision !== authRevision) throw new ApiErrorShape('The signed-in account changed. Please retry from the current account.', { code: 'cancelled' });
  };
  const controller = new AbortController();
  const cancel = () => controller.abort();
  if (options.signal?.aborted) cancel();
  else options.signal?.addEventListener('abort', cancel, { once: true });
  const timeout = setTimeout(cancel, options.timeoutMs ?? REQUEST_TIMEOUT_MS);
  const multipart = typeof FormData !== 'undefined' && options.body instanceof FormData;

  try {
    // Prefer the live Supabase session so an automatic refresh is reflected
    // in API calls; the direct login token remains a fallback during the
    // SecureStore persistence race immediately after sign-in.
    const token = options.token !== undefined ? options.token : (await getAccessToken()) ?? authToken;
    assertCurrentSession();
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? 'GET',
      signal: controller.signal,
      headers: {
        // Let fetch set the multipart boundary for native/web audio uploads.
        ...(!multipart ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(options.body !== undefined ? { body: multipart ? options.body as FormData : JSON.stringify(options.body) } : {}),
    });

    const text = await res.text();
    assertCurrentSession();
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
    if (controller.signal.aborted) {
      throw new ApiErrorShape(options.signal?.aborted ? 'Request cancelled.' : 'Request timed out. Please try again.', {
        code: options.signal?.aborted ? 'cancelled' : 'timeout',
      });
    }
    throw new ApiErrorShape('Unable to reach the ShaktiOS server. Please try again.', {
      code: 'network',
    });
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener('abort', cancel);
  }
}
