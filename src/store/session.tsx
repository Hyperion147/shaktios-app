import * as React from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { restoreSession, signIn as apiSignIn, signOut as apiSignOut, signUp as apiSignUp } from '@/src/api/auth';
import { fetchVenue } from '@/src/api/events';
import { normalizeError, setAuthToken } from '@/src/api/client';
import { getSupabase } from '@/src/api/supabase';
import { isSupabaseConfigured } from '@/src/constants/config';
import type { ReportLocation, User, VenueEvent, IncidentCategoryId } from '@/src/types';

const SELECTED_VENUE_KEY = 'shaktios.selectedVenueId';
let webVenueId: string | null = null;

async function getSelectedVenueId(): Promise<string | null> {
  return Platform.OS === 'web' ? webVenueId : SecureStore.getItemAsync(SELECTED_VENUE_KEY);
}

async function saveSelectedVenueId(id: string | null): Promise<void> {
  if (Platform.OS === 'web') { webVenueId = id; return; }
  if (id) await SecureStore.setItemAsync(SELECTED_VENUE_KEY, id);
  else await SecureStore.deleteItemAsync(SELECTED_VENUE_KEY);
}

interface ReportDraft {
  category: IncidentCategoryId;
  description: string;
  zoneId: string | null;
  locationLabel: string;
  urgency: 'low' | 'medium' | 'high';
}

interface SessionState {
  initializing: boolean;
  sessionError: string | null;
  user: User | null;
  token: string | null;
  activeEvent: VenueEvent | null;
  eventLoading: boolean;
  eventError: string | null;
  refreshEvent: () => Promise<void>;
  draft: ReportDraft;
  login: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  joinEvent: (event: VenueEvent) => void;
  leaveEvent: () => void;
  validateEventId: (eventId: string) => Promise<VenueEvent | null>;
  setDraft: (patch: Partial<ReportDraft>) => void;
  pendingLocation: ReportLocation | null;
  setPendingLocation: (loc: ReportLocation | null) => void;
}

const SessionContext = React.createContext<SessionState | null>(null);
const DEFAULT_DRAFT: ReportDraft = {
  category: 'crowd', description: '', zoneId: null, locationLabel: '', urgency: 'medium',
};

function toUser(id: string, email: string | null): User {
  return { id, name: email ? email.split('@')[0] : 'Citizen', role: 'citizen', ...(email ? { email } : {}) };
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [initializing, setInitializing] = React.useState(true);
  const [sessionError, setSessionError] = React.useState<string | null>(null);
  const [user, setUser] = React.useState<User | null>(null);
  const [token, setToken] = React.useState<string | null>(null);
  const [activeEvent, setActiveEvent] = React.useState<VenueEvent | null>(null);
  const [eventLoading, setEventLoading] = React.useState(true);
  const [eventError, setEventError] = React.useState<string | null>(null);
  const [draft, setDraftState] = React.useState<ReportDraft>(DEFAULT_DRAFT);
  const [pendingLocation, setPendingLocation] = React.useState<ReportLocation | null>(null);
  const userRef = React.useRef<User | null>(null);
  const selectedIdRef = React.useRef<string | null>(null);
  const selectionRevision = React.useRef(0);
  const metadataRequest = React.useRef(0);
  const storageQueue = React.useRef(Promise.resolve());
  const mountedRef = React.useRef(true);

  React.useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const persistSelection = React.useCallback((id: string | null) => {
    // Preserve the ordering of rapid join/leave actions in native storage.
    storageQueue.current = storageQueue.current.then(async () => {
      try { await saveSelectedVenueId(id); }
      catch {
        if (mountedRef.current) setEventError('The event selection could not be saved on this device. Select it again to retry.');
      }
    });
  }, []);

  const refreshEvent = React.useCallback(async () => {
    const id = selectedIdRef.current;
    if (!id) return;
    const request = ++metadataRequest.current;
    setEventLoading(true);
    setEventError(null);
    try {
      const event = await fetchVenue(id);
      if (!mountedRef.current || request !== metadataRequest.current || selectedIdRef.current !== id) return;
      setActiveEvent(event);
      setDraftState((current) => {
        const zone = event.zones.find((item) => item.id === current.zoneId);
        return { ...current, zoneId: zone?.id ?? null, locationLabel: zone?.label ?? '' };
      });
    } catch (error) {
      if (!mountedRef.current || request !== metadataRequest.current || selectedIdRef.current !== id) return;
      const normalized = normalizeError(error);
      if (normalized.status === 404) setActiveEvent(null);
      setEventError(normalized.status === 404
        ? 'The selected event is no longer available. Choose another event or retry.'
        : normalized.message);
    } finally {
      if (mountedRef.current && request === metadataRequest.current) setEventLoading(false);
    }
  }, []);

  React.useEffect(() => {
    let mounted = true;
    let unsubscribe: (() => void) | undefined;
    const applySession = (session: { user: User; token: string } | null) => {
      if (!mounted) return;
      const previousId = userRef.current?.id;
      userRef.current = session?.user ?? null;
      setUser(session?.user ?? null);
      setToken(session?.token ?? null);
      setAuthToken(session?.token ?? null);
      if (previousId && previousId !== session?.user.id) {
        setDraftState(DEFAULT_DRAFT);
        setPendingLocation(null);
      }
    };
    (async () => {
      try {
        // Use the restored session before installing the listener; do not
        // route away on a transient null INITIAL_SESSION during persistence.
        applySession(await restoreSession());
      } catch (error) {
        applySession(null);
        if (mounted) setSessionError(`Could not restore your session. Please sign in again. ${normalizeError(error).message}`);
      } finally {
        if (mounted) setInitializing(false);
      }
      if (!isSupabaseConfigured() || !mounted) return;
      try {
        const { data } = getSupabase().auth.onAuthStateChange((event, nextSession) => {
          if (!mounted) return;
          if (event === 'INITIAL_SESSION' && !nextSession && userRef.current) return;
          applySession(nextSession?.user && nextSession.access_token
            ? { user: toUser(nextSession.user.id, nextSession.user.email ?? null), token: nextSession.access_token }
            : null);
        });
        unsubscribe = () => data.subscription.unsubscribe();
      } catch (error) {
        if (mounted) setSessionError(normalizeError(error).message);
      }
    })();
    return () => { mounted = false; unsubscribe?.(); };
  }, []);

  React.useEffect(() => {
    let mounted = true;
    const revision = selectionRevision.current;
    (async () => {
      try {
        const id = await getSelectedVenueId();
        if (!mounted || revision !== selectionRevision.current) return;
        selectedIdRef.current = id;
        if (id) await refreshEvent();
        else setEventLoading(false);
      } catch {
        if (mounted && revision === selectionRevision.current) {
          setEventLoading(false);
          setEventError('Could not restore the event selection from this device. Select an event again.');
        }
      }
    })();
    return () => { mounted = false; };
  }, [refreshEvent]);

  const login = React.useCallback(async (email: string, password: string) => {
    // The sign-in response is authoritative; avoid a second getSession read
    // racing SecureStore immediately after successful login.
    const session = await apiSignIn(email, password);
    setSessionError(null);
    setUser(session.user);
    setToken(session.token);
    userRef.current = session.user;
    setAuthToken(session.token);
  }, []);

  const signUp = React.useCallback(async (email: string, password: string) => {
    const session = await apiSignUp(email, password);
    setSessionError(null);
    setUser(session.user);
    setToken(session.token);
    userRef.current = session.user;
    setAuthToken(session.token);
  }, []);

  const logout = React.useCallback(async () => {
    await apiSignOut();
    setAuthToken(null);
    userRef.current = null;
    setUser(null);
    setToken(null);
    setSessionError(null);
    setDraftState(DEFAULT_DRAFT);
    setPendingLocation(null);
  }, []);

  const validateEventId = React.useCallback(async (eventId: string) => {
    try { return await fetchVenue(eventId.trim()); }
    catch (error) {
      if (normalizeError(error).status === 404) return null;
      throw error;
    }
  }, []);

  const joinEvent = React.useCallback((event: VenueEvent) => {
    ++selectionRevision.current;
    ++metadataRequest.current;
    selectedIdRef.current = event.id;
    setActiveEvent(event);
    setEventError(null);
    setEventLoading(false);
    // Do not guess a report's location: the citizen explicitly selects a zone.
    setDraftState((current) => ({ ...current, zoneId: null, locationLabel: '' }));
    setPendingLocation(null);
    persistSelection(event.id);
  }, [persistSelection]);

  const leaveEvent = React.useCallback(() => {
    ++selectionRevision.current;
    ++metadataRequest.current;
    selectedIdRef.current = null;
    setActiveEvent(null);
    setEventError(null);
    setEventLoading(false);
    setDraftState((current) => ({ ...current, zoneId: null, locationLabel: '' }));
    setPendingLocation(null);
    persistSelection(null);
  }, [persistSelection]);

  const setDraft = React.useCallback(
    (patch: Partial<ReportDraft>) => setDraftState((current) => ({ ...current, ...patch })), []);

  const value = React.useMemo(() => ({
    initializing, sessionError, user, token, activeEvent, eventLoading, eventError, refreshEvent,
    draft, pendingLocation, setPendingLocation, login, signUp, logout, joinEvent, leaveEvent, validateEventId, setDraft,
  }), [initializing, sessionError, user, token, activeEvent, eventLoading, eventError, refreshEvent,
    draft, pendingLocation, login, signUp, logout, joinEvent, leaveEvent, validateEventId, setDraft]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionState {
  const ctx = React.useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside SessionProvider');
  return ctx;
}
