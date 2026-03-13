/**
 * useFocusModeListener — Global Focus State Receiver
 *
 * Subscribes to the Personal App's Deep Work Focus broadcast via the
 * BroadcastChannel API. When the Personal App activates Focus Mode, all
 * other Uni-Manager apps that import this hook will automatically respond.
 *
 * Channel:   'uni-manager:focus-mode'
 * Payloads:
 *   { type: 'FOCUS_MODE_ON',  activatedAt: ISO string, source: 'personal-app' }
 *   { type: 'FOCUS_MODE_OFF', deactivatedAt: ISO string, source: 'personal-app' }
 *
 * Contract 6 — Personal → Ecosystem (Focus State Sync)
 * Ref: .agent/plans/cross-app-resonance-map.md
 */
import { useState, useEffect, useRef } from "react";

const CHANNEL_NAME = "uni-manager:focus-mode";
const STORAGE_KEY = "personal:focus-mode-active";

/**
 * @returns {{ isFocusModeActive: boolean }}
 *
 * isFocusModeActive — true when the Personal App has engaged Deep Work mode.
 * Consumer apps should suppress non-critical notifications and alerts.
 *
 * Example:
 *   const { isFocusModeActive } = useFocusModeListener();
 *   if (isFocusModeActive) return null; // suppress notification popover
 */
export function useFocusModeListener() {
    // Initialise from persisted state so the listener snaps into sync immediately
    // on mount (e.g., if Personal App toggled focus mode before this tab opened).
    const [isFocusModeActive, setIsFocusModeActive] = useState(() => {
        try {
            return localStorage.getItem(STORAGE_KEY) === "true";
        } catch (_err) {
            return false;
        }
    });

    const channelRef = useRef(null);

    useEffect(() => {
        // Guard: BroadcastChannel is not available in Node / SSR / old browsers
        if (typeof BroadcastChannel === "undefined") return;

        channelRef.current = new BroadcastChannel(CHANNEL_NAME);

        channelRef.current.onmessage = (event) => {
            const { type } = event.data ?? {};
            if (type === "FOCUS_MODE_ON") {
                setIsFocusModeActive(true);
            } else if (type === "FOCUS_MODE_OFF") {
                setIsFocusModeActive(false);
            }
        };

        return () => {
            channelRef.current?.close();
            channelRef.current = null;
        };
    }, []);

    return { isFocusModeActive };
}
