import { Link, useLocation } from "react-router";
import { Search, Library, Download, RefreshCw, Settings as SettingsIcon, Cpu, House, BarChart2 } from "lucide-react";
import { motion } from "motion/react";
import { useI18n } from "../providers";

const navItems = [
  { icon: House, labelKey: "nav.home", path: "/home" },
  { icon: Search, labelKey: "nav.discover", path: "/discover" },
  { icon: Library, labelKey: "nav.library", path: "/library" },
  { icon: Download, labelKey: "nav.downloads", path: "/downloads" },
  { icon: RefreshCw, labelKey: "nav.updates", path: "/updates" },
  { icon: Cpu, labelKey: "nav.engines", path: "/engines" },
  { icon: BarChart2, labelKey: "nav.stats", path: "/stats" },
];

export function Sidebar() {
  const location = useLocation();
  const { t } = useI18n();

  return (
    <aside className="w-full md:w-[220px] bg-sidebar border-b md:border-b-0 md:border-r border-sidebar-border flex md:flex-col h-auto md:h-full">
      <div className="hidden border-b border-sidebar-border p-4 md:block md:border-b-0 md:p-6">
        <Link to="/" className="inline-block group">
          <motion.h1
            className="font-bigstage text-2xl font-bold text-primary select-none"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
          >
            {t("app.name", "FunkHub")}
          </motion.h1>
        </Link>
      </div>

      <nav className="flex-1 px-2 py-2 md:px-3 md:py-0 space-y-0 md:space-y-1 flex md:block overflow-x-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Link key={item.path} to={item.path} className="shrink-0 md:block">
              <motion.div
                className={`
                  flex items-center gap-2 md:gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer relative border min-h-11
                  ${
                    isActive
                      ? "bg-primary/10 text-primary border-primary/20"
                      : "text-sidebar-foreground/70 border-transparent hover:bg-sidebar-accent hover:text-sidebar-foreground hover:border-sidebar-border"
                  }
                `}
                whileTap={{ scale: 0.96 }}
                transition={{ type: "spring", stiffness: 500, damping: 20 }}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active-bar"
                    className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full hidden md:block"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                <motion.div
                  whileHover={{ rotate: isActive ? 0 : [0, -8, 8, -4, 0] }}
                  transition={{ duration: 0.4 }}
                >
                  <Icon className="w-5 h-5" />
                </motion.div>
                <span className="text-sm font-medium whitespace-nowrap">{t(item.labelKey)}</span>
              </motion.div>
            </Link>
          );
        })}
      </nav>

      <div className="p-2 md:p-3 border-l md:border-l-0 border-sidebar-border md:border-t">
        <Link
          to="/settings"
          className="px-3 py-2 hover:bg-sidebar-accent rounded-lg transition-colors flex items-center justify-center gap-2 text-sidebar-foreground/80 min-h-11"
        >
          <motion.div whileHover={{ rotate: 90 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
            <SettingsIcon className="w-5 h-5" />
          </motion.div>
          <span className="text-sm font-medium whitespace-nowrap">{t("nav.settings")}</span>
        </Link>
      </div>
    </aside>
  );
}
