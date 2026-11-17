'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Language } from './translations';

const STORAGE_KEY = 'iclp-language';

interface LanguageContextValue {
  language: Language;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('EN');

  useEffect(() => {
    // Deliberately deferred to an effect rather than a lazy useState initializer:
    // `window` isn't available during SSR, so reading localStorage during the
    // initial render would either crash server-side or desync the hydrated
    // markup from the server-rendered HTML. Reading post-mount is the standard
    // SSR-safe pattern for syncing from a client-only store.
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'EN' || stored === 'FR') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLanguage(stored);
    }
  }, []);

  const toggleLanguage = () => {
    setLanguage((current) => {
      const next = current === 'EN' ? 'FR' : 'EN';
      window.localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider.');
  }
  return context;
}
