# Theme System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement a comprehensive theme system with 15 color themes and 6 modes (light/dark/auto/vibrant/pastel/focus) that works across all pages.

**Architecture:** Data-driven theme system using TypeScript theme registry + CSS custom properties with data attributes. ThemeProvider manages state, CSS variables apply globally.

**Tech Stack:** React Context, TypeScript, CSS custom properties, Tailwind v4

---

## Phase 1: Foundation

### Task 1: Create Theme Registry

**Files:**
- Create: `app/services/funkhub/themes.ts`

**Step 1: Create themes.ts with theme definitions**

```typescript
import type { ThemeDefinition, ThemeMode, ThemeColors, ThemeContextType } from "./types";

export const THEMES: ThemeDefinition[] = [
  {
    id: "funkhub",
    name: "Funkhub",
    hue: "25",
    colors: {
      light: {
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
      },
      dark: {
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
      },
    },
  },
  // ... Add remaining 14 themes (purple, pink, blue, green, red, alepsych, ocean, mint, rose, gold, lavender, midnight, coral, slate)
];
```

**Step 2: Add remaining 14 themes to the registry**

Create full color definitions for all themes based on spec color tables.

**Step 3: Commit**

```bash
git add app/services/funkhub/themes.ts
git commit -m "feat: create theme registry with 15 themes"
```

---

### Task 2: Create Theme Types

**Files:**
- Create: `app/services/funkhub/themeTypes.ts` (or add to existing types.ts)

**Step 1: Define types**

```typescript
export type ThemeMode = "light" | "dark" | "auto" | "vibrant" | "pastel" | "focus";
export type BaseMode = "light" | "dark";

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
  };
}

export interface ThemeContextType {
  theme: string;
  mode: ThemeMode;
  effectiveMode: BaseMode;
  themeHue: string;
  setTheme: (theme: string) => void;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
  cycleMode: () => void;
  availableThemes: ThemeDefinition[];
  availableModes: { id: ThemeMode; name: string; icon: string }[];
}
```

**Step 2: Commit**

```bash
git add app/services/funkhub/themeTypes.ts
git commit -m "feat: add theme types"
```

---

### Task 3: Rewrite ThemeProvider

**Files:**
- Modify: `app/providers/ThemeProvider.tsx`

**Step 1: Replace ThemeProvider implementation**

```typescript
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { THEMES } from "../services/funkhub/themes";
import type { ThemeMode, BaseMode, ThemeContextType, ThemeDefinition } from "../services/funkhub/themeTypes";

const STORAGE_KEYS = {
  theme: "funkhub-theme",
  mode: "funkhub-mode",
};

export const AVAILABLE_MODES: { id: ThemeMode; name: string; icon: string }[] = [
  { id: "light", name: "Light", icon: "Sun" },
  { id: "dark", name: "Dark", icon: "Moon" },
  { id: "auto", name: "Auto", icon: "CircleArrow" },
  { id: "vibrant", name: "Vibrant", icon: "Sparkles" },
  { id: "pastel", name: "Pastel", icon: "Flower" },
  { id: "focus", name: "Focus", icon: "EyeMinus" },
];

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getSystemPreference(): BaseMode {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function resolveEffectiveMode(mode: ThemeMode): BaseMode {
  if (mode === "auto") {
    return getSystemPreference();
  }
  return mode as BaseMode;
}

function applyThemeToRoot(themeId: string, mode: ThemeMode, themes: ThemeDefinition[]) {
  const root = document.documentElement;
  const theme = themes.find((t) => t.id === themeId) || themes[0];
  const effectiveMode = resolveEffectiveMode(mode);
  const colors = theme.colors[effectiveMode];

  root.setAttribute("data-theme", themeId);
  root.setAttribute("data-mode", effectiveMode);

  // Apply CSS variables
  Object.entries(colors).forEach(([key, value]) => {
    const cssKey = key.replace(/([A-Z])/g, "-$1").toLowerCase();
    root.style.setProperty(`--${cssKey}`, value);
  });
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<string>(() => {
    if (typeof window === "undefined") return "funkhub";
    return localStorage.getItem(STORAGE_KEYS.theme) || "funkhub";
  });

  const [mode, setMode] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "dark";
    return (localStorage.getItem(STORAGE_KEYS.mode) as ThemeMode) || "dark";
  });

  const effectiveMode = resolveEffectiveMode(mode);
  const currentTheme = THEMES.find((t) => t.id === theme) || THEMES[0];
  const themeHue = currentTheme?.hue || "25";

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.theme, theme);
    localStorage.setItem(STORAGE_KEYS.mode, mode);
    applyThemeToRoot(theme, mode, THEMES);
  }, [theme, mode]);

  useEffect(() => {
    if (mode !== "auto") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      // Force re-render to update effectiveMode
      setMode((prev) => ({ ...prev } as ThemeMode));
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, [mode]);

  const toggleMode = useCallback(() => {
    const modes: ThemeMode[] = ["light", "dark", "auto", "vibrant", "pastel", "focus"];
    const currentIndex = modes.indexOf(mode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setMode(modes[nextIndex]);
  }, [mode]);

  const cycleMode = useCallback(() => {
    toggleMode();
  }, [toggleMode]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        mode,
        effectiveMode,
        themeHue,
        setTheme,
        setMode,
        toggleMode,
        cycleMode,
        availableThemes: THEMES,
        availableModes: AVAILABLE_MODES,
      }}
    >
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
```

**Step 2: Commit**

```bash
git add app/providers/ThemeProvider.tsx
git commit -m "feat: rewrite ThemeProvider with 15 themes and 6 modes"
```

---

### Task 4: Update CSS Theme Variables

**Files:**
- Modify: `styles/theme.css`

**Step 1: Replace CSS with data-attribute based rules**

Replace the current `:root` and `.dark` rules with:

```css
@custom-variant dark (&:is([data-mode="dark"] *));

:root {
  /* Default fallback values */
  --font-size: 16px;
  --font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  
  /* Theme variables - applied via JS */
  --background: #1A1512;
  --foreground: #F5EDE6;
  --card: #231C18;
  --card-foreground: #F5EDE6;
  --popover: #2D251F;
  --popover-foreground: #F5EDE6;
  --primary: #E8743B;
  --primary-foreground: #1A1512;
  --secondary: #2D251F;
  --secondary-foreground: #F5EDE6;
  --muted: #3A2F28;
  --muted-foreground: #A89A8F;
  --accent: #E8743B;
  --accent-foreground: #1A1512;
  --destructive: #D94D3A;
  --destructive-foreground: #FFFFFF;
  --border: rgba(245, 237, 230, 0.08);
  --input: rgba(245, 237, 230, 0.05);
  --input-background: #2D251F;
  --switch-background: #3A2F28;
  --ring: #E8743B;
  --chart-1: #E8743B;
  --chart-2: #D97E4A;
  --chart-3: #F4A261;
  --chart-4: #E76F51;
  --chart-5: #E9C46A;
  --radius: 0.75rem;
  --sidebar: #231C18;
  --sidebar-foreground: #F5EDE6;
  --sidebar-primary: #E8743B;
  --sidebar-primary-foreground: #1A1512;
  --sidebar-accent: #2D251F;
  --sidebar-accent-foreground: #F5EDE6;
  --sidebar-border: rgba(245, 237, 230, 0.08);
  --sidebar-ring: #E8743B;
  --hover-glow: rgba(244, 162, 97, 0.32);
  --warning: #f59e0b;
  --warning-foreground: #fef3c7;
  --success: #34d399;
  --success-foreground: #052e16;
}

/* Mode modifiers */
[data-mode="vibrant"] {
  --primary: color-mix(in srgb, var(--primary) 120%, white);
  --accent: color-mix(in srgb, var(--accent) 120%, white);
  --chart-1: color-mix(in srgb, var(--chart-1) 120%, white);
}

[data-mode="pastel"] {
  --primary: color-mix(in srgb, var(--primary) 60%, white);
  --secondary: color-mix(in srgb, var(--secondary) 70%, white);
  --muted: color-mix(in srgb, var(--muted) 80%, white);
  --accent: color-mix(in srgb, var(--accent) 60%, white);
}

[data-mode="focus"] {
  --primary: color-mix(in srgb, var(--primary) 50%, gray);
  --secondary: color-mix(in srgb, var(--secondary) 60%, var(--background));
  --muted: color-mix(in srgb, var(--muted) 70%, var(--background));
  --accent: color-mix(in srgb, var(--accent) 40%, var(--background));
  --hover-glow: transparent;
}

/* Light mode base */
[data-mode="light"] {
  --background: #FAF8F5;
  --foreground: #2D2520;
  --card: #FFFFFF;
  --card-foreground: #2D2520;
  --popover: #FFFFFF;
  --popover-foreground: #2D2520;
  --primary-foreground: #1A1512;
  --secondary: #F5EDE6;
  --secondary-foreground: #2D2520;
  --muted: #EDE5DD;
  --muted-foreground: #6B5D54;
  --accent-foreground: #1A1512;
  --border: rgba(45, 37, 32, 0.12);
  --input: rgba(45, 37, 32, 0.05);
  --input-background: #FFFFFF;
  --switch-background: #EDE5DD;
  --sidebar: #FFFFFF;
  --sidebar-foreground: #2D2520;
  --sidebar-primary-foreground: #1A1512;
  --sidebar-accent: #F5EDE6;
  --sidebar-accent-foreground: #2D2520;
  --sidebar-border: rgba(45, 37, 32, 0.12);
  --hover-glow: rgba(232, 116, 59, 0.24);
}

/* Theme-specific overrides for light mode */
[data-theme="funkhub"][data-mode="light"] { --primary: #E8743B; }
[data-theme="purple"][data-mode="light"] { --primary: #A855F7; --background: #FAF6FF; }
[data-theme="pink"][data-mode="light"] { --primary: #EC4899; --background: #FFF6FA; }
[data-theme="blue"][data-mode="light"] { --primary: #3B82F6; --background: #F0F6FF; }
[data-theme="green"][data-mode="light"] { --primary: #22C55E; --background: #F0FFF4; }
[data-theme="red"][data-mode="light"] { --primary: #EF4444; --background: #FFF5F5; }
[data-theme="alepsych"][data-mode="light"] { --primary: #7C3AED; --background: #FAF8FF; }
[data-theme="ocean"][data-mode="light"] { --primary: #14B8A6; --background: #F0FFFA; }
[data-theme="mint"][data-mode="light"] { --primary: #10B981; --background: #F0FFF4; }
[data-theme="rose"][data-mode="light"] { --primary: #F43F5E; --background: #FFF0F3; }
[data-theme="gold"][data-mode="light"] { --primary: #F59E0B; --background: #FFFBF0; }
[data-theme="lavender"][data-mode="light"] { --primary: #A78BFA; --background: #F8F5FF; }
[data-theme="midnight"][data-mode="light"] { --primary: #3B82F6; --background: #F0F5FF; }
[data-theme="coral"][data-mode="light"] { --primary: #FF7F50; --background: #FFF5F0; }
[data-theme="slate"][data-mode="light"] { --primary: #64748B; --background: #F5F7FA; }

/* Theme-specific overrides for dark mode */
[data-theme="funkhub"][data-mode="dark"] { --primary: #E8743B; --background: #1A1512; }
[data-theme="purple"][data-mode="dark"] { --primary: #A855F7; --background: #1A1520; }
[data-theme="pink"][data-mode="dark"] { --primary: #EC4899; --background: #1F1520; }
[data-theme="blue"][data-mode="dark"] { --primary: #3B82F6; --background: #151F2A; }
[data-theme="green"][data-mode="dark"] { --primary: #22C55E; --background: #152A1A; }
[data-theme="red"][data-mode="dark"] { --primary: #EF4444; --background: #2A1515; }
[data-theme="alepsych"][data-mode="dark"] { --primary: #7C3AED; --background: #1A1528; }
[data-theme="ocean"][data-mode="dark"] { --primary: #14B8A6; --background: #152A28; }
[data-theme="mint"][data-mode="dark"] { --primary: #10B981; --background: #152A20; }
[data-theme="rose"][data-mode="dark"] { --primary: #F43F5E; --background: #281520; }
[data-theme="gold"][data-mode="dark"] { --primary: #F59E0B; --background: #28200A; }
[data-theme="lavender"][data-mode="dark"] { --primary: #A78BFA; --background: #1E1A28; }
[data-theme="midnight"][data-mode="dark"] { --primary: #3B82F6; --background: #0F1A2A; }
[data-theme="coral"][data-mode="dark"] { --primary: #FF7F50; --background: #2A1A15; }
[data-theme="slate"][data-mode="dark"] { --primary: #64748B; --background: #1A1E24; }

/* Keep Tailwind theme mapping */
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-input-background: var(--input-background);
  --color-switch-background: var(--switch-background);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);
  --color-warning: var(--warning);
  --color-warning-foreground: var(--warning-foreground);
  --color-success: var(--success);
  --color-success-foreground: var(--success-foreground);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }

  body {
    @apply bg-background text-foreground;
    transition: background-color 0.2s ease, color 0.2s ease;
  }

  * {
    scrollbar-width: thin;
    scrollbar-color: color-mix(in srgb, var(--primary) 70%, transparent) color-mix(in srgb, var(--background) 88%, var(--foreground) 12%);
  }

  *::-webkit-scrollbar {
    width: 12px;
    height: 12px;
  }

  *::-webkit-scrollbar-track {
    background: color-mix(in srgb, var(--background) 88%, var(--foreground) 12%);
    border-radius: 999px;
  }

  *::-webkit-scrollbar-thumb {
    background: color-mix(in srgb, var(--primary) 70%, transparent);
    border: 3px solid color-mix(in srgb, var(--background) 88%, var(--foreground) 12%);
    border-radius: 999px;
  }

  *::-webkit-scrollbar-thumb:hover {
    background: color-mix(in srgb, var(--primary) 82%, transparent);
  }

  html {
    font-size: var(--font-size);
    font-family: var(--font-family);
  }

  h1 {
    font-size: var(--text-2xl);
    font-weight: var(--font-weight-medium);
    line-height: 1.5;
  }

  h2 {
    font-size: var(--text-xl);
    font-weight: var(--font-weight-medium);
    line-height: 1.5;
  }

  h3 {
    font-size: var(--text-lg);
    font-weight: var(--font-weight-medium);
    line-height: 1.5;
  }

  h4 {
    font-size: var(--text-base);
    font-weight: var(--font-weight-medium);
    line-height: 1.5;
  }

  label {
    font-size: var(--text-base);
    font-weight: var(--font-weight-medium);
    line-height: 1.5;
  }

  button {
    font-size: var(--text-base);
    font-weight: var(--font-weight-medium);
    line-height: 1.5;
  }

  input {
    font-size: var(--text-base);
    font-weight: var(--font-weight-normal);
    line-height: 1.5;
  }
}
```

**Step 2: Commit**

```bash
git add styles/theme.css
git commit -m "feat: update CSS for data-attribute theme system"
```

---

## Phase 2: Settings UI

### Task 5: Create ThemePicker Component

**Files:**
- Create: `app/shared/ui/ThemePicker.tsx`

**Step 1: Create ThemePicker**

```typescript
import { useTheme } from "../../providers/ThemeProvider";
import { Check } from "lucide-react";

export function ThemePicker({ className }: { className?: string }) {
  const { theme, setTheme, availableThemes } = useTheme();

  return (
    <div className={className}>
      <div className="grid grid-cols-5 gap-3">
        {availableThemes.map((t) => (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            className="relative flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all hover:scale-110"
            style={{
              backgroundColor: t.colors.dark.primary,
              borderColor: theme === t.id ? "var(--foreground)" : "transparent",
            }}
            title={t.name}
          >
            {theme === t.id && (
              <Check
                className="h-5 w-5"
                style={{ color: t.colors.dark.background }}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add app/shared/ui/ThemePicker.tsx
git commit -m "feat: create ThemePicker component"
```

---

### Task 6: Create ModePicker Component

**Files:**
- Create: `app/shared/ui/ModePicker.tsx`

**Step 1: Create ModePicker**

```typescript
import { useTheme, AVAILABLE_MODES } from "../../providers/ThemeProvider";
import { Sun, Moon, CircleArrow, Sparkles, Flower, EyeMinus } from "lucide-react";

const ICONS = {
  Sun,
  Moon,
  CircleArrow,
  Sparkles,
  Flower,
  EyeMinus,
};

export function ModePicker({ className }: { className?: string }) {
  const { mode, setMode } = useTheme();

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-2">
        {AVAILABLE_MODES.map((m) => {
          const Icon = ICONS[m.icon as keyof typeof ICONS];
          return (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                mode === m.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-muted"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{m.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add app/shared/ui/ModePicker.tsx
git commit -m "feat: create ModePicker component"
```

---

### Task 7: Add i18n Strings

**Files:**
- Modify: `app/i18n/locales/en.json`

**Step 1: Add theme-related strings**

```json
{
  "settings": {
    "theme": "Theme",
    "themeDesc": "Choose your preferred color theme",
    "mode": "Mode",
    "modeDesc": "Choose display mode",
    "clearTheme": "Reset Theme",
    "clearThemeDesc": "Reset to default theme",
    "themeCleared": "Theme preference cleared"
  },
  "themes": {
    "funkhub": "Funkhub",
    "purple": "Purple",
    "pink": "Pink",
    "blue": "Blue",
    "green": "Green",
    "red": "Red",
    "alepsych": "ALE Psych Purple",
    "ocean": "Ocean",
    "mint": "Mint",
    "rose": "Rose",
    "gold": "Gold",
    "lavender": "Lavender",
    "midnight": "Midnight",
    "coral": "Coral",
    "slate": "Slate"
  },
  "modes": {
    "light": "Light",
    "dark": "Dark",
    "auto": "Auto",
    "vibrant": "Vibrant",
    "pastel": "Pastel",
    "focus": "Focus"
  }
}
```

**Step 2: Commit**

```bash
git add app/i18n/locales/en.json
git commit -m "feat: add theme and mode i18n strings"
```

---

### Task 8: Integrate into SettingsPage

**Files:**
- Modify: `app/features/settings/SettingsPage.tsx`

**Step 1: Find existing theme toggle section and replace with ThemePicker + ModePicker**

Add imports:
```typescript
import { ThemePicker } from "../../shared/ui/ThemePicker";
import { ModePicker } from "../../shared/ui/ModePicker";
```

Find the theme toggle section and replace with:
```typescript
<div className="space-y-4">
  <div>
    <h3 className="text-lg font-medium">{t("settings.theme", "Theme")}</h3>
    <p className="text-sm text-muted-foreground">
      {t("settings.themeDesc", "Choose your preferred color theme")}
    </p>
  </div>
  <ThemePicker />
</div>

<div className="space-y-4">
  <div>
    <h3 className="text-lg font-medium">{t("settings.mode", "Mode")}</h3>
    <p className="text-sm text-muted-foreground">
      {t("settings.modeDesc", "Choose display mode")}
    </p>
  </div>
  <ModePicker />
</div>
```

**Step 2: Commit**

```bash
git add app/features/settings/SettingsPage.tsx
git commit -m "feat: integrate ThemePicker and ModePicker into settings"
```

---

## Phase 3: App-wide Adoption

### Task 9: Audit and Fix Hardcoded Colors

**Step 1: Search for hardcoded colors**

```bash
grep -r "bg-\[#\|text-\[#\|#......" app/ --include="*.tsx" | grep -v node_modules | head -50
```

**Step 2: For each hardcoded color found:**
- Replace with CSS variable equivalent
- Example: `bg-[#1A1512]` → `bg-background`

**Step 3: Commit after fixes**

```bash
git add app/
git commit -m "fix: replace hardcoded colors with theme variables"
```

---

### Task 10: Update sonner Toaster

**Files:**
- Modify: `app/shared/ui/sonner.tsx`

**Step 1: Update to use new theme**

```typescript
const { theme } = useTheme();
// theme is now theme ID, effectiveMode is handled by provider
// No changes needed if using CSS variables
```

**Step 2: Commit**

```bash
git add app/shared/ui/sonner.tsx
git commit -m "fix: update sonner toaster theme integration"
```

---

### Task 11: Update Chart Component

**Files:**
- Modify: `app/shared/ui/chart.tsx`

**Step 1: Check if chart uses hardcoded theme colors**

**Step 2: Commit**

```bash
git add app/shared/ui/chart.tsx
git commit -m "fix: update chart to use dynamic theme colors"
```

---

## Phase 4: Polish

### Task 12: Add Transitions

**Files:**
- Already added in CSS body transition

**Step 1: Commit**

```bash
git commit -m "feat: add smooth theme transition animations"
```

---

### Task 13: TypeCheck and Build

**Step 1: Run typecheck**

```bash
bun run typecheck
```

**Step 2: Run build**

```bash
bun run build
```

**Step 3: Fix any errors**

---

### Task 14: Final Verification

**Step 1: Test each theme + mode combination manually**
- Open app in browser
- Cycle through all 15 themes
- Cycle through all 6 modes
- Verify no visual brokenness

**Step 2: Commit**

```bash
git commit -m "feat: complete theme system implementation"
```
