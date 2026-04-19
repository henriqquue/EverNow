'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface AdContextType {
  lastActionTime: number;
  setLastActionTime: (time: number) => void;
  isSensitiveAction: boolean;
  setSensitiveAction: (value: boolean) => void;
  shouldShowAd: (cooldownSeconds?: number) => boolean;
}

const AdContext = createContext<AdContextType | null>(null);

export function AdProvider({ children }: { children: ReactNode }) {
  const [lastActionTime, setLastActionTime] = useState(0);
  const [isSensitiveAction, setSensitiveAction] = useState(false);

  const shouldShowAd = useCallback((cooldownSeconds = 30) => {
    if (isSensitiveAction) return false;
    const timeSinceAction = (Date.now() - lastActionTime) / 1000;
    return timeSinceAction >= cooldownSeconds;
  }, [lastActionTime, isSensitiveAction]);

  return (
    <AdContext.Provider value={{
      lastActionTime,
      setLastActionTime,
      isSensitiveAction,
      setSensitiveAction,
      shouldShowAd,
    }}>
      {children}
    </AdContext.Provider>
  );
}

export function useAds() {
  const context = useContext(AdContext);
  if (!context) {
    // Return default values if provider not available
    return {
      lastActionTime: 0,
      setLastActionTime: () => {},
      isSensitiveAction: false,
      setSensitiveAction: () => {},
      shouldShowAd: () => true,
    };
  }
  return context;
}
