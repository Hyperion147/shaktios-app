import * as React from 'react';
import { restoreSession, signIn as apiSignIn, signOut as apiSignOut } from '@/src/api/auth';
import { setAuthToken } from '@/src/api/client';
import { MOCK_VENUE_EVENTS } from '@/src/constants/config';
import type { CitizenReport, ReportLocation, User, VenueEvent } from '@/src/types';

interface ReportDraft {
  category: CitizenReport['category'];
  description: string;
  locationLabel: string;
  urgency: CitizenReport['urgency'];
  /** Local-only until backend supports media upload. */
  photoUri: string | null;
}

interface SessionState {
  initializing: boolean;
  user: User | null;
  token: string | null;
  activeEvent: VenueEvent | null;
  myReports: CitizenReport[];
  draft: ReportDraft;
  login: (identifier: string) => Promise<void>;
  logout: () => Promise<void>;
  joinEvent: (event: VenueEvent) => void;
  leaveEvent: () => void;
  validateEventId: (eventId: string) => VenueEvent | null;
  setDraft: (patch: Partial<ReportDraft>) => void;
  pendingLocation: ReportLocation | null;
  setPendingLocation: (loc: ReportLocation | null) => void;
  addReport: (report: CitizenReport) => void;
}

const SessionContext = React.createContext<SessionState | null>(null);

const DEFAULT_DRAFT: ReportDraft = {
  category: 'crowd',
  description: '',
  locationLabel: '',
  urgency: 'normal',
  photoUri: null,
};

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [initializing, setInitializing] = React.useState(true);
  const [user, setUser] = React.useState<User | null>(null);
  const [token, setToken] = React.useState<string | null>(null);
  const [activeEvent, setActiveEvent] = React.useState<VenueEvent | null>(null);
  const [myReports, setMyReports] = React.useState<CitizenReport[]>([]);
  const [draft, setDraftState] = React.useState<ReportDraft>(DEFAULT_DRAFT);
  const [pendingLocation, setPendingLocation] = React.useState<ReportLocation | null>(null);

  React.useEffect(() => {
    (async () => {
      const session = await restoreSession();
      if (session) {
        setUser(session.user);
        setToken(session.token);
        setAuthToken(session.token);
      }
      setInitializing(false);
    })();
  }, []);

  const login = React.useCallback(async (identifier: string) => {
    const session = await apiSignIn(identifier);
    setUser(session.user);
    setToken(session.token);
    setAuthToken(session.token);
  }, []);

  const logout = React.useCallback(async () => {
    await apiSignOut();
    setAuthToken(null);
    setUser(null);
    setToken(null);
    setActiveEvent(null);
    setMyReports([]);
    setDraftState(DEFAULT_DRAFT);
    setPendingLocation(null);
  }, []);

  const validateEventId = React.useCallback(
    (eventId: string) => MOCK_VENUE_EVENTS.find((e) => e.id === eventId) ?? null,
    [],
  );

  const joinEvent = React.useCallback((event: VenueEvent) => {
    setActiveEvent(event);
    setDraftState((d) => ({ ...d, locationLabel: d.locationLabel || event.locationLabel || '' }));
  }, []);

  const leaveEvent = React.useCallback(() => setActiveEvent(null), []);
  const setDraft = React.useCallback(
    (patch: Partial<ReportDraft>) => setDraftState((d) => ({ ...d, ...patch })),
    [],
  );
  const addReport = React.useCallback(
    (report: CitizenReport) => setMyReports((prev) => [report, ...prev]),
    [],
  );

  const value = React.useMemo(
    () => ({
      initializing,
      user,
      token,
      activeEvent,
      myReports,
      draft,
      pendingLocation,
      setPendingLocation,
      login,
      logout,
      joinEvent,
      leaveEvent,
      validateEventId,
      setDraft,
      addReport,
    }),
    [initializing, user, token, activeEvent, myReports, draft, pendingLocation, login, logout, joinEvent, leaveEvent, validateEventId, setDraft, setPendingLocation, addReport],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionState {
  const ctx = React.useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside SessionProvider');
  return ctx;
}
