import { getAuthToken } from '../../utils/authToken.js';
import { collectSystemContext } from '../../features/feedback/utils/collectSystemContext';

type CollectAdvancedFn =
  | ((ctx: Record<string, unknown>) => Record<string, unknown>)
  | null;
let _collectAdvanced: CollectAdvancedFn = null;
import('../../features/monitoring/ErrorMonitoring.jsx')
  .then(m => {
    _collectAdvanced = m.collectAdvancedErrorContext as CollectAdvancedFn;
  })
  .catch(() => {
    /* monitoring module unavailable â€” degrade gracefully */
  });

// â”€â”€ Ingest endpoints â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const _apiOrigin: string =
  (typeof import.meta !== 'undefined' &&
    import.meta.env &&
    import.meta.env.VITE_API_URL) ??
  '';
const INGEST_ERRORS = `${_apiOrigin}/api/v1/infra/errors/log`;
const INGEST_FEEDBACK = `${_apiOrigin}/api/v1/feedback`;

function normaliseEnvironment(
  mode: string | undefined
): 'development' | 'production' {
  if (mode === 'development') return 'development';
  return 'production';
}

function hashString(str: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h * 0x01000193) >>> 0;
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

export function buildErrorId(
  message: string,
  pathname: string,
  appType: string
): string {
  const seed = `${message || 'unknown'}-${pathname}-${appType}-${Date.now()}`;
  return `ERR-${hashString(seed).toUpperCase()}`;
}

export interface UserContext {
  isAuthenticated: boolean;
  userId: string | null;
  userEmail: string | null;
  userRole: string | null;
}

export function getUserContext(): UserContext {
  try {
    let userInfo: Record<string, unknown> = {};
    for (const key of ['user', 'uni_manager_auth', 'auth_user']) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      try {
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        userInfo = (parsed?.user as Record<string, unknown>) || parsed || {};
        if (userInfo.id || userInfo._id) break;
      } catch (_) {
        /* malformed JSON */
      }
    }
    return {
      isAuthenticated: !!(userInfo.id || userInfo._id),
      userId: (userInfo.id || userInfo._id || null) as string | null,
      userEmail: (userInfo.email || userInfo.userEmail || null) as
        | string
        | null,
      userRole: (userInfo.role || null) as string | null
    };
  } catch (_) {
    return {
      isAuthenticated: false,
      userId: null,
      userEmail: null,
      userRole: null
    };
  }
}

export interface TelemetryPayload {
  message: string;
  stack: string;
  componentStack: string;
  severity: string;
  category: string;
  appType: string;
  environment: 'development' | 'production';
  timestamp: string;
  url: string;
  path: string;
  userAgent: string;
  userId: string | null;
  userEmail: string | null;
  errorId?: string;
  meta: Record<string, unknown>;
}

export function collectTelemetry(
  error: Error | null,
  errorInfo: React.ErrorInfo | null,
  appType: string
): TelemetryPayload {
  const user = getUserContext();
  const w = typeof window !== 'undefined' ? window : null;
  const n = typeof navigator !== 'undefined' ? navigator : null;
  const s = typeof screen !== 'undefined' ? screen : null;
  const p = typeof performance !== 'undefined' ? performance : null;

  return {
    message: error?.message || 'Unknown error',
    stack: error?.stack || '',
    componentStack: errorInfo?.componentStack || '',
    severity: 'critical',
    category: 'rendering',
    appType: appType || (import.meta as any).env?.VITE_APP_TYPE || 'unknown',
    environment: normaliseEnvironment((import.meta as any).env?.MODE),
    timestamp: new Date().toISOString(),
    url: w?.location.href || '',
    path: w?.location.pathname || '',
    userAgent: n?.userAgent || '',
    userId: user.userId,
    userEmail: user.userEmail,
    meta: {
      appVersion: (import.meta as any).env?.VITE_APP_VERSION || 'unknown',
      userRole: user.userRole || 'guest',
      os: n?.platform || 'unknown',
      userContext: user,
      viewport: w ? { width: w.innerWidth, height: w.innerHeight } : null,
      screen: s ? { width: s.width, height: s.height } : null,
      memoryMB: (p as Performance & { memory?: { usedJSHeapSize: number } })
        ?.memory
        ? Math.round(
            (p as Performance & { memory: { usedJSHeapSize: number } }).memory
              .usedJSHeapSize /
              1024 /
              1024
          )
        : null
    }
  };
}

export function flushPendingErrorReports(appType?: string): void {
  if (typeof localStorage === 'undefined') return;
  try {
    const pending = JSON.parse(
      localStorage.getItem('pendingErrorReports') || '[]'
    ) as TelemetryPayload[];
    if (!pending.length) return;
    localStorage.removeItem('pendingErrorReports');
    const resolvedType = appType || (import.meta as any).env?.VITE_APP_TYPE;
    const token = getAuthToken(resolvedType);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    pending.forEach(report => {
      fetch(INGEST_ERRORS, {
        method: 'POST',
        headers,
        body: JSON.stringify({ ...report, _retried: true })
      }).catch(() => {
        /* still failing â€” drop silently */
      });
    });
  } catch (_) {
    /* localStorage unavailable */
  }
}

export function reportError(
  telemetry: TelemetryPayload,
  appType: string
): void {
  const token = getAuthToken(appType);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let fullMeta = { ...telemetry.meta };
  if (_collectAdvanced) {
    const advanced = _collectAdvanced({});
    fullMeta = {
      ...fullMeta,
      performanceInfo:
        (advanced as Record<string, unknown>).performanceInfo || null,
      browserContext:
        (advanced as Record<string, unknown>).browserContext || null,
      capabilities: (advanced as Record<string, unknown>).capabilities || null,
      recentActivity: (advanced as Record<string, unknown>).recentActivity || []
    };
  }

  const ingestPayload = { ...telemetry, meta: fullMeta };

  const userRole =
    (telemetry.meta?.userContext as UserContext | undefined)?.userRole || null;
  const systemCtx = collectSystemContext(
    telemetry.appType,
    telemetry.userId
      ? {
          id: telemetry.userId,
          email: telemetry.userEmail,
          name: null,
          role: userRole,
          appRole: userRole
        }
      : null
  );

  const feedbackPayload = {
    type: 'error-report',
    priority: 10,
    category: 'bug',
    severity: 'critical',
    userInput: {
      title: `[Auto] Crash: ${telemetry.message}`.substring(0, 200),
      description: [
        `**Error:** ${telemetry.message}`,
        `**Error ID:** ${telemetry.errorId || '(none)'}`,
        `**App:** ${telemetry.appType}  **Path:** ${telemetry.path}`,
        '',
        '**Component Stack:**',
        '```',
        telemetry.componentStack || '(unavailable)',
        '```'
      ]
        .join('\n')
        .substring(0, 1000),
      allowContact: false
    },
    systemContext: {
      ...systemCtx,
      source: 'error-boundary',
      errors: [
        {
          message: telemetry.message,
          stack: telemetry.stack,
          timestamp: new Date(telemetry.timestamp || Date.now()),
          level: 'error'
        }
      ]
    },
    linkedErrorId: telemetry.errorId
  };

  Promise.all([
    fetch(INGEST_ERRORS, {
      method: 'POST',
      headers,
      body: JSON.stringify(ingestPayload)
    }),
    fetch(INGEST_FEEDBACK, {
      method: 'POST',
      headers,
      body: JSON.stringify(feedbackPayload)
    })
  ]).catch(() => {
    try {
      const safe = {
        errorId: telemetry.errorId,
        message: telemetry.message,
        severity: telemetry.severity,
        category: telemetry.category,
        appType: telemetry.appType,
        path: telemetry.path,
        timestamp: telemetry.timestamp,
        environment: telemetry.environment
      };
      const pending = JSON.parse(
        localStorage.getItem('pendingErrorReports') || '[]'
      ) as unknown[];
      pending.push(safe);
      localStorage.setItem(
        'pendingErrorReports',
        JSON.stringify(pending.slice(-10))
      );
    } catch (_) {
      /* localStorage unavailable */
    }
  });
}
