import { createBrowserRouter } from "react-router";
import { Layout } from "./app-shell";
import { Discover, Downloads, Engines, Home, Library, Profile, Settings, Updates } from "./features";

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
