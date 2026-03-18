import type { ThemeDefinition } from "./themeTypes";

function clamp(v: number) { return Math.max(0, Math.min(255, Math.round(v))); }

function saturateColor(hex: string, factor: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const mid = (r + g + b) / 3;
  return `#${clamp(mid + (r - mid) * factor).toString(16).padStart(2, "0")}${clamp(mid + (g - mid) * factor).toString(16).padStart(2, "0")}${clamp(mid + (b - mid) * factor).toString(16).padStart(2, "0")}`;
}

function mixColors(c1: string, c2: string, w1: number): string {
  const r1 = parseInt(c1.slice(1, 3), 16), g1 = parseInt(c1.slice(3, 5), 16), b1 = parseInt(c1.slice(5, 7), 16);
  const r2 = parseInt(c2.slice(1, 3), 16), g2 = parseInt(c2.slice(3, 5), 16), b2 = parseInt(c2.slice(5, 7), 16);
  return `#${clamp(r1 * w1 + r2 * (1 - w1)).toString(16).padStart(2, "0")}${clamp(g1 * w1 + g2 * (1 - w1)).toString(16).padStart(2, "0")}${clamp(b1 * w1 + b2 * (1 - w1)).toString(16).padStart(2, "0")}`;
}

function rgbaOf(hex: string, a: number): string {
  return `rgba(${parseInt(hex.slice(1, 3), 16)}, ${parseInt(hex.slice(3, 5), 16)}, ${parseInt(hex.slice(5, 7), 16)}, ${a})`;
}

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

/** Vibrant — electric night. Deep black backgrounds, hyper-saturated neon accents. */
function createVibrantColors(primary: string, background: string): ThemeDefinition["colors"]["vibrant"] {
  const vPrimary = saturateColor(primary, 1.8);
  const vBg = mixColors(background, "#000000", 0.6);
  const foreground = "#F2EAE2";
  const card = adjustColorTowards(vBg, "#FFFFFF", 0.04);
  const popover = adjustColorTowards(vBg, "#FFFFFF", 0.09);
  const secondary = adjustColorTowards(vBg, vPrimary, 0.18);
  const muted = adjustColorTowards(vBg, vPrimary, 0.12);
  const border = rgbaOf(vPrimary, 0.14);
  const input = rgbaOf(vPrimary, 0.07);

  return {
    background: vBg, foreground,
    card, cardForeground: foreground,
    popover, popoverForeground: foreground,
    primary: vPrimary, primaryForeground: "#050302",
    secondary, secondaryForeground: foreground,
    muted, mutedForeground: "#8A7E76",
    accent: vPrimary, accentForeground: "#050302",
    destructive: "#FF3535", destructiveForeground: "#FFFFFF",
    border, input, inputBackground: card, switchBackground: muted,
    ring: vPrimary,
    chart1: vPrimary,
    chart2: saturateColor(adjustColorTowards(vPrimary, "#000000", 0.18), 1.4),
    chart3: saturateColor(adjustColorTowards(vPrimary, "#000000", 0.32), 1.3),
    chart4: saturateColor(adjustColorTowards(vPrimary, "#000000", 0.46), 1.2),
    chart5: saturateColor(adjustColorTowards(vPrimary, "#000000", 0.58), 1.1),
    sidebar: card, sidebarForeground: foreground,
    sidebarPrimary: vPrimary, sidebarPrimaryForeground: "#050302",
    sidebarAccent: secondary, sidebarAccentForeground: foreground,
    sidebarBorder: border, sidebarRing: vPrimary,
    hoverGlow: rgbaOf(vPrimary, 0.45),
    warning: saturateColor("#F59E0B", 1.4), warningForeground: "#1A1512",
    success: saturateColor("#34D399", 1.4), successForeground: "#052E16",
  };
}

/** Pastel — soft & airy. Near-white backgrounds, gentle washed-out accents. */
function createPastelColors(primary: string, _background: string): ThemeDefinition["colors"]["pastel"] {
  const pPrimary = mixColors(primary, "#FFFFFF", 0.5);
  const pBg = adjustColorTowards("#FAFAF8", primary, 0.04);
  const foreground = "#2E2825";
  const card = "#FFFFFF";
  const secondary = adjustColorTowards("#F2EDE8", primary, 0.07);
  const muted = adjustColorTowards("#EAE5DF", primary, 0.05);
  const border = adjustRgbaTowards("rgba(46, 40, 37, 0.10)", primary, 0.02);
  const input = adjustRgbaTowards("rgba(46, 40, 37, 0.04)", primary, 0.01);

  return {
    background: pBg, foreground,
    card, cardForeground: foreground,
    popover: card, popoverForeground: foreground,
    primary: pPrimary, primaryForeground: "#2A201C",
    secondary, secondaryForeground: foreground,
    muted, mutedForeground: "#8A7E78",
    accent: pPrimary, accentForeground: "#2A201C",
    destructive: "#E89E9B", destructiveForeground: "#2E0D0C",
    border, input, inputBackground: card, switchBackground: muted,
    ring: pPrimary,
    chart1: pPrimary,
    chart2: mixColors(pPrimary, "#FFFFFF", 0.3),
    chart3: mixColors(pPrimary, "#FFFFFF", 0.5),
    chart4: mixColors(pPrimary, "#FFFFFF", 0.65),
    chart5: mixColors(pPrimary, "#FFFFFF", 0.78),
    sidebar: card, sidebarForeground: foreground,
    sidebarPrimary: pPrimary, sidebarPrimaryForeground: "#2A201C",
    sidebarAccent: secondary, sidebarAccentForeground: foreground,
    sidebarBorder: border, sidebarRing: pPrimary,
    hoverGlow: rgbaOf(pPrimary, 0.18),
    warning: mixColors("#F59E0B", "#FFFFFF", 0.5), warningForeground: "#3D2A00",
    success: mixColors("#34D399", "#FFFFFF", 0.5), successForeground: "#0D2E1A",
  };
}

/** Focus — minimal dark. Near-monochrome, very muted accents for distraction-free use. */
function createFocusColors(primary: string, _background: string): ThemeDefinition["colors"]["focus"] {
  const fPrimary = mixColors(primary, "#5A5A5A", 0.35);
  const foreground = "#9A938D";
  const card = "#161614";
  const popover = "#1E1D1B";

  return {
    background: "#0F0F0E", foreground,
    card, cardForeground: foreground,
    popover, popoverForeground: foreground,
    primary: fPrimary, primaryForeground: "#0C0B0A",
    secondary: "#1A1917", secondaryForeground: "#6A6460",
    muted: "#151413", mutedForeground: "#5C5752",
    accent: fPrimary, accentForeground: "#0C0B0A",
    destructive: "#7A3C3C", destructiveForeground: "#E8D0D0",
    border: "rgba(200, 192, 185, 0.06)",
    input: "rgba(200, 192, 185, 0.04)",
    inputBackground: card, switchBackground: "#151413",
    ring: fPrimary,
    chart1: fPrimary,
    chart2: mixColors(fPrimary, "#5A5A5A", 0.3),
    chart3: mixColors(fPrimary, "#5A5A5A", 0.5),
    chart4: mixColors(fPrimary, "#5A5A5A", 0.65),
    chart5: mixColors(fPrimary, "#5A5A5A", 0.78),
    sidebar: card, sidebarForeground: foreground,
    sidebarPrimary: fPrimary, sidebarPrimaryForeground: "#0C0B0A",
    sidebarAccent: "#1A1917", sidebarAccentForeground: "#6A6460",
    sidebarBorder: "rgba(200, 192, 185, 0.06)", sidebarRing: fPrimary,
    hoverGlow: rgbaOf(fPrimary, 0.12),
    warning: mixColors("#F59E0B", "#5A5A5A", 0.45), warningForeground: "#F0E8D8",
    success: mixColors("#34D399", "#5A5A5A", 0.45), successForeground: "#D0ECD8",
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
      vibrant: createVibrantColors("#E8743B", "#1A1512"),
      pastel: createPastelColors("#E8743B", "#1A1512"),
      focus: createFocusColors("#E8743B", "#1A1512"),
    },
  },
  {
    id: "purple",
    name: "Purple",
    hue: "270",
    colors: {
      light: createLightColors("#A855F7", "#FAF6FF"),
      dark: createDarkColors("#A855F7", "#1A1520"),
      vibrant: createVibrantColors("#A855F7", "#1A1520"),
      pastel: createPastelColors("#A855F7", "#1A1520"),
      focus: createFocusColors("#A855F7", "#1A1520"),
    },
  },
  {
    id: "pink",
    name: "Pink",
    hue: "330",
    colors: {
      light: createLightColors("#EC4899", "#FFF6FA"),
      dark: createDarkColors("#EC4899", "#1F1520"),
      vibrant: createVibrantColors("#EC4899", "#1F1520"),
      pastel: createPastelColors("#EC4899", "#1F1520"),
      focus: createFocusColors("#EC4899", "#1F1520"),
    },
  },
  {
    id: "blue",
    name: "Blue",
    hue: "220",
    colors: {
      light: createLightColors("#3B82F6", "#F0F6FF"),
      dark: createDarkColors("#3B82F6", "#151F2A"),
      vibrant: createVibrantColors("#3B82F6", "#151F2A"),
      pastel: createPastelColors("#3B82F6", "#151F2A"),
      focus: createFocusColors("#3B82F6", "#151F2A"),
    },
  },
  {
    id: "green",
    name: "Green",
    hue: "140",
    colors: {
      light: createLightColors("#22C55E", "#F0FFF4"),
      dark: createDarkColors("#22C55E", "#152A1A"),
      vibrant: createVibrantColors("#22C55E", "#152A1A"),
      pastel: createPastelColors("#22C55E", "#152A1A"),
      focus: createFocusColors("#22C55E", "#152A1A"),
    },
  },
  {
    id: "red",
    name: "Red",
    hue: "0",
    colors: {
      light: createLightColors("#EF4444", "#FFF5F5"),
      dark: createDarkColors("#EF4444", "#2A1515"),
      vibrant: createVibrantColors("#EF4444", "#2A1515"),
      pastel: createPastelColors("#EF4444", "#2A1515"),
      focus: createFocusColors("#EF4444", "#2A1515"),
    },
  },
  {
    id: "alepsych",
    name: "ALE Psych Purple",
    hue: "260",
    colors: {
      light: createLightColors("#7C3AED", "#FAF8FF"),
      dark: createDarkColors("#7C3AED", "#1A1528"),
      vibrant: createVibrantColors("#7C3AED", "#1A1528"),
      pastel: createPastelColors("#7C3AED", "#1A1528"),
      focus: createFocusColors("#7C3AED", "#1A1528"),
    },
  },
  {
    id: "ocean",
    name: "Ocean",
    hue: "175",
    colors: {
      light: createLightColors("#14B8A6", "#F0FFFA"),
      dark: createDarkColors("#14B8A6", "#152A28"),
      vibrant: createVibrantColors("#14B8A6", "#152A28"),
      pastel: createPastelColors("#14B8A6", "#152A28"),
      focus: createFocusColors("#14B8A6", "#152A28"),
    },
  },
  {
    id: "mint",
    name: "Mint",
    hue: "160",
    colors: {
      light: createLightColors("#10B981", "#F0FFF4"),
      dark: createDarkColors("#10B981", "#152A20"),
      vibrant: createVibrantColors("#10B981", "#152A20"),
      pastel: createPastelColors("#10B981", "#152A20"),
      focus: createFocusColors("#10B981", "#152A20"),
    },
  },
  {
    id: "rose",
    name: "Rose",
    hue: "350",
    colors: {
      light: createLightColors("#F43F5E", "#FFF0F3"),
      dark: createDarkColors("#F43F5E", "#281520"),
      vibrant: createVibrantColors("#F43F5E", "#281520"),
      pastel: createPastelColors("#F43F5E", "#281520"),
      focus: createFocusColors("#F43F5E", "#281520"),
    },
  },
  {
    id: "gold",
    name: "Gold",
    hue: "40",
    colors: {
      light: createLightColors("#F59E0B", "#FFFBF0"),
      dark: createDarkColors("#F59E0B", "#28200A"),
      vibrant: createVibrantColors("#F59E0B", "#28200A"),
      pastel: createPastelColors("#F59E0B", "#28200A"),
      focus: createFocusColors("#F59E0B", "#28200A"),
    },
  },
  {
    id: "lavender",
    name: "Lavender",
    hue: "250",
    colors: {
      light: createLightColors("#A78BFA", "#F8F5FF"),
      dark: createDarkColors("#A78BFA", "#1E1A28"),
      vibrant: createVibrantColors("#A78BFA", "#1E1A28"),
      pastel: createPastelColors("#A78BFA", "#1E1A28"),
      focus: createFocusColors("#A78BFA", "#1E1A28"),
    },
  },
  {
    id: "midnight",
    name: "Midnight",
    hue: "215",
    colors: {
      light: createLightColors("#3B82F6", "#F0F5FF"),
      dark: createDarkColors("#3B82F6", "#0F1A2A"),
      vibrant: createVibrantColors("#3B82F6", "#0F1A2A"),
      pastel: createPastelColors("#3B82F6", "#0F1A2A"),
      focus: createFocusColors("#3B82F6", "#0F1A2A"),
    },
  },
  {
    id: "coral",
    name: "Coral",
    hue: "15",
    colors: {
      light: createLightColors("#FF7F50", "#FFF5F0"),
      dark: createDarkColors("#FF7F50", "#2A1A15"),
      vibrant: createVibrantColors("#FF7F50", "#2A1A15"),
      pastel: createPastelColors("#FF7F50", "#2A1A15"),
      focus: createFocusColors("#FF7F50", "#2A1A15"),
    },
  },
  {
    id: "slate",
    name: "Slate",
    hue: "210",
    colors: {
      light: createLightColors("#64748B", "#F5F7FA"),
      dark: createDarkColors("#64748B", "#1A1E24"),
      vibrant: createVibrantColors("#64748B", "#1A1E24"),
      pastel: createPastelColors("#64748B", "#1A1E24"),
      focus: createFocusColors("#64748B", "#1A1E24"),
    },
  },
  {
    id: "gamebanana",
    name: "Gamebanana Yellow",
    hue: "50",
    colors: {
      light: createLightColors("#FFE900", "#FFFFE6"),
      dark: createDarkColors("#FFE900", "#1A1A0F"),
      vibrant: createVibrantColors("#FFE900", "#1A1A0F"),
      pastel: createPastelColors("#FFE900", "#1A1A0F"),
      focus: createFocusColors("#FFE900", "#1A1A0F"),
    },
  },
];

export function getThemeById(id: string): ThemeDefinition {
  return THEMES.find((t) => t.id === id) || THEMES[0];
}
