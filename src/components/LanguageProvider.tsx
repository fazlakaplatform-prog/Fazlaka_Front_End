// components/LanguageProvider.tsx
"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { arSA, enUS } from "@clerk/localizations";
import { useState, useEffect, createContext, useContext } from "react";

// إنشاء سياق اللغة
const LanguageContext = createContext<{
  isRTL: boolean;
  language: 'ar' | 'en';
  setLanguage: (lang: 'ar' | 'en') => void;
}>({
  isRTL: true,
  language: 'ar',
  setLanguage: () => {},
});

// Hook مخصص لاستخدام سياق اللغة
export const useLanguage = () => useContext(LanguageContext);

export default function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [isRTL, setIsRTL] = useState(true);
  const [language, setLanguageState] = useState<'ar' | 'en'>('ar');
  const [clerkLocalization, setClerkLocalization] = useState(arSA);
  const [mounted, setMounted] = useState(false);

  const setLanguage = (lang: 'ar' | 'en') => {
    setLanguageState(lang);
    setIsRTL(lang === 'ar');
    setClerkLocalization(lang === 'ar' ? arSA : enUS);
    localStorage.setItem('language', lang);
  };

  useEffect(() => {
    setMounted(true);
    
    const savedLanguage = localStorage.getItem('language') as 'ar' | 'en' | null;
    if (savedLanguage && (savedLanguage === 'ar' || savedLanguage === 'en')) {
      setLanguage(savedLanguage);
    } else {
      const browserLang = navigator.language || (navigator as Navigator & { userLanguage?: string }).userLanguage || '';
      const shouldBeRTL = browserLang.includes('ar');
      setLanguage(shouldBeRTL ? 'ar' : 'en');
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
      document.documentElement.lang = language;
    }
  }, [isRTL, language, mounted]);

  if (!mounted) return null;

  return (
    <LanguageContext.Provider value={{ isRTL, language, setLanguage }}>
      <ClerkProvider localization={clerkLocalization}>
        {children}
      </ClerkProvider>
    </LanguageContext.Provider>
  );
}