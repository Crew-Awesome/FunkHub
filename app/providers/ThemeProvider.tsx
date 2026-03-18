import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from "react";
import { THEMES, getThemeById } from "../services/funkhub/themes";
import { AVAILABLE_MODES, type ThemeMode, type BaseMode, type ThemeContextType, type ThemeColors } from "../services/funkhub/themeTypes";

// --- Effect mode color helpers ---

function hexToRgb(hex: string): [number, number, number] {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function mixHex(c1: string, c2: string, w: number): string {
  if (!c1.startsWith("#")) return c1;
  const [r1, g1, b1] = hexToRgb(c1);
  const [r2, g2, b2] = hexToRgb(c2);
  return rgbToHex(
    Math.round(r1 * w + r2 * (1 - w)),
    Math.round(g1 * w + g2 * (1 - w)),
    Math.round(b1 * w + b2 * (1 - w)),
  );
}

function saturateHex(hex: string, factor: number): string {
  if (!hex.startsWith("#")) return hex;
  const [r, g, b] = hexToRgb(hex);
  const mid = (r + g + b) / 3;
  return rgbToHex(
    Math.max(0, Math.min(255, Math.round(mid + (r - mid) * factor))),
    Math.max(0, Math.min(255, Math.round(mid + (g - mid) * factor))),
    Math.max(0, Math.min(255, Math.round(mid + (b - mid) * factor))),
  );
}

function applyVibrant(c: ThemeColors): ThemeColors {
  const sat = (h: string) => saturateHex(h, 1.35);
  return {
    ...c,
    primary: sat(c.primary), accent: sat(c.accent), ring: sat(c.ring),
    sidebarPrimary: sat(c.sidebarPrimary),
    chart1: sat(c.chart1), chart2: sat(c.chart2), chart3: sat(c.chart3), chart4: sat(c.chart4), chart5: sat(c.chart5),
    card: mixHex(c.card, "#ffffff", 0.93),
    secondary: mixHex(c.secondary, "#ffffff", 0.88),
    muted: mixHex(c.muted, "#ffffff", 0.92),
    warning: sat(c.warning), success: sat(c.success), destructive: sat(c.destructive),
  };
}

function applyPastel(c: ThemeColors): ThemeColors {
  const fade = (h: string) => mixHex(h, "#ffffff", 0.6);
  return {
    ...c,
    primary: fade(c.primary), accent: fade(c.accent), ring: fade(c.ring),
    sidebarPrimary: fade(c.sidebarPrimary),
    chart1: fade(c.chart1), chart2: fade(c.chart2), chart3: fade(c.chart3), chart4: fade(c.chart4), chart5: fade(c.chart5),
    card: mixHex(c.card, "#ffffff", 0.95),
    secondary: mixHex(c.secondary, "#ffffff", 0.7),
    muted: mixHex(c.muted, "#ffffff", 0.8),
    warning: fade(c.warning), success: fade(c.success), destructive: fade(c.destructive),
  };
}

function applyFocus(c: ThemeColors): ThemeColors {
  const gray = "#808080";
  const bg = c.background;
  const dim = (h: string, w = 0.45) => mixHex(h, gray, w);
  return {
    ...c,
    primary: dim(c.primary), accent: dim(c.accent, 0.35), ring: dim(c.ring, 0.4),
    sidebarPrimary: dim(c.sidebarPrimary),
    chart1: dim(c.chart1), chart2: dim(c.chart2), chart3: dim(c.chart3), chart4: dim(c.chart4), chart5: dim(c.chart5),
    card: mixHex(c.card, bg, 0.95),
    secondary: mixHex(c.secondary, bg, 0.4),
    muted: mixHex(c.muted, bg, 0.5),
    mutedForeground: mixHex(c.mutedForeground, bg, 0.4),
    cardForeground: mixHex(c.cardForeground, bg, 0.15),
    hoverGlow: "transparent",
    warning: dim(c.warning, 0.5), success: dim(c.success, 0.5), destructive: dim(c.destructive, 0.5),
  };
}

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

function isEffectMode(mode: ThemeMode): boolean {
  return mode === "vibrant" || mode === "pastel" || mode === "focus";
}

function resolveEffectiveMode(mode: ThemeMode, baseMode: BaseMode): BaseMode {
  if (mode === "auto") {
    return getSystemPreference();
  }
  if (isEffectMode(mode)) {
    return baseMode;
  }
  return mode as BaseMode;
}

function applyThemeToRoot(themeId: string, mode: ThemeMode, baseMode: BaseMode) {
  const root = document.documentElement;
  const theme = getThemeById(themeId);
  const effectiveMode = resolveEffectiveMode(mode, baseMode);
  let colors = theme.colors[effectiveMode];

  // Apply effect mode transforms in JS — CSS selectors can't override inline styles
  if (mode === "vibrant") colors = applyVibrant(colors);
  else if (mode === "pastel") colors = applyPastel(colors);
  else if (mode === "focus") colors = applyFocus(colors);

  root.setAttribute("data-theme", themeId);
  root.setAttribute("data-mode", effectiveMode);
  root.setAttribute("data-effect-mode", isEffectMode(mode) ? mode : "none");

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

  const effectiveMode = useMemo(() => resolveEffectiveMode(mode, baseMode), [mode, baseMode]);
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
      setModeState((prev) => prev);
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, [mode]);

  const toggleMode = useCallback(() => {
    const modes: ThemeMode[] = ["light", "dark", "auto", "vibrant", "pastel", "focus"];
    const currentIndex = modes.indexOf(mode);
    const nextIndex = (currentIndex + 1) % modes.length;
    const newMode = modes[nextIndex];
    updateMode(newMode);
  }, [mode, updateMode]);

  const toggleTheme = useCallback(() => {
    const newBaseMode = baseMode === "dark" ? "light" : "dark";
    setBaseMode(newBaseMode);
    localStorage.setItem(STORAGE_KEYS.baseMode, newBaseMode);
    if (isEffectMode(mode)) {
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
