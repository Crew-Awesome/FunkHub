import { Link, useLocation } from "react-router";
import { Search, Library, Download, RefreshCw, Settings as SettingsIcon, Cpu } from "lucide-react";
import { useI18n } from "../providers";

const navItems = [
  { icon: Search, labelKey: "nav.discover", path: "/" },
  { icon: Library, labelKey: "nav.library", path: "/library" },
  { icon: Download, labelKey: "nav.downloads", path: "/downloads" },
  { icon: RefreshCw, labelKey: "nav.updates", path: "/updates" },
  { icon: Cpu, labelKey: "nav.engines", path: "/engines" },
];

export function Sidebar() {
  const location = useLocation();
  const { t } = useI18n();

  return (
    <aside className="w-full md:w-[220px] bg-sidebar border-b md:border-b-0 md:border-r border-sidebar-border flex md:flex-col h-auto md:h-full">
      <div className="hidden border-b border-sidebar-border p-4 md:block md:border-b-0 md:p-6">
        <Link to="/" className="inline-block">
          <h1 className="font-bigstage text-2xl font-bold text-primary">
            FunkHub
          </h1>
        </Link>
      </div>

      <nav className="flex-1 px-2 py-2 md:px-3 md:py-0 space-y-0 md:space-y-1 flex md:block overflow-x-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Link key={item.path} to={item.path} className="shrink-0 md:block">
              <div
                className={`
                  flex items-center gap-2 md:gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer relative border min-h-11
                  ${
                    isActive
                      ? "bg-primary/10 text-primary border-primary/20"
                      : "text-sidebar-foreground/70 border-transparent hover:bg-sidebar-accent hover:text-sidebar-foreground hover:border-sidebar-border"
                  }
                `}
              >
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full hidden md:block" />
                )}
                <Icon className="w-5 h-5" />
                 <span className="text-sm font-medium whitespace-nowrap">{t(item.labelKey)}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-2 md:p-3 border-l md:border-l-0 border-sidebar-border md:border-t">
        <Link
          to="/settings"
          className="px-3 py-2 hover:bg-sidebar-accent rounded-lg transition-colors flex items-center justify-center gap-2 text-sidebar-foreground/80 min-h-11"
        >
          <SettingsIcon className="w-5 h-5" />
          <span className="text-sm font-medium whitespace-nowrap">{t("nav.settings")}</span>
        </Link>
      </div>
    </aside>
  );
}
