/**
 * getAuthToken — shared auth token probe for fire-and-forget monitoring fetches.
 *
 * Kept in @shared/utils to break the circular dependency that would arise if
 * ErrorBoundary and ErrorMonitoring imported from each other directly.
 *
 * Checks sessionStorage first (short-lived tab session), then localStorage
 * (remember-me / longer session), across all known app namespaces.
 * The appType argument is tried first so the "home" app preferentially picks
 * up its own token over a stale "church" token from a previous tab.
 */

const TOKEN_NAMESPACES = [
  "admin",
  "home",
  "church",
  "personal",
  "business",
  "uni",
] as const;
type TokenNamespace = (typeof TOKEN_NAMESPACES)[number];

export function getAuthToken(appType?: string): string | null {
  if (typeof window === "undefined") return null;
  const namespaces: string[] = [appType, ...TOKEN_NAMESPACES].filter(
    (ns): ns is string => typeof ns === "string" && ns.length > 0,
  );
  // Deduplicate in case appType is already in the namespaces list
  const seen = new Set<string>();
  for (const ns of namespaces) {
    if (seen.has(ns)) continue;
    seen.add(ns);
    const token =
      window.sessionStorage?.getItem(`${ns}_auth_access_token`) ||
      window.localStorage?.getItem(`${ns}_auth_access_token`);
    if (token) return token;
  }
  return null;
}

// Re-export namespace list for consumers that need to enumerate known scopes
export type { TokenNamespace };
