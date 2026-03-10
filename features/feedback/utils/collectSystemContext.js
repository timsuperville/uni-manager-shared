// System context collector — enriches every feedback submission with
// device, browser, session, and performance telemetry.

// M2 — Set session start timestamp at module load so collectSystemContext can
// calculate sessionDurationMs. Written only once per page load.
if (typeof window !== "undefined" && !window.__feedbackSessionStart) {
    window.__feedbackSessionStart = Date.now();
}

// Track navigation history for context (SPA route changes)
if (typeof window !== "undefined" && !window.__feedbackNavHistory) {
    window.__feedbackNavHistory = [];
    const origPush = history.pushState.bind(history);
    const origReplace = history.replaceState.bind(history);
    const trackPage = (url) => {
        const path = typeof url === "string" ? url : window.location.pathname;
        const hist = window.__feedbackNavHistory;
        if (hist[hist.length - 1] !== path) {
            hist.push(path);
            if (hist.length > 20) hist.shift();
        }
    };
    history.pushState = (...args) => { origPush(...args); trackPage(args[2]); };
    history.replaceState = (...args) => { origReplace(...args); trackPage(args[2]); };
}

function detectDevice() {
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
    const isMobile =
        /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    const isTablet =
        /Tablet|iPad/i.test(ua) ||
        (isMobile && Math.min(screen.width, screen.height) >= 600);
    const deviceType = isTablet ? "tablet" : isMobile ? "mobile" : "desktop";

    let os = "unknown";
    if (/Windows NT/i.test(ua)) os = "Windows";
    else if (/Mac OS X/i.test(ua)) os = /iPhone|iPad/i.test(ua) ? "iOS" : "macOS";
    else if (/Android/i.test(ua)) os = "Android";
    else if (/Linux/i.test(ua)) os = "Linux";
    else if (/CrOS/i.test(ua)) os = "ChromeOS";

    const winMatch = ua.match(/Windows NT (\d+\.\d+)/);
    const macMatch = ua.match(/Mac OS X ([\d_]+)/);
    const androidMatch = ua.match(/Android ([\d.]+)/);
    const iosMatch = ua.match(/OS ([\d_]+) like Mac/);
    const osVersion =
        (winMatch && winMatch[1]) ||
        (macMatch && macMatch[1].replace(/_/g, ".")) ||
        (androidMatch && androidMatch[1]) ||
        (iosMatch && iosMatch[1].replace(/_/g, ".")) ||
        null;

    const orientation =
        typeof screen !== "undefined" && screen.orientation
            ? screen.orientation.type
            : typeof window !== "undefined"
                ? window.innerWidth > window.innerHeight
                    ? "landscape-primary"
                    : "portrait-primary"
                : null;

    return { deviceType, os, osVersion, orientation };
}

export function collectSystemContext(appName, user = null) {
    const sessionStart = window.__feedbackSessionStart;
    const sessionDurationMs = sessionStart ? Date.now() - sessionStart : null;

    let memoryMb = null;
    try {
        const mem = performance?.memory;
        if (mem?.usedJSHeapSize) memoryMb = Math.round(mem.usedJSHeapSize / 1024 / 1024);
    } catch { }

    let loadTimingMs = null;
    try {
        const nav = performance?.getEntriesByType?.("navigation")?.[0];
        if (nav?.domInteractive) loadTimingMs = Math.round(nav.domInteractive);
    } catch { }

    let connection = null;
    try {
        const conn =
            navigator?.connection ||
            navigator?.mozConnection ||
            navigator?.webkitConnection;
        if (conn) {
            connection = {
                effectiveType: conn.effectiveType || null,
                downlinkMbps: conn.downlink || null,
                rtt: conn.rtt || null,
                saveData: conn.saveData || false,
            };
        }
    } catch { }

    let storageKeys = null;
    try {
        storageKeys = {
            localStorage: localStorage.length,
            sessionStorage: sessionStorage.length,
        };
    } catch { }

    let navigationHistory = null;
    try { navigationHistory = window.__feedbackNavHistory || []; } catch { }

    let pageVisibilityState = null;
    try { pageVisibilityState = document.visibilityState || null; } catch { }

    const env =
        typeof import.meta !== "undefined" && import.meta?.env?.MODE === "production"
            ? "production"
            : "development";

    const appVersion =
        typeof import.meta !== "undefined"
            ? import.meta?.env?.VITE_APP_VERSION || "unknown"
            : "unknown";

    const fullPathname =
        typeof window !== "undefined" ? window.location.pathname : "/";
    const base =
        (typeof import.meta !== "undefined" && import.meta?.env?.BASE_URL) || "/";
    const inAppPath = fullPathname.startsWith(base)
        ? "/" + fullPathname.slice(base.length)
        : fullPathname;

    const device = detectDevice();

    return {
        user: user
            ? {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                appRole: user.appRole,
            }
            : null,
        page: {
            url: typeof window !== "undefined" ? window.location.href : "unknown",
            path: inAppPath,
            hash: typeof window !== "undefined" ? window.location.hash : "",
            queryString: typeof window !== "undefined" ? window.location.search : "",
            referrer: typeof document !== "undefined" ? document.referrer : "",
            title: typeof document !== "undefined" ? document.title : "",
            timestamp: new Date().toISOString(),
        },
        device: {
            type: device.deviceType,
            os: device.os,
            osVersion: device.osVersion,
            orientation: device.orientation,
        },
        browser: {
            userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
            viewport: {
                width: typeof window !== "undefined" ? window.innerWidth : 0,
                height: typeof window !== "undefined" ? window.innerHeight : 0,
            },
            screen: {
                width: typeof screen !== "undefined" ? screen.width : 0,
                height: typeof screen !== "undefined" ? screen.height : 0,
                pixelRatio: typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1,
                colorDepth: typeof screen !== "undefined" ? screen.colorDepth : null,
            },
            language: typeof navigator !== "undefined" ? navigator.language : "",
            languages:
                typeof navigator !== "undefined" && Array.isArray(navigator.languages)
                    ? navigator.languages.slice(0, 3)
                    : [],
            timezone: Intl?.DateTimeFormat?.()?.resolvedOptions?.()?.timeZone || "",
            cookiesEnabled: typeof navigator !== "undefined" ? navigator.cookieEnabled : null,
            doNotTrack: typeof navigator !== "undefined" ? navigator.doNotTrack : null,
            onLine: typeof navigator !== "undefined" ? navigator.onLine : null,
            connection,
            loadTimingMs,
        },
        application: {
            name: appName,
            version: appVersion,
            environment: env,
            baseUrl: base,
        },
        session: {
            durationMs: sessionDurationMs,
            durationFormatted: sessionDurationMs
                ? `${Math.floor(sessionDurationMs / 60000)}m ${Math.floor((sessionDurationMs % 60000) / 1000)}s`
                : null,
            storageKeys,
            navigationHistoryCount: navigationHistory ? navigationHistory.length : 0,
            recentNavigation: navigationHistory ? navigationHistory.slice(-5) : [],
            pageVisibilityState,
        },
        performance: {
            memoryUsedMb: memoryMb,
            jsHeapLimitMb: (() => {
                try {
                    const lim = performance?.memory?.jsHeapSizeLimit;
                    return lim ? Math.round(lim / 1024 / 1024) : null;
                } catch { return null; }
            })(),
        },
    };
}
