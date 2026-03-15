import { Suspense } from "react";
import { RouterProvider } from "react-router";
import { router } from "./router";
import { FunkHubProvider, ThemeProvider } from "./providers";

export default function App() {
  return (
    <ThemeProvider>
      <FunkHubProvider>
        <Suspense fallback={<div className="flex h-screen items-center justify-center text-muted-foreground">Loading...</div>}>
          <RouterProvider router={router} />
        </Suspense>
      </FunkHubProvider>
    </ThemeProvider>
  );
}
