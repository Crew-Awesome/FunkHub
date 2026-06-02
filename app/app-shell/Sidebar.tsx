import { Link, useLocation } from "react-router";
import { type LucideIcon, Library, Download, Settings as SettingsIcon, Cpu } from "lucide-react";
import { motion } from "motion/react";
import { useI18n } from "../providers";

type SidebarNavItem = {
  labelKey: string;
  path: string;
  aliases?: string[];
  icon?: LucideIcon;
  platform?: "gamebanana";
};

const navItems: SidebarNavItem[] = [
  { platform: "gamebanana", labelKey: "nav.gamebanana", path: "/gamebanana", aliases: ["/discover", "/"] },
  { icon: Library, labelKey: "nav.library", path: "/library" },
  { icon: Download, labelKey: "nav.downloads", path: "/downloads" },
  { icon: Cpu, labelKey: "nav.engines", path: "/engines" },
];

function SidebarIcon({ icon: Icon, platform, isActive }: { icon?: LucideIcon; platform?: "gamebanana"; isActive: boolean }) {
  const brandTone = "#FCEF40";
  const themedBrandColor = isActive
    ? `color-mix(in oklab, ${brandTone} 72%, hsl(var(--primary)) 28%)`
    : `color-mix(in oklab, ${brandTone} 50%, hsl(var(--muted-foreground)) 50%)`;

  if (platform === "gamebanana") {
    return (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="w-5 h-5"
        style={{ color: themedBrandColor }}
        fill="currentColor"
      >
        <path d="M14.249 0v3h1.5V1.5h1.505V3h-1.505v4.5h1.5v-3h3.002V3h-1.505V0Zm6.002 4.498v1.5h1.5V4.501Zm1.5 1.5v10.503h1.5V5.998Zm0 10.503h-1.5V19.5h1.5zm-1.5 2.998h-1.505v1.5h1.5zm-1.5 1.5h-3.002v1.5h3.001zm-3.002 1.5H6.75V24h9zm-8.999 0V21h-3v1.5zm-3-1.5v-1.497H2.248v1.5zm-1.501-1.497v-2.997H9.75v-1.5H.748v4.497zm7.502-4.497h2.997v-1.5H9.751Zm2.997-1.5h1.5v-1.501h-1.5zm1.5-1.501h1.501V7.506h-1.5z" />
      </svg>
    );
  }

  if (Icon) {
    return <Icon className="w-5 h-5" />;
  }

  return null;
}

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
          const aliases = item.aliases ?? [];
          const isActive = location.pathname === item.path || aliases.includes(location.pathname);

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
                  <SidebarIcon icon={item.icon} platform={item.platform} isActive={isActive} />
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
