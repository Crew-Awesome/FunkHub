import { createContext, useContext, useEffect, type ReactNode } from "react";
import { getThemeById } from "../services/funkhub/themes";
import type { ThemeContextType } from "../services/funkhub/themeTypes";

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function applyThemeToRoot() {
  const root = document.documentElement;
  const theme = getThemeById("funkhub");
  const colors = theme.colors.dark;

  root.setAttribute("data-theme", "funkhub");
  root.setAttribute("data-mode", "dark");
  root.setAttribute("data-color-set", "dark");

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
  useEffect(() => {
    applyThemeToRoot();
  }, []);

  const value: ThemeContextType = {
    theme: "funkhub",
    mode: "dark",
    effectiveMode: "dark",
    themeHue: getThemeById("funkhub").hue,
    setTheme: (_theme) => {},
    setMode: (_mode) => {},
    toggleTheme: () => undefined,
    toggleMode: () => undefined,
    cycleMode: () => undefined,
    availableThemes: [getThemeById("funkhub")],
    availableModes: [{ id: "dark", name: "Dark", icon: "Moon" }],
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}

export const AVAILABLE_MODES = [{ id: "dark", name: "Dark", icon: "Moon" }] as const;
