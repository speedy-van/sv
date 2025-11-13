"use client";

/**
 * Consent provider for GDPR compliance
 */

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface ConsentPreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

interface ConsentContextType {
  preferences: ConsentPreferences;
  updatePreferences: (prefs: Partial<ConsentPreferences>) => void;
  hasConsent: boolean;
  setHasConsent: (hasConsent: boolean) => void;
}

const ConsentContext = createContext<ConsentContextType | undefined>(undefined);

const defaultPreferences: ConsentPreferences = {
  necessary: true,
  analytics: false,
  marketing: false,
  preferences: false,
};

interface ConsentCookie {
  preferences: ConsentPreferences;
  hasConsent: boolean;
  timestamp: number;
}

interface ConsentProviderProps {
  children: ReactNode;
  initialConsent?: ConsentCookie | null;
}

export function ConsentProvider({ children, initialConsent }: ConsentProviderProps) {
  const [preferences, setPreferences] = useState<ConsentPreferences>(defaultPreferences);
  const [hasConsent, setHasConsent] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Load saved preferences from localStorage only on client
    if (typeof window !== 'undefined') {
      const savedPreferences = localStorage.getItem('consent-preferences');
      const savedHasConsent = localStorage.getItem('consent-given');

      if (savedPreferences) {
        try {
          setPreferences(JSON.parse(savedPreferences));
        } catch (error) {
          console.error('Failed to parse saved consent preferences:', error);
        }
      }

      if (savedHasConsent === 'true') {
        setHasConsent(true);
      } else if (initialConsent?.hasConsent) {
        setHasConsent(true);
      }
    }
  }, [initialConsent]);

  const updatePreferences = (newPrefs: Partial<ConsentPreferences>) => {
    const updatedPreferences = { ...preferences, ...newPrefs };
    setPreferences(updatedPreferences);
    localStorage.setItem('consent-preferences', JSON.stringify(updatedPreferences));
  };

  const handleSetHasConsent = (consent: boolean) => {
    setHasConsent(consent);
    localStorage.setItem('consent-given', consent.toString());
  };

  return (
    <ConsentContext.Provider
      value={{
        preferences,
        updatePreferences,
        hasConsent,
        setHasConsent: handleSetHasConsent,
      }}
    >
      {children}
    </ConsentContext.Provider>
  );
}

export function useConsent() {
  const context = useContext(ConsentContext);
  if (context === undefined) {
    throw new Error('useConsent must be used within a ConsentProvider');
  }
  return context;
}