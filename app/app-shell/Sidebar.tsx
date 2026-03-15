import { Link, useLocation } from "react-router";
import { Search, Library, Download, RefreshCw, Settings as SettingsIcon, Cpu } from "lucide-react";

const navItems = [
  { icon: Search, label: "Discover Mods", path: "/" },
  { icon: Library, label: "Library", path: "/library" },
  { icon: Download, label: "Downloads", path: "/downloads" },
  { icon: RefreshCw, label: "Updates", path: "/updates" },
  { icon: Cpu, label: "Engines", path: "/engines" },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-[220px] bg-sidebar border-r border-sidebar-border flex flex-col h-full">
      <div className="p-6">
        <Link to="/discover" className="inline-block">
          <h1 className="text-2xl font-bold font-bigstage bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent">
            FunkHub
          </h1>
        </Link>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Link key={item.path} to={item.path}>
              <div
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer relative border
                  ${
                    isActive
                      ? "bg-primary/10 text-primary border-primary/20"
                      : "text-sidebar-foreground/70 border-transparent hover:bg-sidebar-accent hover:text-sidebar-foreground hover:border-sidebar-border"
                  }
                `}
              >
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full" />
                )}
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <Link to="/settings" className="inline-flex">
          <button className="px-3 py-2 hover:bg-sidebar-accent rounded-lg transition-colors flex items-center justify-center gap-2 text-sidebar-foreground/80">
            <SettingsIcon className="w-5 h-5" />
            <span className="text-sm font-medium">Settings</span>
          </button>
        </Link>
      </div>
    </aside>
  );
}
