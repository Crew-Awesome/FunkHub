import { Suspense, useEffect } from "react";
import { RouterProvider } from "react-router";
import { MotionConfig } from "motion/react";
import { router } from "./router";
import { FunkHubProvider, I18nProvider, ThemeProvider, useI18n } from "./providers";
import { Toaster } from "./shared/ui/sonner";

function AppRouter() {
  const { t } = useI18n();

  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-muted-foreground">{t("app.loading")}</div>}>
      <RouterProvider router={router} />
    </Suspense>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <MotionConfig reducedMotion="user">
        <FunkHubProvider>
          <I18nProvider>
            <AppRouter />
            <Toaster />
          </I18nProvider>
        </FunkHubProvider>
      </MotionConfig>
    </ThemeProvider>
  );
}
