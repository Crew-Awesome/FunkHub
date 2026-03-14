import { Link, useLocation } from "react-router";
import { Search, Library, Download, RefreshCw, Settings as SettingsIcon, Cpu, Bell } from "lucide-react";
import { motion } from "motion/react";
import { useFunkHub } from "../providers";

const navItems = [
  { icon: Search, label: "Discover Mods", path: "/" },
  { icon: Library, label: "Library", path: "/library" },
  { icon: Download, label: "Downloads", path: "/downloads" },
  { icon: RefreshCw, label: "Updates", path: "/updates" },
  { icon: Cpu, label: "Engines", path: "/engines" },
];

export function Sidebar() {
  const location = useLocation();
  const { downloads, modUpdates } = useFunkHub();
  const activeJobs = downloads.filter((task) => ["queued", "downloading", "installing"].includes(task.status)).length;
  const failedJobs = downloads.filter((task) => task.status === "failed").length;
  const notificationCount = activeJobs + failedJobs + modUpdates.length;

  return (
    <aside className="w-[220px] bg-sidebar border-r border-sidebar-border flex flex-col h-full">
      <div className="p-6">
        <h1 className="text-2xl font-bold font-bigstage bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent">
          FunkHub
        </h1>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Link key={item.path} to={item.path}>
              <motion.div
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all cursor-pointer relative
                  ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  }
                `}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full"
                  />
                )}
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section with User Controls */}
      <div className="p-3 border-t border-sidebar-border">
        <div className="flex items-center gap-2 mb-3">
          <Link to="/settings" className="flex-1">
            <button className="w-full p-2 hover:bg-sidebar-accent rounded-lg transition-colors flex items-center justify-center">
              <SettingsIcon className="w-5 h-5 text-sidebar-foreground/70" />
            </button>
          </Link>
          <Link to="/downloads">
            <button className="p-2 hover:bg-sidebar-accent rounded-lg transition-colors relative">
              <Bell className="w-5 h-5 text-sidebar-foreground/70" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-primary text-[10px] text-white flex items-center justify-center">
                  {notificationCount > 99 ? "99+" : notificationCount}
                </span>
              )}
            </button>
          </Link>
        </div>
        <Link to="/profile">
          <div className="flex items-center gap-3 p-2 hover:bg-sidebar-accent rounded-lg transition-colors cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-semibold text-white">FH</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">Player</p>
              <p className="text-xs text-muted-foreground truncate">View Profile</p>
            </div>
          </div>
        </Link>
      </div>
    </aside>
  );
}
