import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
} from "react";
import {
  ChurchIcon,
  LockIcon,
  BriefcaseIcon,
  HomeIcon,
  UserIcon,
  SpeakerIcon,
} from "../../components/icons";

// ── Types ─────────────────────────────────────────────────────────────────────

interface AppInfo {
  id: string;
  name: string;
  icon: React.ReactNode;
  [key: string]: unknown;
}

interface AppSession {
  appId: string;
  timestamp: string;
  status: "active" | "inactive";
}

interface SSOState {
  currentApp: string | null;
  availableApps: AppInfo[];
  appSessions: Record<string, AppSession>;
  ssoLoading: boolean;
  ssoError: string | null;
  userAppPermissions: Record<string, number>;
}

type SSOAction =
  | { type: "SET_CURRENT_APP"; payload: string }
  | { type: "SET_AVAILABLE_APPS"; payload: AppInfo[] }
  | { type: "SET_APP_SESSION"; payload: { appId: string; session: AppSession } }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_USER_PERMISSIONS"; payload: Record<string, number> }
  | { type: "RESET_SSO" };

interface SSOConfig {
  availableApps?: AppInfo[];
  initialApp?: string;
  userPermissions?: Record<string, number>;
}

interface SSOContextValue extends SSOState {
  switchToApp: (appId: string) => Promise<void>;
  hasAppPermission: (appId: string) => boolean;
  getAppInfo: (appId: string) => AppInfo | null;
  getAppSession: (appId: string) => AppSession | null;
  resetSSO: () => void;
}

// ── Context ───────────────────────────────────────────────────────────────────

export const SSOContext = createContext<SSOContextValue | null>(null);

// ── Reducer ───────────────────────────────────────────────────────────────────

const initialState: SSOState = {
  currentApp: null,
  availableApps: [],
  appSessions: {},
  ssoLoading: true,
  ssoError: null,
  userAppPermissions: {},
};

const DEFAULT_APPS: AppInfo[] = [
  { id: "church", name: "Church", icon: <ChurchIcon size={18} /> },
  { id: "admin", name: "Administration", icon: <LockIcon size={18} /> },
  { id: "business", name: "Business", icon: <BriefcaseIcon size={18} /> },
  { id: "home", name: "Home Services", icon: <HomeIcon size={18} /> },
  { id: "personal", name: "Personal", icon: <UserIcon size={18} /> },
  { id: "playback", name: "Playback", icon: <SpeakerIcon size={18} /> },
];

function ssoReducer(state: SSOState, action: SSOAction): SSOState {
  switch (action.type) {
    case "SET_CURRENT_APP":
      return { ...state, currentApp: action.payload };
    case "SET_AVAILABLE_APPS":
      return { ...state, availableApps: action.payload };
    case "SET_APP_SESSION":
      return {
        ...state,
        appSessions: {
          ...state.appSessions,
          [action.payload.appId]: action.payload.session,
        },
      };
    case "SET_LOADING":
      return { ...state, ssoLoading: action.payload };
    case "SET_ERROR":
      return { ...state, ssoError: action.payload };
    case "SET_USER_PERMISSIONS":
      return { ...state, userAppPermissions: action.payload };
    case "RESET_SSO":
      return initialState;
    default:
      return state;
  }
}

// ── SSOProvider ───────────────────────────────────────────────────────────────

interface SSOProviderProps {
  children: React.ReactNode;
  config?: SSOConfig;
}

export const SSOProvider: React.FC<SSOProviderProps> = ({
  children,
  config = {},
}) => {
  const [state, dispatch] = useReducer(ssoReducer, initialState);

  useEffect(() => {
    const initializeSSO = async () => {
      try {
        dispatch({ type: "SET_LOADING", payload: true });
        const apps = config.availableApps ?? DEFAULT_APPS;
        dispatch({ type: "SET_AVAILABLE_APPS", payload: apps });
        dispatch({
          type: "SET_CURRENT_APP",
          payload: config.initialApp ?? "church",
        });
        dispatch({
          type: "SET_USER_PERMISSIONS",
          payload: config.userPermissions ?? {},
        });
        dispatch({ type: "SET_LOADING", payload: false });
      } catch (error) {
        if (import.meta.env.DEV)
          console.error("SSO initialization failed:", error);
        dispatch({ type: "SET_ERROR", payload: (error as Error).message });
        dispatch({ type: "SET_LOADING", payload: false });
      }
    };
    initializeSSO();
  }, [config]);

  const hasAppPermission = useCallback(
    (appId: string): boolean => {
      const permission = state.userAppPermissions[appId];
      return permission !== undefined ? permission > 0 : true;
    },
    [state.userAppPermissions],
  );

  const switchToApp = useCallback(
    async (appId: string): Promise<void> => {
      try {
        dispatch({ type: "SET_ERROR", payload: null });
        if (!state.availableApps.find((app) => app.id === appId)) {
          throw new Error(`Unknown app: ${appId}`);
        }
        if (!hasAppPermission(appId)) {
          throw new Error(`No permission to access app: ${appId}`);
        }
        dispatch({ type: "SET_CURRENT_APP", payload: appId });
        dispatch({
          type: "SET_APP_SESSION",
          payload: {
            appId,
            session: {
              appId,
              timestamp: new Date().toISOString(),
              status: "active",
            },
          },
        });
      } catch (error) {
        if (import.meta.env.DEV) console.error("App switch failed:", error);
        dispatch({ type: "SET_ERROR", payload: (error as Error).message });
        throw error;
      }
    },
    [state.availableApps, hasAppPermission],
  );

  const getAppInfo = useCallback(
    (appId: string): AppInfo | null =>
      state.availableApps.find((app) => app.id === appId) ?? null,
    [state.availableApps],
  );

  const getAppSession = useCallback(
    (appId: string): AppSession | null => state.appSessions[appId] ?? null,
    [state.appSessions],
  );

  const resetSSO = useCallback(() => dispatch({ type: "RESET_SSO" }), []);

  const value: SSOContextValue = {
    ...state,
    switchToApp,
    hasAppPermission,
    getAppInfo,
    getAppSession,
    resetSSO,
  };

  return <SSOContext.Provider value={value}>{children}</SSOContext.Provider>;
};

// ── useSSO ────────────────────────────────────────────────────────────────────

export const useSSO = (): SSOContextValue => {
  const context = useContext(SSOContext);
  if (!context) throw new Error("useSSO must be used within an SSOProvider");
  return context;
};

// ── withSSO HOC ───────────────────────────────────────────────────────────────

export const withSSO = <P extends object>(
  Component: React.ComponentType<P & { sso: SSOContextValue }>,
): React.FC<P> => {
  return function WithSSOComponent(props: P) {
    const ssoContext = useSSO();
    return <Component {...props} sso={ssoContext} />;
  };
};

export default SSOContext;
