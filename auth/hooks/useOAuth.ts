import { useCallback, useState, useEffect, useRef } from "react";
import { getApiBaseUrl } from "../../api/config/apiConfig.js";

// ── Types ─────────────────────────────────────────────────────────────────────

interface UseOAuthReturn {
  isLoading: boolean;
  error: string | null;
  loginWithProvider: (provider: string) => Promise<void>;
  resetError: () => void;
}

const API_URL = getApiBaseUrl() as string;

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * OAuth Provider Integration Hook.
 * Handles OAuth login and account linking via popup window.
 */
export function useOAuth(): UseOAuthReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const popupRef = useRef<Window | null>(null);
  const checkTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (checkTimerRef.current) clearInterval(checkTimerRef.current);
      if (popupRef.current && !popupRef.current.closed) popupRef.current.close();
    };
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const { type, data, error: errorMsg } = event.data as {
        type?: string;
        data?: unknown;
        error?: string;
      };

      if (type === "OAUTH_SUCCESS") {
        if (checkTimerRef.current) clearInterval(checkTimerRef.current);
        if (popupRef.current) popupRef.current.close();
        setIsLoading(false);
        if (import.meta.env.DEV) console.log("OAuth Success:", data);
      } else if (type === "OAUTH_ERROR") {
        if (checkTimerRef.current) clearInterval(checkTimerRef.current);
        if (popupRef.current) popupRef.current.close();
        setIsLoading(false);
        setError(errorMsg ?? "Authentication failed");
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const loginWithProvider = useCallback(async (provider: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const width = 500;
      const height = 600;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const url = `${API_URL}/auth/${provider}`;
      const name = `uni_manager_${provider}_login`;
      const features = `width=${width},height=${height},left=${left},top=${top}`;

      const popup = window.open(url, name, features);
      popupRef.current = popup;

      if (!popup) {
        throw new Error("Popup blocked. Please allow popups for this site.");
      }

      checkTimerRef.current = setInterval(() => {
        if (popupRef.current?.closed) {
          clearInterval(checkTimerRef.current!);
          setIsLoading(false);
        }
      }, 1000);
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error("OAuth Error:", err);
      }
      setError(err instanceof Error ? err.message : "OAuth failed");
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    loginWithProvider,
    resetError: () => setError(null),
  };
}

export default useOAuth;
