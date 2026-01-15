"use client";

/**
 * Consent provider for GDPR compliance
 */

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import {
  safeLocalStorageGetItem,
  safeLocalStorageSetItem,
} from '@/lib/safe-storage';

interface ConsentPreferences {
  necessary: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

interface ConsentContextType {
  preferences: ConsentPreferences;
  updatePreferences: (prefs: Partial<ConsentPreferences>) => void;
  hasConsent: boolean;
  setHasConsent: (hasConsent: boolean) => void;
  saveConsent: (prefs: ConsentPreferences, consentGiven: boolean) => Promise<void>;
}

const ConsentContext = createContext<ConsentContextType | undefined>(undefined);

const defaultPreferences: ConsentPreferences = {
  necessary: true,
  functional: false,
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
}

export function ConsentProvider({ children }: ConsentProviderProps) {
  const [preferences, setPreferences] = useState<ConsentPreferences>(defaultPreferences);
  const [hasConsent, setHasConsent] = useState(false);

  useEffect(() => {
    // Load saved preferences from localStorage only on client
    if (typeof window !== 'undefined') {
      const savedPreferences = safeLocalStorageGetItem('consent-preferences');
      const savedHasConsent = safeLocalStorageGetItem('consent-given');

      if (savedPreferences) {
        try {
          const parsed = JSON.parse(savedPreferences) as ConsentPreferences;
          setPreferences({
            ...defaultPreferences,
            ...parsed,
            necessary: true,
          });
        } catch (error) {
          console.warn('Failed to parse saved consent preferences:', error);
        }
      }

      if (savedHasConsent === 'true') {
        setHasConsent(true);
      }
    }
  }, []);

  const updatePreferences = (newPrefs: Partial<ConsentPreferences>) => {
    const updatedPreferences = { ...preferences, ...newPrefs };
    setPreferences(updatedPreferences);
    safeLocalStorageSetItem('consent-preferences', JSON.stringify(updatedPreferences));
  };

  const persistLocalConsent = (nextPrefs: ConsentPreferences, consentGiven: boolean) => {
    const normalized: ConsentPreferences = {
      ...defaultPreferences,
      ...nextPrefs,
      necessary: true,
    };
    setPreferences(normalized);
    setHasConsent(consentGiven);
    safeLocalStorageSetItem('consent-preferences', JSON.stringify(normalized));
    safeLocalStorageSetItem('consent-given', consentGiven.toString());
  };

  const saveConsent = async (nextPrefs: ConsentPreferences, consentGiven: boolean) => {
    persistLocalConsent(nextPrefs, consentGiven);

    try {
      await fetch('/api/consent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          functional: nextPrefs.functional,
          analytics: nextPrefs.analytics,
          marketing: nextPrefs.marketing,
          preferences: nextPrefs.preferences,
        }),
      });
    } catch (error) {
      console.warn('Failed to persist consent to server', error);
    }
  };

  const handleSetHasConsent = (consent: boolean) => {
    setHasConsent(consent);
    safeLocalStorageSetItem('consent-given', consent.toString());
  };

  return (
    <ConsentContext.Provider
      value={{
        preferences,
        updatePreferences,
        hasConsent,
        setHasConsent: handleSetHasConsent,
        saveConsent,
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