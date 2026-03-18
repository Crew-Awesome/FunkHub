import { useTheme } from "../../providers";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { effectiveMode } = useTheme();

  return (
    <Sonner
      theme={effectiveMode as ToasterProps["theme"]}
      className="toaster group"
      position="top-right"
      richColors
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
