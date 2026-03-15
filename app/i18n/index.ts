import en from "./locales/en.json";

export type SupportedLocale = "en";

type Dictionary = Record<string, string>;

const dictionaries: Record<SupportedLocale, Dictionary> = {
  en,
};

export const supportedLocales: Array<{ code: SupportedLocale; labelKey: string }> = [
  { code: "en", labelKey: "settings.language.english" },
];

export function normalizeLocale(rawLocale: string | undefined): SupportedLocale {
  if (!rawLocale) {
    return "en";
  }

  const short = rawLocale.toLowerCase().split("-")[0];
  return short === "en" ? "en" : "en";
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
