import en from "./locales/en.json";
import es419 from "./locales/es-419.json";
import ru from "./locales/ru.json";
import ptBR from "./locales/pt-BR.json";

export type SupportedLocale = "en" | "es-419" | "ru" | "pt-BR";

type Dictionary = Record<string, string>;

const dictionaries: Record<SupportedLocale, Dictionary> = {
  en,
  "es-419": es419,
  ru,
  "pt-BR": ptBR,
};

export const supportedLocales: Array<{ code: SupportedLocale; labelKey: string }> = [
  { code: "en", labelKey: "settings.language.english" },
  { code: "es-419", labelKey: "settings.language.spanishLatam" },
  { code: "ru", labelKey: "settings.language.russian" },
  { code: "pt-BR", labelKey: "settings.language.portugueseBrazil" },
];

export function normalizeLocale(rawLocale: string | undefined): SupportedLocale {
  if (!rawLocale) {
    return "en";
  }

  const normalized = rawLocale.trim().toLowerCase().replace("_", "-");

  if (normalized === "en" || normalized.startsWith("en-")) {
    return "en";
  }

  if (normalized === "es-419" || normalized === "es") {
    return "es-419";
  }

  if (normalized === "ru" || normalized.startsWith("ru-")) {
    return "ru";
  }

  if (normalized === "pt-br" || normalized === "pt") {
    return "pt-BR";
  }

  return "en";
}

export function translate(
  locale: SupportedLocale,
  key: string,
  fallback?: string,
  vars?: Record<string, string | number>,
): string {
  const source = dictionaries[locale][key] ?? dictionaries.en[key] ?? fallback ?? key;
  if (!vars) {
    return source;
  }

  return source.replace(/\{\{\s*(\w+)\s*\}\}/g, (_match, token: string) => {
    if (!(token in vars)) {
      return "";
    }
    return String(vars[token]);
  });
}
