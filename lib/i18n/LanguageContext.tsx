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
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'EN' || stored === 'FR') {
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
