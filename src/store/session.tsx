import * as React from 'react';
import * as SecureStore from 'expo-secure-store';
import * as Location from 'expo-location';
import { Platform } from 'react-native';
import { restoreSession, signIn as apiSignIn, signOut as apiSignOut, signUp as apiSignUp } from '@/src/api/auth';
import { fetchVenue } from '@/src/api/events';
import { normalizeError, setAuthToken } from '@/src/api/client';
import { getSupabase } from '@/src/api/supabase';
import { isSupabaseConfigured } from '@/src/constants/config';
import { captureLocation } from '@/src/utils/location';
import type { ReportLocation, User, VenueEvent, IncidentCategoryId } from '@/src/types';
import type { VoiceProvenance } from '@/src/types/voice';

const SELECTED_VENUE_KEY = 'shaktios.selectedVenueId';
const LOCATION_SETUP_KEY = 'shaktios.locationSetupDone';
let webVenueId: string | null = null;
let webLocationSetupDone = false;

async function getLocationSetupDone(): Promise<boolean> {
  if (Platform.OS === 'web') return webLocationSetupDone;
  try {
    return (await SecureStore.getItemAsync(LOCATION_SETUP_KEY)) === '1';
  } catch {
    return false;
  }
}

async function saveLocationSetupDone(): Promise<void> {
  if (Platform.OS === 'web') { webLocationSetupDone = true; return; }
  try {
    await SecureStore.setItemAsync(LOCATION_SETUP_KEY, '1');
  } catch {
    // Setup repeats next launch; the OS permission itself persists.
  }
}

export type DeviceLocationStatus = 'unknown' | 'granted' | 'denied';

async function getSelectedVenueId(): Promise<string | null> {
  return Platform.OS === 'web' ? webVenueId : SecureStore.getItemAsync(SELECTED_VENUE_KEY);
}

async function saveSelectedVenueId(id: string | null): Promise<void> {
  if (Platform.OS === 'web') { webVenueId = id; return; }
  if (id) await SecureStore.setItemAsync(SELECTED_VENUE_KEY, id);
  else await SecureStore.deleteItemAsync(SELECTED_VENUE_KEY);
}

export interface DraftPhoto {
  id: string;
  localUri: string;
  remoteUrl: string | null;
  uploading: boolean;
  error: string | null;
}

interface ReportDraft {
  category: IncidentCategoryId;
  description: string;
  zoneId: string | null;
  locationLabel: string;
  urgency: 'low' | 'medium' | 'high';
  /** True once the citizen picks urgency manually; stops priority-assist auto-apply. */
  urgencyTouched: boolean;
  /** Compressed photo evidence; remoteUrl set after bucket upload. */
  photos: DraftPhoto[];
  /** Transient review context; never persisted as a recording or raw transcript. */
  voice: VoiceProvenance | null;
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
  resetDraft: () => void;
  /** Capture before async work; invalidated by account, venue or draft changes. */
  getDraftRevision: () => number;
  pendingLocation: ReportLocation | null;
  setPendingLocation: (loc: ReportLocation | null) => void;
  /** Device GPS granted at setup; auto-attached to reports when fresh. */
  deviceLocation: ReportLocation | null;
  deviceLocationStatus: DeviceLocationStatus;
  locationSetupDone: boolean;
  locationLoading: boolean;
  /** Prompt for permission (setup screen), warm-capture, and remember setup. */
  requestSetupLocation: () => Promise<ReportLocation | null>;
  /** Silent refresh without prompting; null when not granted or unavailable. */
  refreshDeviceLocation: (timeoutMs?: number) => Promise<ReportLocation | null>;
  completeLocationSetup: (granted: boolean) => Promise<void>;
  addDraftPhotos: (photos: DraftPhoto[]) => void;
  updateDraftPhoto: (id: string, patch: Partial<DraftPhoto>) => void;
  removeDraftPhoto: (id: string) => void;
}

const SessionContext = React.createContext<SessionState | null>(null);
const DEFAULT_DRAFT: ReportDraft = {
  category: 'crowd', description: '', zoneId: null, locationLabel: '', urgency: 'medium',
  urgencyTouched: false, photos: [], voice: null,
};

export function newPhotoId(): string {
  return `${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
}

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
  const [deviceLocation, setDeviceLocation] = React.useState<ReportLocation | null>(null);
  const [deviceLocationStatus, setDeviceLocationStatus] = React.useState<DeviceLocationStatus>('unknown');
  const [locationSetupDone, setLocationSetupDone] = React.useState(false);
  const [locationLoading, setLocationLoading] = React.useState(true);
  const locationRefreshInFlight = React.useRef(false);
  const userRef = React.useRef<User | null>(null);
  const draftRevision = React.useRef(0);
  const getDraftRevision = React.useCallback(() => draftRevision.current, []);
  const updatePendingLocation = React.useCallback((loc: ReportLocation | null) => {
    ++draftRevision.current;
    setPendingLocation(loc);
  }, []);
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
      ++draftRevision.current;
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
      setAuthToken(session?.token ?? null, session?.user.id ?? null);
      if (previousId !== session?.user.id) {
        ++draftRevision.current;
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
    (async () => {
      const done = await getLocationSetupDone();
      if (!mounted) return;
      setLocationSetupDone(done);
      setLocationLoading(false);
      if (!done) return;
      // Warm the auto-attach fix silently on launch; failures stay zone-only.
      try {
        const permission = await Location.getForegroundPermissionsAsync();
        if (!mounted) return;
        if (permission.status !== 'granted') {
          setDeviceLocationStatus('denied');
          return;
        }
        setDeviceLocationStatus('granted');
        const location = await captureLocation();
        if (mounted) {
          setDeviceLocation(location);
          setPendingLocation(location);
        }
      } catch {
        // Zone-only reporting still works.
      }
    })();
    return () => { mounted = false; };
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
    if (userRef.current?.id !== session.user.id) {
      ++draftRevision.current;
      setDraftState(DEFAULT_DRAFT);
      setPendingLocation(null);
    }
    setUser(session.user);
    setToken(session.token);
    userRef.current = session.user;
    setAuthToken(session.token, session.user.id);
  }, []);

  const signUp = React.useCallback(async (email: string, password: string) => {
    const session = await apiSignUp(email, password);
    setSessionError(null);
    if (userRef.current?.id !== session.user.id) {
      ++draftRevision.current;
      setDraftState(DEFAULT_DRAFT);
      setPendingLocation(null);
    }
    setUser(session.user);
    setToken(session.token);
    userRef.current = session.user;
    setAuthToken(session.token, session.user.id);
  }, []);

  const logout = React.useCallback(async () => {
    await apiSignOut();
    setAuthToken(null, null);
    ++draftRevision.current;
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
    // Manual observations are venue-scoped too; never carry private details across venues.
    ++draftRevision.current;
    setDraftState(DEFAULT_DRAFT);
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
    ++draftRevision.current;
    setDraftState(DEFAULT_DRAFT);
    setPendingLocation(null);
    persistSelection(null);
  }, [persistSelection]);

  const setDraft = React.useCallback((patch: Partial<ReportDraft>) => {
    ++draftRevision.current;
    setDraftState((current) => ({ ...current, ...patch }));
  }, []);

  const addDraftPhotos = React.useCallback((photos: DraftPhoto[]) => {
    if (!photos.length) return;
    ++draftRevision.current;
    setDraftState((current) => {
      const room = Math.max(0, 3 - current.photos.length);
      const fresh = photos.slice(0, room);
      return fresh.length ? { ...current, photos: [...current.photos, ...fresh] } : current;
    });
  }, []);

  const updateDraftPhoto = React.useCallback((id: string, patch: Partial<DraftPhoto>) => {
    ++draftRevision.current;
    setDraftState((current) => ({
      ...current,
      photos: current.photos.map((photo) => (photo.id === id ? { ...photo, ...patch } : photo)),
    }));
  }, []);

  const removeDraftPhoto = React.useCallback((id: string) => {
    ++draftRevision.current;
    setDraftState((current) => ({ ...current, photos: current.photos.filter((photo) => photo.id !== id) }));
  }, []);

  /** Silent GPS refresh; never prompts. Resolves null when not granted. */
  const refreshDeviceLocation = React.useCallback(async (timeoutMs = 10_000): Promise<ReportLocation | null> => {
    if (locationRefreshInFlight.current) return null;
    locationRefreshInFlight.current = true;
    try {
      const permission = await Location.getForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        if (mountedRef.current) setDeviceLocationStatus('denied');
        return null;
      }
      const location = await captureLocation(timeoutMs);
      if (!mountedRef.current) return null;
      setDeviceLocationStatus('granted');
      setDeviceLocation(location);
      return location;
    } catch {
      return null;
    } finally {
      locationRefreshInFlight.current = false;
    }
  }, []);

  /** Setup-screen flow: prompt once, warm-capture, remember the choice. */
  const requestSetupLocation = React.useCallback(async (): Promise<ReportLocation | null> => {
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        if (mountedRef.current) {
          setDeviceLocationStatus('denied');
          setDeviceLocation(null);
        }
        await saveLocationSetupDone();
        if (mountedRef.current) setLocationSetupDone(true);
        return null;
      }
      const location = await captureLocation();
      if (mountedRef.current) {
        setDeviceLocationStatus('granted');
        setDeviceLocation(location);
        setPendingLocation(location);
      }
      await saveLocationSetupDone();
      if (mountedRef.current) setLocationSetupDone(true);
      return location;
    } catch {
      await saveLocationSetupDone();
      if (mountedRef.current) setLocationSetupDone(true);
      return null;
    }
  }, []);

  const completeLocationSetup = React.useCallback(async (granted: boolean): Promise<void> => {
    if (mountedRef.current) {
      setDeviceLocationStatus(granted ? 'granted' : 'denied');
      setLocationSetupDone(true);
    }
    await saveLocationSetupDone();
  }, []);

  const resetDraft = React.useCallback(() => {
    ++draftRevision.current;
    setDraftState(DEFAULT_DRAFT);
    setPendingLocation(null);
  }, []);

  const value = React.useMemo(() => ({
    initializing, sessionError, user, token, activeEvent, eventLoading, eventError, refreshEvent,
    draft, pendingLocation, setPendingLocation: updatePendingLocation, getDraftRevision, login, signUp, logout, joinEvent, leaveEvent, validateEventId, setDraft, resetDraft,
    deviceLocation, deviceLocationStatus, locationSetupDone, locationLoading, requestSetupLocation, refreshDeviceLocation, completeLocationSetup,
    addDraftPhotos, updateDraftPhoto, removeDraftPhoto,
  }), [initializing, sessionError, user, token, activeEvent, eventLoading, eventError, refreshEvent,
    draft, pendingLocation, updatePendingLocation, getDraftRevision, login, signUp, logout, joinEvent, leaveEvent, validateEventId, setDraft, resetDraft,
    deviceLocation, deviceLocationStatus, locationSetupDone, locationLoading, requestSetupLocation, refreshDeviceLocation, completeLocationSetup,
    addDraftPhotos, updateDraftPhoto, removeDraftPhoto]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionState {
  const ctx = React.useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside SessionProvider');
  return ctx;
}
