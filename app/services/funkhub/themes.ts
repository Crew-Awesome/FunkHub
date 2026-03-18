import type { ThemeDefinition } from "./themeTypes";

const baseLight: Omit<ThemeDefinition["colors"]["light"], "chart1" | "chart2" | "chart3" | "chart4" | "chart5"> = {
  background: "#FAF8F5",
  foreground: "#2D2520",
  card: "#FFFFFF",
  cardForeground: "#2D2520",
  popover: "#FFFFFF",
  popoverForeground: "#2D2520",
  primary: "#E8743B",
  primaryForeground: "#1A1512",
  secondary: "#F5EDE6",
  secondaryForeground: "#2D2520",
  muted: "#EDE5DD",
  mutedForeground: "#6B5D54",
  accent: "#E8743B",
  accentForeground: "#1A1512",
  destructive: "#D94D3A",
  destructiveForeground: "#FFFFFF",
  border: "rgba(45, 37, 32, 0.12)",
  input: "rgba(45, 37, 32, 0.05)",
  inputBackground: "#FFFFFF",
  switchBackground: "#EDE5DD",
  ring: "#E8743B",
  sidebar: "#FFFFFF",
  sidebarForeground: "#2D2520",
  sidebarPrimary: "#E8743B",
  sidebarPrimaryForeground: "#1A1512",
  sidebarAccent: "#F5EDE6",
  sidebarAccentForeground: "#2D2520",
  sidebarBorder: "rgba(45, 37, 32, 0.12)",
  sidebarRing: "#E8743B",
  hoverGlow: "rgba(232, 116, 59, 0.24)",
  warning: "#c2750a",
  warningForeground: "#fef3c7",
  success: "#2a7a4b",
  successForeground: "#d1fae5",
};

const baseDark: Omit<ThemeDefinition["colors"]["dark"], "chart1" | "chart2" | "chart3" | "chart4" | "chart5"> = {
  background: "#1A1512",
  foreground: "#F5EDE6",
  card: "#231C18",
  cardForeground: "#F5EDE6",
  popover: "#2D251F",
  popoverForeground: "#F5EDE6",
  primary: "#E8743B",
  primaryForeground: "#1A1512",
  secondary: "#2D251F",
  secondaryForeground: "#F5EDE6",
  muted: "#3A2F28",
  mutedForeground: "#A89A8F",
  accent: "#E8743B",
  accentForeground: "#1A1512",
  destructive: "#D94D3A",
  destructiveForeground: "#FFFFFF",
  border: "rgba(245, 237, 230, 0.08)",
  input: "rgba(245, 237, 230, 0.05)",
  inputBackground: "#2D251F",
  switchBackground: "#3A2F28",
  ring: "#E8743B",
  sidebar: "#231C18",
  sidebarForeground: "#F5EDE6",
  sidebarPrimary: "#E8743B",
  sidebarPrimaryForeground: "#1A1512",
  sidebarAccent: "#2D251F",
  sidebarAccentForeground: "#F5EDE6",
  sidebarBorder: "rgba(245, 237, 230, 0.08)",
  sidebarRing: "#E8743B",
  hoverGlow: "rgba(244, 162, 97, 0.32)",
  warning: "#f59e0b",
  warningForeground: "#fef3c7",
  success: "#34d399",
  successForeground: "#052e16",
};

function createTheme(theme: Omit<ThemeDefinition, "colors"> & { colors: { light: Partial<ThemeDefinition["colors"]["light"]>; dark: Partial<ThemeDefinition["colors"]["dark"]> } }): ThemeDefinition {
  return {
    ...theme,
    colors: {
      light: { ...baseLight, ...theme.colors.light },
      dark: { ...baseDark, ...theme.colors.dark },
    },
  } as ThemeDefinition;
}

export const THEMES: ThemeDefinition[] = [
  createTheme({
    id: "funkhub",
    name: "Funkhub",
    hue: "25",
    colors: {
      light: {},
      dark: {},
    },
  }),
  createTheme({
    id: "purple",
    name: "Purple",
    hue: "270",
    colors: {
      light: { primary: "#A855F7", accent: "#A855F7", ring: "#A855F7", background: "#FAF6FF", sidebarPrimary: "#A855F7", sidebar: "#FAF6FF", hoverGlow: "rgba(168, 85, 247, 0.24)", chart1: "#A855F7", chart2: "#9333EA", chart3: "#C084FC", chart4: "#E879F9", chart5: "#F0ABFC" },
      dark: { primary: "#A855F7", accent: "#A855F7", ring: "#A855F7", background: "#1A1520", sidebarPrimary: "#A855F7", sidebar: "#1A1520", hoverGlow: "rgba(192, 132, 252, 0.32)", chart1: "#A855F7", chart2: "#9333EA", chart3: "#C084FC", chart4: "#E879F9", chart5: "#F0ABFC" },
    },
  }),
  createTheme({
    id: "pink",
    name: "Pink",
    hue: "330",
    colors: {
      light: { primary: "#EC4899", accent: "#EC4899", ring: "#EC4899", background: "#FFF6FA", sidebarPrimary: "#EC4899", sidebar: "#FFF6FA", hoverGlow: "rgba(236, 72, 153, 0.24)", chart1: "#EC4899", chart2: "#DB2777", chart3: "#F472B6", chart4: "#F9A8D4", chart5: "#FBCFE8" },
      dark: { primary: "#EC4899", accent: "#EC4899", ring: "#EC4899", background: "#1F1520", sidebarPrimary: "#EC4899", sidebar: "#1F1520", hoverGlow: "rgba(244, 114, 182, 0.32)", chart1: "#EC4899", chart2: "#DB2777", chart3: "#F472B6", chart4: "#F9A8D4", chart5: "#FBCFE8" },
    },
  }),
  createTheme({
    id: "blue",
    name: "Blue",
    hue: "220",
    colors: {
      light: { primary: "#3B82F6", accent: "#3B82F6", ring: "#3B82F6", background: "#F0F6FF", sidebarPrimary: "#3B82F6", sidebar: "#F0F6FF", hoverGlow: "rgba(59, 130, 246, 0.24)", chart1: "#3B82F6", chart2: "#2563EB", chart3: "#60A5FA", chart4: "#93C5FD", chart5: "#BFDBFE" },
      dark: { primary: "#3B82F6", accent: "#3B82F6", ring: "#3B82F6", background: "#151F2A", sidebarPrimary: "#3B82F6", sidebar: "#151F2A", hoverGlow: "rgba(96, 165, 250, 0.32)", chart1: "#3B82F6", chart2: "#2563EB", chart3: "#60A5FA", chart4: "#93C5FD", chart5: "#BFDBFE" },
    },
  }),
  createTheme({
    id: "green",
    name: "Green",
    hue: "140",
    colors: {
      light: { primary: "#22C55E", accent: "#22C55E", ring: "#22C55E", background: "#F0FFF4", sidebarPrimary: "#22C55E", sidebar: "#F0FFF4", hoverGlow: "rgba(34, 197, 94, 0.24)", chart1: "#22C55E", chart2: "#16A34A", chart3: "#4ADE80", chart4: "#86EFAC", chart5: "#BBF7D0" },
      dark: { primary: "#22C55E", accent: "#22C55E", ring: "#22C55E", background: "#152A1A", sidebarPrimary: "#22C55E", sidebar: "#152A1A", hoverGlow: "rgba(74, 222, 128, 0.32)", chart1: "#22C55E", chart2: "#16A34A", chart3: "#4ADE80", chart4: "#86EFAC", chart5: "#BBF7D0" },
    },
  }),
  createTheme({
    id: "red",
    name: "Red",
    hue: "0",
    colors: {
      light: { primary: "#EF4444", accent: "#EF4444", ring: "#EF4444", background: "#FFF5F5", sidebarPrimary: "#EF4444", sidebar: "#FFF5F5", hoverGlow: "rgba(239, 68, 68, 0.24)", chart1: "#EF4444", chart2: "#DC2626", chart3: "#F87171", chart4: "#FCA5A5", chart5: "#FECACA" },
      dark: { primary: "#EF4444", accent: "#EF4444", ring: "#EF4444", background: "#2A1515", sidebarPrimary: "#EF4444", sidebar: "#2A1515", hoverGlow: "rgba(248, 113, 113, 0.32)", chart1: "#EF4444", chart2: "#DC2626", chart3: "#F87171", chart4: "#FCA5A5", chart5: "#FECACA" },
    },
  }),
  createTheme({
    id: "alepsych",
    name: "ALE Psych Purple",
    hue: "260",
    colors: {
      light: { primary: "#7C3AED", accent: "#7C3AED", ring: "#7C3AED", background: "#FAF8FF", sidebarPrimary: "#7C3AED", sidebar: "#FAF8FF", hoverGlow: "rgba(124, 58, 237, 0.24)", chart1: "#7C3AED", chart2: "#6D28D9", chart3: "#A78BFA", chart4: "#C4B5FD", chart5: "#DDD6FE" },
      dark: { primary: "#7C3AED", accent: "#7C3AED", ring: "#7C3AED", background: "#1A1528", sidebarPrimary: "#7C3AED", sidebar: "#1A1528", hoverGlow: "rgba(167, 139, 250, 0.32)", chart1: "#7C3AED", chart2: "#6D28D9", chart3: "#A78BFA", chart4: "#C4B5FD", chart5: "#DDD6FE" },
    },
  }),
  createTheme({
    id: "ocean",
    name: "Ocean",
    hue: "175",
    colors: {
      light: { primary: "#14B8A6", accent: "#14B8A6", ring: "#14B8A6", background: "#F0FFFA", sidebarPrimary: "#14B8A6", sidebar: "#F0FFFA", hoverGlow: "rgba(20, 184, 166, 0.24)", chart1: "#14B8A6", chart2: "#0D9488", chart3: "#2DD4BF", chart4: "#5EEAD4", chart5: "#99F6E4" },
      dark: { primary: "#14B8A6", accent: "#14B8A6", ring: "#14B8A6", background: "#152A28", sidebarPrimary: "#14B8A6", sidebar: "#152A28", hoverGlow: "rgba(45, 212, 191, 0.32)", chart1: "#14B8A6", chart2: "#0D9488", chart3: "#2DD4BF", chart4: "#5EEAD4", chart5: "#99F6E4" },
    },
  }),
  createTheme({
    id: "mint",
    name: "Mint",
    hue: "160",
    colors: {
      light: { primary: "#10B981", accent: "#10B981", ring: "#10B981", background: "#F0FFF4", sidebarPrimary: "#10B981", sidebar: "#F0FFF4", hoverGlow: "rgba(16, 185, 129, 0.24)", chart1: "#10B981", chart2: "#059669", chart3: "#34D399", chart4: "#6EE7B7", chart5: "#A7F3D0" },
      dark: { primary: "#10B981", accent: "#10B981", ring: "#10B981", background: "#152A20", sidebarPrimary: "#10B981", sidebar: "#152A20", hoverGlow: "rgba(52, 211, 153, 0.32)", chart1: "#10B981", chart2: "#059669", chart3: "#34D399", chart4: "#6EE7B7", chart5: "#A7F3D0" },
    },
  }),
  createTheme({
    id: "rose",
    name: "Rose",
    hue: "350",
    colors: {
      light: { primary: "#F43F5E", accent: "#F43F5E", ring: "#F43F5E", background: "#FFF0F3", sidebarPrimary: "#F43F5E", sidebar: "#FFF0F3", hoverGlow: "rgba(244, 63, 94, 0.24)", chart1: "#F43F5E", chart2: "#E11D48", chart3: "#FB7185", chart4: "#FDA4AF", chart5: "#FECDD3" },
      dark: { primary: "#F43F5E", accent: "#F43F5E", ring: "#F43F5E", background: "#281520", sidebarPrimary: "#F43F5E", sidebar: "#281520", hoverGlow: "rgba(251, 113, 133, 0.32)", chart1: "#F43F5E", chart2: "#E11D48", chart3: "#FB7185", chart4: "#FDA4AF", chart5: "#FECDD3" },
    },
  }),
  createTheme({
    id: "gold",
    name: "Gold",
    hue: "40",
    colors: {
      light: { primary: "#F59E0B", accent: "#F59E0B", ring: "#F59E0B", background: "#FFFBF0", sidebarPrimary: "#F59E0B", sidebar: "#FFFBF0", hoverGlow: "rgba(245, 158, 11, 0.24)", chart1: "#F59E0B", chart2: "#D97706", chart3: "#FBBF24", chart4: "#FCD34D", chart5: "#FDE68A" },
      dark: { primary: "#F59E0B", accent: "#F59E0B", ring: "#F59E0B", background: "#28200A", sidebarPrimary: "#F59E0B", sidebar: "#28200A", hoverGlow: "rgba(251, 191, 36, 0.32)", chart1: "#F59E0B", chart2: "#D97706", chart3: "#FBBF24", chart4: "#FCD34D", chart5: "#FDE68A" },
    },
  }),
  createTheme({
    id: "lavender",
    name: "Lavender",
    hue: "250",
    colors: {
      light: { primary: "#A78BFA", accent: "#A78BFA", ring: "#A78BFA", background: "#F8F5FF", sidebarPrimary: "#A78BFA", sidebar: "#F8F5FF", hoverGlow: "rgba(167, 139, 250, 0.24)", chart1: "#A78BFA", chart2: "#8B5CF6", chart3: "#C4B5FD", chart4: "#DDD6FE", chart5: "#EDE9FE" },
      dark: { primary: "#A78BFA", accent: "#A78BFA", ring: "#A78BFA", background: "#1E1A28", sidebarPrimary: "#A78BFA", sidebar: "#1E1A28", hoverGlow: "rgba(196, 181, 253, 0.32)", chart1: "#A78BFA", chart2: "#8B5CF6", chart3: "#C4B5FD", chart4: "#DDD6FE", chart5: "#EDE9FE" },
    },
  }),
  createTheme({
    id: "midnight",
    name: "Midnight",
    hue: "215",
    colors: {
      light: { primary: "#3B82F6", accent: "#3B82F6", ring: "#3B82F6", background: "#F0F5FF", sidebarPrimary: "#3B82F6", sidebar: "#F0F5FF", hoverGlow: "rgba(59, 130, 246, 0.24)", chart1: "#3B82F6", chart2: "#1D4ED8", chart3: "#60A5FA", chart4: "#93C5FD", chart5: "#BFDBFE" },
      dark: { primary: "#3B82F6", accent: "#3B82F6", ring: "#3B82F6", background: "#0F1A2A", sidebarPrimary: "#3B82F6", sidebar: "#0F1A2A", hoverGlow: "rgba(96, 165, 250, 0.32)", chart1: "#3B82F6", chart2: "#1D4ED8", chart3: "#60A5FA", chart4: "#93C5FD", chart5: "#BFDBFE" },
    },
  }),
  createTheme({
    id: "coral",
    name: "Coral",
    hue: "15",
    colors: {
      light: { primary: "#FF7F50", accent: "#FF7F50", ring: "#FF7F50", background: "#FFF5F0", sidebarPrimary: "#FF7F50", sidebar: "#FFF5F0", hoverGlow: "rgba(255, 127, 80, 0.24)", chart1: "#FF7F50", chart2: "#F97316", chart3: "#FB923C", chart4: "#FDBA74", chart5: "#FED7AA" },
      dark: { primary: "#FF7F50", accent: "#FF7F50", ring: "#FF7F50", background: "#2A1A15", sidebarPrimary: "#FF7F50", sidebar: "#2A1A15", hoverGlow: "rgba(253, 146, 86, 0.32)", chart1: "#FF7F50", chart2: "#F97316", chart3: "#FB923C", chart4: "#FDBA74", chart5: "#FED7AA" },
    },
  }),
  createTheme({
    id: "slate",
    name: "Slate",
    hue: "210",
    colors: {
      light: { primary: "#64748B", accent: "#64748B", ring: "#64748B", background: "#F5F7FA", sidebarPrimary: "#64748B", sidebar: "#F5F7FA", hoverGlow: "rgba(100, 116, 139, 0.24)", chart1: "#64748B", chart2: "#475569", chart3: "#94A3B8", chart4: "#CBD5E1", chart5: "#E2E8F0" },
      dark: { primary: "#64748B", accent: "#64748B", ring: "#64748B", background: "#1A1E24", sidebarPrimary: "#64748B", sidebar: "#1A1E24", hoverGlow: "rgba(148, 163, 184, 0.32)", chart1: "#64748B", chart2: "#475569", chart3: "#94A3B8", chart4: "#CBD5E1", chart5: "#E2E8F0" },
    },
  }),
];

export function getThemeById(id: string): ThemeDefinition {
  return THEMES.find((t) => t.id === id) || THEMES[0];
}
