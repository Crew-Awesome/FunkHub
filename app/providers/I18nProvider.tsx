import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { translate, type SupportedLocale } from "../i18n";
import { useFunkHub } from "./funkhub/FunkHubProvider";

interface I18nContextValue {
  locale: SupportedLocale;
  locales: Array<{ code: SupportedLocale; label: string }>;
  setLocale: (locale: SupportedLocale) => Promise<void>;
  t: (key: string, fallback?: string, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const { settings, updateSettings } = useFunkHub();
  const [locale, setLocaleState] = useState<SupportedLocale>("en");

  useEffect(() => {
    if (settings.locale !== "en") {
      void updateSettings({ locale: "en" });
    }
    setLocaleState("en");
  }, [settings.locale, updateSettings]);

  const setLocale = useCallback(async (nextLocale: SupportedLocale) => {
    void nextLocale;
    setLocaleState("en");
    await updateSettings({ locale: "en" });
  }, [updateSettings]);

  const t = useCallback((key: string, fallback?: string, vars?: Record<string, string | number>) => {
    return translate(locale, key, fallback, vars);
  }, [locale]);

  const value = useMemo<I18nContextValue>(() => ({
    locale,
    locales: [{ code: "en", label: "English" }],
    setLocale,
    t,
  }), [locale, setLocale, t]);

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return context;
}
