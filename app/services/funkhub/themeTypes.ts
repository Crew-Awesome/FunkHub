export type ThemeMode = "light" | "dark" | "auto" | "vibrant" | "focus";
export type BaseMode = "light" | "dark";
/** Resolved color-set key — every mode maps to one of these */
export type ColorSetKey = "light" | "dark" | "vibrant" | "focus";

export interface ThemeColors {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  inputBackground: string;
  switchBackground: string;
  ring: string;
  chart1: string;
  chart2: string;
  chart3: string;
  chart4: string;
  chart5: string;
  sidebar: string;
  sidebarForeground: string;
  sidebarPrimary: string;
  sidebarPrimaryForeground: string;
  sidebarAccent: string;
  sidebarAccentForeground: string;
  sidebarBorder: string;
  sidebarRing: string;
  hoverGlow: string;
  warning: string;
  warningForeground: string;
  success: string;
  successForeground: string;
}

export interface ThemeDefinition {
  id: string;
  name: string;
  hue: string;
  colors: {
    light: ThemeColors;
    dark: ThemeColors;
    vibrant: ThemeColors;
    focus: ThemeColors;
  };
}

export interface ThemeContextType {
  theme: string;
  mode: ThemeMode;
  effectiveMode: ColorSetKey;
  themeHue: string;
  setTheme: (theme: string) => void;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  toggleMode: () => void;
  cycleMode: () => void;
  availableThemes: ThemeDefinition[];
  availableModes: { id: ThemeMode; name: string; icon: string }[];
}

export const AVAILABLE_MODES: { id: ThemeMode; name: string; icon: string }[] = [
  { id: "light", name: "Light", icon: "Sun" },
  { id: "dark", name: "Dark", icon: "Moon" },
  { id: "auto", name: "Auto", icon: "CircleArrow" },
  { id: "vibrant", name: "Vibrant", icon: "Sparkles" },
  { id: "focus", name: "Focus", icon: "EyeMinus" },
];
