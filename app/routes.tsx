import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { Discover } from "./pages/Discover";
import { Library } from "./pages/Library";
import { Downloads } from "./pages/Downloads";
import { Updates } from "./pages/Updates";
import { Engines } from "./pages/Engines";
import { Profile } from "./pages/Profile";
import { Settings } from "./pages/Settings";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Home },
      { path: "discover", Component: Discover },
      { path: "library", Component: Library },
      { path: "downloads", Component: Downloads },
      { path: "updates", Component: Updates },
      { path: "engines", Component: Engines },
      { path: "profile", Component: Profile },
      { path: "settings", Component: Settings },
    ],
  },
]);
