import en from "./locales/en.json";
import es419 from "./locales/es-419.json";
import ru from "./locales/ru.json";
import ptBR from "./locales/pt-BR.json";
import id from "./locales/id.json";

export type SupportedLocale = "en" | "es-419" | "ru" | "pt-BR" | "id";

type Dictionary = Record<string, string | null | undefined>;

export interface LocaleOption {
  code: SupportedLocale;
  label: string;
}

const dictionaries: Record<SupportedLocale, Dictionary> = {
  en,
  "es-419": es419,
  ru,
  "pt-BR": ptBR,
  id,
};

export const supportedLocales: LocaleOption[] = [
  { code: "en", label: "English" },
  { code: "es-419", label: "Espanol (Latinoamerica)" },
  { code: "ru", label: "Russkiy" },
  { code: "pt-BR", label: "Portugues (Brasil)" },
  { code: "id", label: "Bahasa Indonesia" },
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

  if (normalized === "id" || normalized.startsWith("id-")) {
    return "id";
  }

  return "en";

}

export function translate(
  locale: SupportedLocale,
  key: string,
  fallback?: string,
  vars?: Record<string, string | number>,
): string {
  const localeValue = dictionaries[locale][key];
  const englishValue = dictionaries.en[key];
  const source = pickTranslation(localeValue, englishValue, fallback, key);
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

function hasTranslation(value: string | null | undefined): value is string {
  return value != null && value.trim() !== "";
}

function pickTranslation(
  localeValue: string | null | undefined,
  englishValue: string | null | undefined,
  fallback: string | undefined,
  key: string,
): string {
  if (hasTranslation(localeValue)) {
    return localeValue;
  }

  if (hasTranslation(englishValue)) {
    return englishValue;
  }

  if (hasTranslation(fallback)) {
    return fallback;
  }

  return key;
}
