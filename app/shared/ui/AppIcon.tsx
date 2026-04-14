import type { ComponentPropsWithoutRef } from "react";
import { ExternalLink, TriangleAlert, X, type LucideIcon } from "lucide-react";

export type AppIconName =
  | "warning"
  | "externalLink"
  | "socialX";

const APP_ICONS: Record<AppIconName, LucideIcon> = {
  warning: TriangleAlert,
  externalLink: ExternalLink,
  socialX: X,
};

export function getAppIcon(name: AppIconName): LucideIcon {
  return APP_ICONS[name] ?? APP_ICONS.warning;
}

type AppIconProps = ComponentPropsWithoutRef<"svg"> & {
  name: AppIconName;
};

export function AppIcon({ name, ...props }: AppIconProps) {
  const Icon = getAppIcon(name);
  return <Icon {...props} />;
}
