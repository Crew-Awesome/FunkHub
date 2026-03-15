import { Search } from "lucide-react";
import { useI18n } from "../providers";

export function Topbar() {
  const { t } = useI18n();

  return (
    <header className="h-16 bg-card border-b border-border flex items-center px-6 gap-4">
      <div className="flex-1 max-w-2xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={t("topbar.searchPlaceholder", "Search mods, engines, or modpacks...")}
            className="w-full bg-input-background border border-border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>
      </div>
    </header>
  );
}
