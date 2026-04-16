import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from "react";
import { THEMES, getThemeById } from "../services/funkhub/themes";
import { AVAILABLE_MODES, type ThemeMode, type BaseMode, type ColorSetKey, type ThemeContextType } from "../services/funkhub/themeTypes";

const STORAGE_KEYS = {
  theme: "funkhub-theme",
  mode: "funkhub-mode",
  baseMode: "funkhub-base-mode",
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getSystemPreference(): BaseMode {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function isBaseMode(mode: ThemeMode): mode is BaseMode {
  return mode === "light" || mode === "dark";
}

/** Returns the color-set key for a given mode + baseMode. */
function resolveColorSet(mode: ThemeMode, baseMode: BaseMode): ColorSetKey {
  if (mode === "auto") return getSystemPreference();
  if (mode === "vibrant" || mode === "focus") return mode;
  return mode as BaseMode;
}

/** Returns the data-mode value for dark: Tailwind variants.
 *  Vibrant + Focus are dark-like. */
function resolveDataMode(colorSet: ColorSetKey): BaseMode {
  return colorSet === "light" ? "light" : "dark";
}

function applyThemeToRoot(themeId: string, mode: ThemeMode, baseMode: BaseMode) {
  const root = document.documentElement;
  const theme = getThemeById(themeId);
  const colorSet = resolveColorSet(mode, baseMode);
  const colors = theme.colors[colorSet];

  root.setAttribute("data-theme", themeId);
  root.setAttribute("data-mode", resolveDataMode(colorSet));
  root.setAttribute("data-color-set", colorSet);

  const cssVarMap: Record<string, string> = {
    background: "--background",
    foreground: "--foreground",
    card: "--card",
    cardForeground: "--card-foreground",
    popover: "--popover",
    popoverForeground: "--popover-foreground",
    primary: "--primary",
    primaryForeground: "--primary-foreground",
    secondary: "--secondary",
    secondaryForeground: "--secondary-foreground",
    muted: "--muted",
    mutedForeground: "--muted-foreground",
    accent: "--accent",
    accentForeground: "--accent-foreground",
    destructive: "--destructive",
    destructiveForeground: "--destructive-foreground",
    border: "--border",
    input: "--input",
    inputBackground: "--input-background",
    switchBackground: "--switch-background",
    ring: "--ring",
    chart1: "--chart-1",
    chart2: "--chart-2",
    chart3: "--chart-3",
    chart4: "--chart-4",
    chart5: "--chart-5",
    sidebar: "--sidebar",
    sidebarForeground: "--sidebar-foreground",
    sidebarPrimary: "--sidebar-primary",
    sidebarPrimaryForeground: "--sidebar-primary-foreground",
    sidebarAccent: "--sidebar-accent",
    sidebarAccentForeground: "--sidebar-accent-foreground",
    sidebarBorder: "--sidebar-border",
    sidebarRing: "--sidebar-ring",
    hoverGlow: "--hover-glow",
    warning: "--warning",
    warningForeground: "--warning-foreground",
    success: "--success",
    successForeground: "--success-foreground",
  };

  Object.entries(colors).forEach(([key, value]) => {
    const cssKey = cssVarMap[key];
    if (cssKey) {
      root.style.setProperty(cssKey, value);
    }
  });
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<string>(() => {
    if (typeof window === "undefined") return "funkhub";
    return localStorage.getItem(STORAGE_KEYS.theme) || "funkhub";
  });

  const [mode, setModeState] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "dark";
    return (localStorage.getItem(STORAGE_KEYS.mode) as ThemeMode) || "dark";
  });

  const [baseMode, setBaseMode] = useState<BaseMode>(() => {
    if (typeof window === "undefined") return "dark";
    const saved = localStorage.getItem(STORAGE_KEYS.baseMode) as BaseMode;
    if (saved) return saved;
    const currentMode = localStorage.getItem(STORAGE_KEYS.mode) as ThemeMode;
    if (isBaseMode(currentMode)) return currentMode;
    return "dark";
  });

  const effectiveMode = useMemo(() => resolveColorSet(mode, baseMode), [mode, baseMode]);
  const currentTheme = useMemo(() => getThemeById(theme), [theme]);
  const themeHue = currentTheme?.hue || "25";

  const updateMode = useCallback((newMode: ThemeMode) => {
    if (isBaseMode(newMode)) {
      setBaseMode(newMode);
      localStorage.setItem(STORAGE_KEYS.baseMode, newMode);
    } else if (newMode === "auto") {
      setBaseMode(getSystemPreference());
      localStorage.setItem(STORAGE_KEYS.baseMode, getSystemPreference());
    }
    setModeState(newMode);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.theme, theme);
    localStorage.setItem(STORAGE_KEYS.mode, mode);
    applyThemeToRoot(theme, mode, baseMode);
  }, [theme, mode, baseMode]);

  useEffect(() => {
    if (mode !== "auto") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const systemMode = getSystemPreference();
      setBaseMode(systemMode);
      localStorage.setItem(STORAGE_KEYS.baseMode, systemMode);
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, [mode]);

  const toggleMode = useCallback(() => {
    const modes: ThemeMode[] = ["light", "dark", "auto", "vibrant", "focus"];
    const currentIndex = modes.indexOf(mode);
    const nextIndex = (currentIndex + 1) % modes.length;
    const newMode = modes[nextIndex];
    updateMode(newMode);
  }, [mode, updateMode]);

  const toggleTheme = useCallback(() => {
    const newBaseMode = baseMode === "dark" ? "light" : "dark";
    setBaseMode(newBaseMode);
    localStorage.setItem(STORAGE_KEYS.baseMode, newBaseMode);
    // For vibrant/focus those are standalone modes — toggleTheme switches to light/dark base
    if (!isBaseMode(mode) && mode !== "auto") {
      setModeState(newBaseMode);
    }
  }, [baseMode, mode]);

  const cycleMode = useCallback(() => {
    toggleMode();
  }, [toggleMode]);

  const value: ThemeContextType = {
    theme,
    mode,
    effectiveMode,
    themeHue,
    setTheme,
    setMode: updateMode,
    toggleTheme,
    toggleMode,
    cycleMode,
    availableThemes: THEMES,
    availableModes: AVAILABLE_MODES,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}

export { AVAILABLE_MODES } from "../services/funkhub/themeTypes";
