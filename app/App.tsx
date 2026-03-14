import { RouterProvider } from "react-router";
import { router } from "./router";
import { ThemeProvider } from "./providers";

export default function App() {
  return (
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}
