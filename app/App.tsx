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

// 🎵 Easter egg for curious devs
if (typeof window !== "undefined") {
  // eslint-disable-next-line no-console
  console.log(
    "%c🎵 FunkHub\n%cYo, you found the console. Impressive.\nWanna help build the best FNF mod manager? Check us out on GitHub!",
    "font-size: 20px; font-weight: bold; color: #E8743B;",
    "font-size: 13px; color: #A89A8F; line-height: 1.6;",
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
