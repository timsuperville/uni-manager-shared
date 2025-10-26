/* global console */

/**
 * useOAuth - OAuth Provider Integration Hook
 * Handles OAuth login and account linking
 */
import { useCallback, useState } from 'react';

export function useOAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLoginWithProvider = useCallback(async (provider) => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('OAuth login with provider:', provider);
      // TODO: Implement OAuth login
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    loginWithProvider: handleLoginWithProvider,
  };
}

export default useOAuth;
