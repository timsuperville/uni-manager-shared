import { useEffect, useCallback, useState } from "react";

const DURESS_CHANNEL_NAME = "uni-manager:duress-protocol";
const GHOST_MODE_KEY = "uni-manager:ghost-mode:active";

export function useDuressProtocol() {
  const [isGhostState, setIsGhostState] = useState(() => {
    return localStorage.getItem(GHOST_MODE_KEY) === "true";
  });

  const purgeData = useCallback(() => {
    // Purge local storage except for ghost mode flag
    localStorage.clear();
    sessionStorage.clear();

    // Set ghost mode flag
    localStorage.setItem(GHOST_MODE_KEY, "true");
    setIsGhostState(true);

    // Optional: reload the page or navigate home so state resets
    window.location.href = "/";
  }, []);

  useEffect(() => {
    const channel = new BroadcastChannel(DURESS_CHANNEL_NAME);

    channel.onmessage = (event) => {
      if (event.data.type === "TRIGGER_DURESS") {
        console.warn(
          "DURESS PROTOCOL ACTIVATED FROM ANOTHER TAB/APP. PURGING DATA.",
        );
        purgeData();
      }
    };

    return () => {
      channel.close();
    };
  }, [purgeData]);

  const triggerDuress = useCallback(() => {
    console.warn("DURESS PROTOCOL ACTIVATED. PURGING DATA AND BROADCASTING.");
    const channel = new BroadcastChannel(DURESS_CHANNEL_NAME);
    channel.postMessage({ type: "TRIGGER_DURESS", timestamp: Date.now() });
    purgeData();
  }, [purgeData]);

  return {
    isGhostState,
    triggerDuress,
  };
}
