import { Suspense } from "react";
import { RouterProvider } from "react-router";
import { router } from "./router";
import { FunkHubProvider, I18nProvider, ThemeProvider, useI18n } from "./providers";

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
      <FunkHubProvider>
        <I18nProvider>
          <AppRouter />
        </I18nProvider>
      </FunkHubProvider>
    </ThemeProvider>
  );
}
