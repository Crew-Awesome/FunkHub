import { useTheme } from "../../providers/ThemeProvider";
import { Check } from "lucide-react";

export function ThemePicker({ className }: { className?: string }) {
  const { theme, setTheme, availableThemes, effectiveMode } = useTheme();

  return (
    <div className={className}>
      <div className="grid grid-cols-5 gap-3">
        {availableThemes.map((t) => {
          const isSelected = theme === t.id;
          const primaryColor = t.colors[effectiveMode].primary;
          
          return (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className="relative flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring"
              style={{
                backgroundColor: primaryColor,
                borderColor: isSelected ? "var(--foreground)" : "transparent",
              }}
              title={t.name}
              aria-label={`Select ${t.name} theme`}
              aria-pressed={isSelected}
            >
              {isSelected && (
                <Check
                  className="h-5 w-5"
                  style={{ color: t.colors[effectiveMode].background }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
