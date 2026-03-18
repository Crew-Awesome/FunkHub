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

export function ModePicker({ className }: { className?: string }) {
  const { mode, setMode } = useTheme();

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-2">
        {AVAILABLE_MODES.map((m) => {
          const Icon = ICONS[m.icon as keyof typeof ICONS];
          const isSelected = mode === m.id;
          
          return (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-ring ${
                isSelected
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-muted"
              }`}
              title={m.name}
              aria-label={`Select ${m.name} mode`}
              aria-pressed={isSelected}
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
