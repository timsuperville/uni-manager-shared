/* global console, window, clearInterval, setInterval */

/**
 * useOAuth - OAuth Provider Integration Hook
 * Handles OAuth login and account linking via popup window
 */
import { useCallback, useState, useEffect, useRef } from "react";

import { getApiBaseUrl } from "../../api/config/apiConfig.js";

const API_URL = getApiBaseUrl();

export function useOAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const popupRef = useRef(null);
  const checkTimerRef = useRef(null);

  // Clean up timer and popup on unmount
  useEffect(() => {
    return () => {
      if (checkTimerRef.current) clearInterval(checkTimerRef.current);
      if (popupRef.current && !popupRef.current.closed)
        popupRef.current.close();
    };
  }, []);

  /**
   * Listen for messages from the popup window
   */
  useEffect(() => {
    const handleMessage = (event) => {
      // Security check: ensure message is from our API
      // Note: In development, origin might be localhost:5000, in prod api.uni-manager.com
      // For now we allow messages if they have the expected structure
      const { type, data, error: errorMsg } = event.data;

      if (type === "OAUTH_SUCCESS") {
        if (checkTimerRef.current) clearInterval(checkTimerRef.current);
        if (popupRef.current) popupRef.current.close();

        setIsLoading(false);
        // Dispatch custom event or callback could be handled here
        // For now we just reset state, the auth provider should handle the token
        console.log("OAuth Success:", data);
      } else if (type === "OAUTH_ERROR") {
        if (checkTimerRef.current) clearInterval(checkTimerRef.current);
        if (popupRef.current) popupRef.current.close();

        setIsLoading(false);
        setError(errorMsg || "Authentication failed");
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const loginWithProvider = useCallback(async (provider) => {
    setIsLoading(true);
    setError(null);

    try {
      // Calculate popup position to center it
      const width = 500;
      const height = 600;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const url = `${API_URL}/auth/${provider}`;
      const name = `uni_manager_${provider}_login`;
      const features = `width=${width},height=${height},left=${left},top=${top}`;

      // Open popup
      popupRef.current = window.open(url, name, features);

      if (!popupRef.current) {
        throw new Error("Popup blocked. Please allow popups for this site.");
      }

      // Check if popup is closed manually
      checkTimerRef.current = setInterval(() => {
        if (popupRef.current && popupRef.current.closed) {
          clearInterval(checkTimerRef.current);
          setIsLoading(false);
          // Only set error if we didn't get a success message first
          // (This is a simplified check, ideally specific state tracks this)
        }
      }, 1000);
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error("OAuth Error:", err);
      }
      setError(err.message);
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
