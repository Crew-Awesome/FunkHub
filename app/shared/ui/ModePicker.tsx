import { useTheme, AVAILABLE_MODES } from "../../providers/ThemeProvider";
import { Sun, Moon, RefreshCw, Sparkles, Flower, EyeOff } from "lucide-react";

const ICONS = {
  Sun,
  Moon,
  CircleArrow: RefreshCw,
  Sparkles,
  Flower,
  EyeMinus: EyeOff,
};

const BASE_MODES = ["light", "dark", "auto"] as const;
const EFFECT_MODES = ["vibrant", "pastel", "focus"] as const;

export function ModePicker({ className }: { className?: string }) {
  const { mode, setMode } = useTheme();

  const isBaseMode = BASE_MODES.includes(mode as typeof BASE_MODES[number]);
  const currentBaseMode = isBaseMode ? mode : "dark";
  const currentEffectMode = EFFECT_MODES.includes(mode as typeof EFFECT_MODES[number]) ? mode : null;

  const handleBaseModeChange = (newMode: typeof BASE_MODES[number]) => {
    if (currentEffectMode) {
      setMode(newMode);
    } else {
      setMode(newMode);
    }
  };

  const handleEffectModeChange = (newMode: typeof EFFECT_MODES[number] | null) => {
    if (newMode === null) {
      setMode(currentBaseMode);
    } else {
      setMode(newMode);
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Base Modes: Light / Dark / Auto */}
      <div className="flex flex-wrap gap-2">
        {BASE_MODES.map((m) => {
          const modeInfo = AVAILABLE_MODES.find((am) => am.id === m);
          if (!modeInfo) return null;
          const Icon = ICONS[modeInfo.icon as keyof typeof ICONS];
          const isSelected = mode === m;

          return (
            <button
              key={m}
              onClick={() => handleBaseModeChange(m)}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-ring ${
                isSelected
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-muted"
              }`}
              title={modeInfo.name}
              aria-label={`Select ${modeInfo.name} mode`}
              aria-pressed={isSelected}
            >
              <Icon className="h-4 w-4" />
              <span>{modeInfo.name}</span>
            </button>
          );
        })}
      </div>

      {/* Divider */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground">or with effect</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Effect Modes: Vibrant / Pastel / Focus */}
      <div className="flex flex-wrap gap-2">
        {EFFECT_MODES.map((m) => {
          const modeInfo = AVAILABLE_MODES.find((am) => am.id === m);
          if (!modeInfo) return null;
          const Icon = ICONS[modeInfo.icon as keyof typeof ICONS];
          const isSelected = mode === m;

          return (
            <button
              key={m}
              onClick={() => handleEffectModeChange(m)}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-ring ${
                isSelected
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-muted opacity-60"
              }`}
              title={modeInfo.name}
              aria-label={`Select ${modeInfo.name} mode`}
              aria-pressed={isSelected}
            >
              <Icon className="h-4 w-4" />
              <span>{modeInfo.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
