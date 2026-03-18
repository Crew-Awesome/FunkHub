# Theme System Design

**Date:** 2026-03-17  
**Status:** Draft  
**Author:** Agent  
**Reviewer:** TBD

---

## Overview

Replace the current binary light/dark theme system with a comprehensive multi-theme architecture supporting:
- **15 color themes** (funkhub orange + purple + pink + blue + green + red + 9 new)
- **6 modes** (light + dark + auto + vibrant + pastel + focus/dim)
- Each color theme works with every mode
- Fully extensible system — adding themes/modes = data entry only

---

## Goals

1. Support 15 color hues with light/dark variants
2. Support 6 modes: Light, Dark, Auto (system), Vibrant, Pastel, Focus/Dim
3. All themes + modes combine seamlessly
4. Adding new themes requires only data entry, not code changes
5. Persist user's preferences across sessions
6. Every page in the app uses theme variables (no hardcoded colors)
7. Maintain backward compatibility with existing UI

---

## Architecture

### Theme Data Structure

```typescript
type BaseMode = "light" | "dark";
type ThemeMode = BaseMode | "auto" | "vibrant" | "pastel" | "focus";

interface ThemeColors {
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

interface ThemeDefinition {
  id: string;
  name: string;
  hue: string; // CSS hue value for mode adjustments
  colors: {
    light: ThemeColors;
    dark: ThemeColors;
  };
}
```

### Theme Registry

All 15 themes in `app/services/funkhub/themes.ts`:

| ID | Name | Primary Color |
|----|------|---------------|
| funkhub | Funkhub | #E8743B (orange) |
| purple | Purple | #A855F7 |
| pink | Pink | #EC4899 |
| blue | Blue | #3B82F6 |
| green | Green | #22C55E |
| red | Red | #EF4444 |
| alepsych | ALE Psych Purple | #7C3AED |
| ocean | Ocean | #14B8A6 |
| mint | Mint | #10B981 |
| rose | Rose | #F43F5E |
| gold | Gold | #F59E0B |
| lavender | Lavender | #A78BFA |
| midnight | Midnight | #1E3A5F |
| coral | Coral | #FF7F50 |
| slate | Slate | #64748B |

### Mode System

```typescript
interface ThemeContextType {
  theme: string;           // theme ID
  mode: ThemeMode;         // light, dark, auto, vibrant, pastel, focus
  effectiveMode: BaseMode; // resolved mode after considering "auto"
  themeHue: string;        // hue value for mode adjustments
  
  setTheme: (theme: string) => void;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
  cycleMode: () => void;
  
  availableThemes: ThemeDefinition[];
  availableModes: { id: ThemeMode; name: string; icon: string }[];
}
```

**Mode Behaviors:**
- **light** — Light background, dark text
- **dark** — Dark background, light text
- **auto** — Follows `prefers-color-scheme` system preference, updates on change
- **vibrant** — More saturated colors, applies to light or dark base
- **pastel** — Muted desaturated colors, applies to light or dark base
- **focus/dim** — Very muted, minimal contrast, easier on eyes

### CSS Custom Properties

Use data attributes on `:root`:

```css
:root {
  /* Base values */
  --background: #1A1512;
  --foreground: #F5EDE6;
  /* ... all semantic variables ... */
}

/* Theme + Mode combinations via data attributes */
:root[data-theme="funkhub"][data-mode="dark"] { --primary: #E8743B; --background: #1A1512; ... }
:root[data-theme="funkhub"][data-mode="light"] { --primary: #E8743B; --background: #FAF8F5; ... }
:root[data-theme="alepsych"][data-mode="dark"] { --primary: #7C3AED; --background: #1A1528; ... }
:root[data-theme="alepsych"][data-mode="light"] { --primary: #7C3AED; --background: #FAF8FF; ... }

/* Mode modifiers */
:root[data-mode="vibrant"] { --primary: color-mix(in srgb, var(--primary) 120%, white); }
:root[data-mode="pastel"] { --primary: color-mix(in srgb, var(--primary) 60%, white); --saturation: 40%; }
:root[data-mode="focus"] { --primary: color-mix(in srgb, var(--primary) 40%, gray); --muted: color-mix(in srgb, var(--muted) 50%, var(--background)); }
```

### Settings UI

**Theme Picker Section:**
- Grid of color swatches (5 columns x 3 rows for 15 themes)
- Each swatch shows primary color as circle
- Checkmark overlay on selected
- Theme name tooltip on hover

**Mode Picker Section:**
- Row of mode buttons with icons
- Modes: Light (sun), Dark (moon), Auto (circle-arrow), Vibrant (sparkles), Pastel (flower), Focus (eye-minus)
- Active mode highlighted

**Preview:**
- Small card preview showing current theme + mode combination

### Storage

localStorage keys:
- `funkhub-theme` — theme ID
- `funkhub-mode` — mode string

---

## Color Palettes (All 15 Themes)

### Dark Mode Base Colors

| Theme | Primary | Background | Foreground |
|-------|---------|------------|------------|
| Funkhub | #E8743B | #1A1512 | #F5EDE6 |
| Purple | #A855F7 | #1A1520 | #F0E6FF |
| Pink | #EC4899 | #1F1520 | #FFF0F5 |
| Blue | #3B82F6 | #151F2A | #F0F5FF |
| Green | #22C55E | #152A1A | #F0FFF4 |
| Red | #EF4444 | #2A1515 | #FFF5F5 |
| ALE Psych | #7C3AED | #1A1528 | #F0E6FF |
| Ocean | #14B8A6 | #152A28 | #F0FFFA |
| Mint | #10B981 | #152A20 | #F0FFF4 |
| Rose | #F43F5E | #281520 | #FFF0F3 |
| Gold | #F59E0B | #28200A | #FFF8F0 |
| Lavender | #A78BFA | #1E1A28 | #F5F0FF |
| Midnight | #3B82F6 | #0F1A2A | #E6F0FF |
| Coral | #FF7F50 | #2A1A15 | #FFF5F0 |
| Slate | #64748B | #1A1E24 | #F0F2F5 |

### Light Mode Base Colors

| Theme | Primary | Background | Foreground |
|-------|---------|------------|------------|
| Funkhub | #E8743B | #FAF8F5 | #2D2520 |
| Purple | #A855F7 | #FAF6FF | #2D2020 |
| Pink | #EC4899 | #FFF6FA | #2D2025 |
| Blue | #3B82F6 | #F0F6FF | #1A202D |
| Green | #22C55E | #F0FFF4 | #1A2D20 |
| Red | #EF4444 | #FFF5F5 | #2D1A1A |
| ALE Psych | #7C3AED | #FAF8FF | #252028 |
| Ocean | #14B8A6 | #F0FFFA | #1A2825 |
| Mint | #10B981 | #F0FFF4 | #1A2820 |
| Rose | #F43F5E | #FFF0F3 | #2D1A20 |
| Gold | #F59E0B | #FFFBF0 | #2D2618 |
| Lavender | #A78BFA | #F8F5FF | #252028 |
| Midnight | #3B82F6 | #F0F5FF | #1A202D |
| Coral | #FF7F50 | #FFF5F0 | #2D2018 |
| Slate | #64748B | #F5F7FA | #1E2428 |

---

## Components

### ThemePicker Component

```typescript
interface ThemePickerProps {
  className?: string;
}
```

- Grid of 15 color swatches (clickable)
- Hover state shows theme name
- Selected state shows checkmark
- Uses CSS grid responsive layout

### ModePicker Component

```typescript
interface ModePickerProps {
  className?: string;
}
```

- Horizontal row of 6 mode buttons
- Icons: Sun (light), Moon (dark), Circle-Arrow (auto), Sparkles (vibrant), Flower (pastel), Eye (focus)
- Tooltip shows mode name
- Active state highlighted

### useTheme Hook

```typescript
const { 
  theme,           // "funkhub" | "purple" | ... | "slate"
  mode,            // "light" | "dark" | "auto" | "vibrant" | "pastel" | "focus"
  effectiveMode,  // resolved mode after auto-detect
  themeHue,        // hue value for gradient adjustments
  
  setTheme,        // (id: string) => void
  setMode,         // (mode: ThemeMode) => void
  toggleMode,      // () => void
  cycleMode,       // () => void (cycles through modes)
  
  themes,          // ThemeDefinition[]
  modes,           // { id, name, icon }[]
} = useTheme();
```

---

## Data Flow

```
User changes theme → setTheme(id)
                    → ThemeProvider updates state
                    → useEffect applies data-theme="id" to :root

User changes mode → setMode(mode)
                  → if mode === "auto", detect system preference
                  → apply data-mode="effectiveMode" to :root
                  → apply mode modifier classes

System preference changes → MediaQueryListener fires
                          → if mode === "auto", recalculate effectiveMode
                          → update :root attributes
```

---

## Implementation Checklist

### Phase 1: Foundation
- [ ] Create `app/services/funkhub/themes.ts` with all 15 themes
- [ ] Create mode definitions in same file
- [ ] Rewrite `ThemeProvider` for new architecture
- [ ] Update CSS in `styles/theme.css` with data-attribute rules

### Phase 2: Settings UI
- [ ] Add ThemePicker component
- [ ] Add ModePicker component  
- [ ] Integrate into SettingsPage
- [ ] Add i18n strings

### Phase 3: App-wide Adoption
- [ ] Audit all pages for hardcoded colors
- [ ] Replace with CSS variable references
- [ ] Verify all components use theme variables

### Phase 4: Polish
- [ ] Add transitions/animations for theme changes
- [ ] Verify contrast ratios
- [ ] Test on all theme + mode combinations

---

## File Changes Summary

| File | Change |
|------|--------|
| `styles/theme.css` | Add 15 themes × 2 modes = 30 CSS rules + mode modifiers |
| `app/services/funkhub/themes.ts` | NEW: Theme registry + mode definitions + types |
| `app/providers/ThemeProvider.tsx` | Rewrite with extended theme/mode support |
| `app/features/settings/SettingsPage.tsx` | Add theme picker + mode picker UI |
| `app/shared/ui/ThemePicker.tsx` | NEW: Theme swatch grid component |
| `app/shared/ui/ModePicker.tsx` | NEW: Mode button row component |
| `app/i18n/locales/en.json` | Add theme/mode strings |
| `app/shared/ui/sonner.tsx` | Update to use new theme context |
| `app/shared/ui/chart.tsx` | Update to use theme hue |

---

## Acceptance Criteria

1. [ ] User can select from 15 color themes
2. [ ] User can select from 6 modes (light, dark, auto, vibrant, pastel, focus)
3. [ ] All theme + mode combinations work correctly
4. [ ] Theme and mode preferences persist after app restart
5. [ ] "Auto" mode follows system preference and updates in real-time
6. [ ] Adding a new theme requires only data entry in themes.ts
7. [ ] All UI elements across ALL pages use theme variables
8. [ ] Settings UI clearly shows current theme + mode selection
9. [ ] Theme/mode changes apply instantly with smooth transition
10. [ ] No hardcoded colors anywhere in the app
