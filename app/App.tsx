import { RouterProvider } from "react-router";
import { router } from "./router";
import { FunkHubProvider, ThemeProvider } from "./providers";

export default function App() {
  return (
    <ThemeProvider>
      <FunkHubProvider>
        <RouterProvider router={router} />
      </FunkHubProvider>
    </ThemeProvider>
  );
}
