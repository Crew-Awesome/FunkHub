import type { ThemeDefinition } from "./themeTypes";

function createLightColors(primary: string, background: string): ThemeDefinition["colors"]["light"] {
  const primaryDark = "#1A1512";
  const foreground = "#2D2520";
  return {
    background,
    foreground,
    card: "#FFFFFF",
    cardForeground: foreground,
    popover: "#FFFFFF",
    popoverForeground: foreground,
    primary,
    primaryForeground: primaryDark,
    secondary: "#F5EDE6",
    secondaryForeground: foreground,
    muted: "#EDE5DD",
    mutedForeground: "#6B5D54",
    accent: primary,
    accentForeground: primaryDark,
    destructive: "#D94D3A",
    destructiveForeground: "#FFFFFF",
    border: "rgba(45, 37, 32, 0.12)",
    input: "rgba(45, 37, 32, 0.05)",
    inputBackground: "#FFFFFF",
    switchBackground: "#EDE5DD",
    ring: primary,
    chart1: primary,
    chart2: primary,
    chart3: primary,
    chart4: primary,
    chart5: primary,
    sidebar: "#FFFFFF",
    sidebarForeground: foreground,
    sidebarPrimary: primary,
    sidebarPrimaryForeground: primaryDark,
    sidebarAccent: "#F5EDE6",
    sidebarAccentForeground: foreground,
    sidebarBorder: "rgba(45, 37, 32, 0.12)",
    sidebarRing: primary,
    hoverGlow: "rgba(0, 0, 0, 0.1)",
    warning: "#c2750a",
    warningForeground: "#fef3c7",
    success: "#2a7a4b",
    successForeground: "#d1fae5",
  };
}

function createDarkColors(primary: string, background: string): ThemeDefinition["colors"]["dark"] {
  const primaryForeground = "#1A1512";
  const foreground = "#F5EDE6";
  return {
    background,
    foreground,
    card: "#231C18",
    cardForeground: foreground,
    popover: "#2D251F",
    popoverForeground: foreground,
    primary,
    primaryForeground: primaryForeground,
    secondary: "#2D251F",
    secondaryForeground: foreground,
    muted: "#3A2F28",
    mutedForeground: "#A89A8F",
    accent: primary,
    accentForeground: primaryForeground,
    destructive: "#D94D3A",
    destructiveForeground: "#FFFFFF",
    border: "rgba(245, 237, 230, 0.08)",
    input: "rgba(245, 237, 230, 0.05)",
    inputBackground: "#2D251F",
    switchBackground: "#3A2F28",
    ring: primary,
    chart1: primary,
    chart2: primary,
    chart3: primary,
    chart4: primary,
    chart5: primary,
    sidebar: "#231C18",
    sidebarForeground: foreground,
    sidebarPrimary: primary,
    sidebarPrimaryForeground: primaryForeground,
    sidebarAccent: "#2D251F",
    sidebarAccentForeground: foreground,
    sidebarBorder: "rgba(245, 237, 230, 0.08)",
    sidebarRing: primary,
    hoverGlow: "rgba(255, 255, 255, 0.1)",
    warning: "#f59e0b",
    warningForeground: "#fef3c7",
    success: "#34d399",
    successForeground: "#052e16",
  };
}

export const THEMES: ThemeDefinition[] = [
  {
    id: "funkhub",
    name: "Funkhub",
    hue: "25",
    colors: {
      light: createLightColors("#E8743B", "#FAF8F5"),
      dark: createDarkColors("#E8743B", "#1A1512"),
    },
  },
  {
    id: "purple",
    name: "Purple",
    hue: "270",
    colors: {
      light: createLightColors("#A855F7", "#FAF6FF"),
      dark: createDarkColors("#A855F7", "#1A1520"),
    },
  },
  {
    id: "pink",
    name: "Pink",
    hue: "330",
    colors: {
      light: createLightColors("#EC4899", "#FFF6FA"),
      dark: createDarkColors("#EC4899", "#1F1520"),
    },
  },
  {
    id: "blue",
    name: "Blue",
    hue: "220",
    colors: {
      light: createLightColors("#3B82F6", "#F0F6FF"),
      dark: createDarkColors("#3B82F6", "#151F2A"),
    },
  },
  {
    id: "green",
    name: "Green",
    hue: "140",
    colors: {
      light: createLightColors("#22C55E", "#F0FFF4"),
      dark: createDarkColors("#22C55E", "#152A1A"),
    },
  },
  {
    id: "red",
    name: "Red",
    hue: "0",
    colors: {
      light: createLightColors("#EF4444", "#FFF5F5"),
      dark: createDarkColors("#EF4444", "#2A1515"),
    },
  },
  {
    id: "alepsych",
    name: "ALE Psych Purple",
    hue: "260",
    colors: {
      light: createLightColors("#7C3AED", "#FAF8FF"),
      dark: createDarkColors("#7C3AED", "#1A1528"),
    },
  },
  {
    id: "ocean",
    name: "Ocean",
    hue: "175",
    colors: {
      light: createLightColors("#14B8A6", "#F0FFFA"),
      dark: createDarkColors("#14B8A6", "#152A28"),
    },
  },
  {
    id: "mint",
    name: "Mint",
    hue: "160",
    colors: {
      light: createLightColors("#10B981", "#F0FFF4"),
      dark: createDarkColors("#10B981", "#152A20"),
    },
  },
  {
    id: "rose",
    name: "Rose",
    hue: "350",
    colors: {
      light: createLightColors("#F43F5E", "#FFF0F3"),
      dark: createDarkColors("#F43F5E", "#281520"),
    },
  },
  {
    id: "gold",
    name: "Gold",
    hue: "40",
    colors: {
      light: createLightColors("#F59E0B", "#FFFBF0"),
      dark: createDarkColors("#F59E0B", "#28200A"),
    },
  },
  {
    id: "lavender",
    name: "Lavender",
    hue: "250",
    colors: {
      light: createLightColors("#A78BFA", "#F8F5FF"),
      dark: createDarkColors("#A78BFA", "#1E1A28"),
    },
  },
  {
    id: "midnight",
    name: "Midnight",
    hue: "215",
    colors: {
      light: createLightColors("#3B82F6", "#F0F5FF"),
      dark: createDarkColors("#3B82F6", "#0F1A2A"),
    },
  },
  {
    id: "coral",
    name: "Coral",
    hue: "15",
    colors: {
      light: createLightColors("#FF7F50", "#FFF5F0"),
      dark: createDarkColors("#FF7F50", "#2A1A15"),
    },
  },
  {
    id: "slate",
    name: "Slate",
    hue: "210",
    colors: {
      light: createLightColors("#64748B", "#F5F7FA"),
      dark: createDarkColors("#64748B", "#1A1E24"),
    },
  },
  {
    id: "gamebanana",
    name: "Gamebanana Yellow",
    hue: "50",
    colors: {
      light: createLightColors("#FFE900", "#FFFFE6"),
      dark: createDarkColors("#FFE900", "#1A1A0F"),
    },
  },
];

export function getThemeById(id: string): ThemeDefinition {
  return THEMES.find((t) => t.id === id) || THEMES[0];
}
