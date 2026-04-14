import { Suspense, type ReactNode } from "react";
import { RouterProvider } from "react-router";
import { MotionConfig } from "motion/react";
import { router } from "./router";
import { FunkHubProvider, I18nProvider, ThemeProvider, useFunkHub, useI18n } from "./providers";
import { Toaster } from "./shared/ui/sonner";

function AppRouter() {
  const { t } = useI18n();

  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-muted-foreground">{t("app.loading")}</div>}>
      <RouterProvider router={router} />
    </Suspense>
  );
}

function MotionProvider({ children }: { children: ReactNode }) {
  const { settings } = useFunkHub();

  return (
    <MotionConfig reducedMotion={settings.showAnimations ? "user" : "always"}>
      {children}
    </MotionConfig>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <FunkHubProvider>
        <MotionProvider>
          <I18nProvider>
            <AppRouter />
            <Toaster />
          </I18nProvider>
        </MotionProvider>
      </FunkHubProvider>
    </ThemeProvider>
  );
}
