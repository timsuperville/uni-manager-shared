import { useState, useEffect } from "react";

/**
 * Hook to track the online/offline status of the browser.
 *
 * Uses the `navigator.onLine` property as the initial value and listens to
 * the window `online` / `offline` events for subsequent changes.
 *
 * @returns `true` when the browser is online, `false` when offline.
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );

  useEffect(() => {
    const handleOnline = (): void => setIsOnline(true);
    const handleOffline = (): void => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}
