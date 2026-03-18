import type { ThemeDefinition } from "./themeTypes";

function adjustColorTowards(color: string, towards: string, amount: number): string {
  const hex = (c: string) => parseInt(c, 16);
  const r1 = hex(color.slice(1, 3));
  const g1 = hex(color.slice(3, 5));
  const b1 = hex(color.slice(5, 7));
  const r2 = hex(towards.slice(1, 3));
  const g2 = hex(towards.slice(3, 5));
  const b2 = hex(towards.slice(5, 7));
  
  const r = Math.round(r1 * (1 - amount) + r2 * amount);
  const g = Math.round(g1 * (1 - amount) + g2 * amount);
  const b = Math.round(b1 * (1 - amount) + b2 * amount);
  
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function adjustRgbaTowards(color: string, towards: string, amount: number): string {
  if (!color.startsWith("rgba")) return adjustColorTowards(color, towards, amount);
  
  const rgbaMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (!rgbaMatch) return color;
  
  const r = parseInt(rgbaMatch[1]);
  const g = parseInt(rgbaMatch[2]);
  const b = parseInt(rgbaMatch[3]);
  const a = rgbaMatch[4] ? parseFloat(rgbaMatch[4]) : 1;
  
  const towardsHex = (c: string) => parseInt(c.slice(1, 3), 16);
  const r2 = towardsHex(towards.slice(1, 3));
  const g2 = towardsHex(towards.slice(3, 5));
  const b2 = towardsHex(towards.slice(5, 7));
  
  const newR = Math.round(r * (1 - amount) + r2 * amount);
  const newG = Math.round(g * (1 - amount) + g2 * amount);
  const newB = Math.round(b * (1 - amount) + b2 * amount);
  
  return a < 1 ? `rgba(${newR}, ${newG}, ${newB}, ${a})` : `rgb(${newR}, ${newG}, ${newB})`;
}

function createLightColors(primary: string, background: string): ThemeDefinition["colors"]["light"] {
  const primaryDark = "#1A1512";
  const foreground = "#2D2520";
  const secondary = adjustColorTowards("#F5EDE6", primary, 0.08);
  const muted = adjustColorTowards("#EDE5DD", primary, 0.05);
  const card = "#FFFFFF";
  const border = adjustRgbaTowards("rgba(45, 37, 32, 0.12)", primary, 0.03);
  const input = adjustRgbaTowards("rgba(45, 37, 32, 0.05)", primary, 0.02);
  
  return {
    background,
    foreground,
    card,
    cardForeground: foreground,
    popover: card,
    popoverForeground: foreground,
    primary,
    primaryForeground: primaryDark,
    secondary,
    secondaryForeground: foreground,
    muted,
    mutedForeground: "#6B5D54",
    accent: primary,
    accentForeground: primaryDark,
    destructive: "#D94D3A",
    destructiveForeground: "#FFFFFF",
    border,
    input,
    inputBackground: card,
    switchBackground: muted,
    ring: primary,
    chart1: primary,
    chart2: adjustColorTowards(primary, "#", -0.15),
    chart3: adjustColorTowards(primary, "#", -0.25),
    chart4: adjustColorTowards(primary, "#", -0.35),
    chart5: adjustColorTowards(primary, "#", -0.45),
    sidebar: card,
    sidebarForeground: foreground,
    sidebarPrimary: primary,
    sidebarPrimaryForeground: primaryDark,
    sidebarAccent: secondary,
    sidebarAccentForeground: foreground,
    sidebarBorder: border,
    sidebarRing: primary,
    hoverGlow: `rgba(${parseInt(primary.slice(1, 3), 16)}, ${parseInt(primary.slice(3, 5), 16)}, ${parseInt(primary.slice(5, 7), 16)}, 0.15)`,
    warning: "#c2750a",
    warningForeground: "#fef3c7",
    success: "#2a7a4b",
    successForeground: "#d1fae5",
  };
}

function createDarkColors(primary: string, background: string): ThemeDefinition["colors"]["dark"] {
  const primaryForeground = "#1A1512";
  const foreground = "#F5EDE6";
  const secondary = adjustColorTowards(background, primary, 0.15);
  const muted = adjustColorTowards(background, primary, 0.1);
  const card = adjustColorTowards(background, "#FFFFFF", 0.04);
  const popover = adjustColorTowards(background, "#FFFFFF", 0.09);
  const border = adjustRgbaTowards("rgba(245, 237, 230, 0.08)", primary, 0.04);
  const input = adjustRgbaTowards("rgba(245, 237, 230, 0.05)", primary, 0.03);

  return {
    background,
    foreground,
    card,
    cardForeground: foreground,
    popover,
    popoverForeground: foreground,
    primary,
    primaryForeground: primaryForeground,
    secondary,
    secondaryForeground: foreground,
    muted,
    mutedForeground: "#A89A8F",
    accent: primary,
    accentForeground: primaryForeground,
    destructive: "#D94D3A",
    destructiveForeground: "#FFFFFF",
    border,
    input,
    inputBackground: popover,
    switchBackground: muted,
    ring: primary,
    chart1: primary,
    chart2: adjustColorTowards(primary, "#", -0.15),
    chart3: adjustColorTowards(primary, "#", -0.25),
    chart4: adjustColorTowards(primary, "#", -0.35),
    chart5: adjustColorTowards(primary, "#", -0.45),
    sidebar: card,
    sidebarForeground: foreground,
    sidebarPrimary: primary,
    sidebarPrimaryForeground: primaryForeground,
    sidebarAccent: secondary,
    sidebarAccentForeground: foreground,
    sidebarBorder: border,
    sidebarRing: primary,
    hoverGlow: `rgba(${parseInt(primary.slice(1, 3), 16)}, ${parseInt(primary.slice(3, 5), 16)}, ${parseInt(primary.slice(5, 7), 16)}, 0.2)`,
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
