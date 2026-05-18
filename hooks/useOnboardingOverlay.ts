import { useState, useEffect } from 'react';

export interface UseOnboardingOverlayProps {
  /** The length of the collection/array being checked. */
  collectionLength: number;
  /** Whether the collection is currently loading. We don't want to show the overlay while loading. */
  isLoading: boolean;
  /** Unique key to identify this specific domain/onboarding flow in localStorage. */
  domainKey: string;
}

export function useOnboardingOverlay({
  collectionLength,
  isLoading,
  domainKey
}: UseOnboardingOverlayProps) {
  const [showOverlay, setShowOverlay] = useState(false);

  useEffect(() => {
    // Only trigger if data is fully loaded, and the collection is empty.
    if (!isLoading && collectionLength === 0) {
      const storageKey = `um_onboarding_dismissed_${domainKey}`;
      const dismissed = localStorage.getItem(storageKey);

      if (dismissed !== 'true') {
        setShowOverlay(true);
      } else {
        setShowOverlay(false);
      }
    } else {
      // If collection grows > 0, we can hide the overlay automatically
      setShowOverlay(false);
    }
  }, [collectionLength, isLoading, domainKey]);

  const dismissOverlay = () => {
    const storageKey = `um_onboarding_dismissed_${domainKey}`;
    localStorage.setItem(storageKey, 'true');
    setShowOverlay(false);
  };

  const resetOverlay = () => {
    const storageKey = `um_onboarding_dismissed_${domainKey}`;
    localStorage.removeItem(storageKey);
    if (!isLoading && collectionLength === 0) {
      setShowOverlay(true);
    }
  };

  return {
    showOverlay,
    dismissOverlay,
    resetOverlay
  };
}
