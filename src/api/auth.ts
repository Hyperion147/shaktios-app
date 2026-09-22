// Citizen authentication via Supabase Auth.
//
// Flow: Supabase email+password sign-in → persisted session → access token
// sent as `Authorization: Bearer <token>` to FastAPI, which validates the
// JWT and derives identity from `sub`. The client never supplies user ids.
import type { User } from '@/src/types';
import { getSupabase } from '@/src/api/supabase';
import { isSupabaseConfigured } from '@/src/constants/config';

function toUser(id: string, email: string | null): User {
  return {
    id,
    name: email ? email.split('@')[0] : 'Citizen',
    role: 'citizen',
    ...(email ? { email } : {}),
  };
}

function configError(): Error {
  return new Error(
    'Sign-in is unavailable: Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY, then restart the app.',
  );
}

export async function signIn(email: string, password: string): Promise<User> {
  if (!isSupabaseConfigured()) throw configError();
  const { data, error } = await getSupabase().auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error || !data.user) throw new Error(error?.message ?? 'Sign-in failed.');
  return toUser(data.user.id, data.user.email ?? email.trim());
}

export async function signUp(email: string, password: string): Promise<User> {
  if (!isSupabaseConfigured()) throw configError();
  const { data, error } = await getSupabase().auth.signUp({
    email: email.trim(),
    password,
  });
  if (error || !data.user) throw new Error(error?.message ?? 'Sign-up failed.');
  return toUser(data.user.id, data.user.email ?? email.trim());
}

/** Current Supabase session → citizen user + access token, or null. */
export async function restoreSession(): Promise<{ user: User; token: string } | null> {
  if (!isSupabaseConfigured()) return null;
  const { data } = await getSupabase().auth.getSession();
  const session = data.session;
  if (!session?.user || !session.access_token) return null;
  return {
    user: toUser(session.user.id, session.user.email ?? null),
    token: session.access_token,
  };
}

export async function signOut(): Promise<void> {
  if (!isSupabaseConfigured()) return;
  await getSupabase().auth.signOut();
}
