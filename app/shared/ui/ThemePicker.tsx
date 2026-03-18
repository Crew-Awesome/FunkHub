import { useTheme } from "../../providers/ThemeProvider";
import { Check, ChevronDown, Palette } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export function ThemePicker({ className }: { className?: string }) {
  const { theme, setTheme, availableThemes, effectiveMode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const selectedTheme = availableThemes.find((t) => t.id === theme) || availableThemes[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={className} ref={dropdownRef}>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-3 w-full px-4 py-2.5 bg-secondary rounded-lg border border-border hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <div
            className="w-5 h-5 rounded-full border border-border/50"
            style={{ backgroundColor: selectedTheme.colors[effectiveMode].primary }}
          />
          <span className="flex-1 text-left text-sm font-medium">{selectedTheme.name}</span>
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-2 py-1 bg-card border border-border rounded-lg shadow-lg max-h-80 overflow-y-auto">
            {availableThemes.map((t) => {
              const isSelected = theme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setTheme(t.id);
                    setIsOpen(false);
                  }}
                  className={`flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-muted transition-colors focus:outline-none focus:bg-muted ${
                    isSelected ? "bg-muted" : ""
                  }`}
                >
                  <div
                    className="w-5 h-5 rounded-full border border-border/50"
                    style={{ backgroundColor: t.colors[effectiveMode].primary }}
                  />
                  <span className="flex-1 text-left">{t.name}</span>
                  {isSelected && <Check className="w-4 h-4 text-primary" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
