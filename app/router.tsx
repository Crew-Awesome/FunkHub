import { createBrowserRouter, createHashRouter } from "react-router";
import { Layout } from "./app-shell";
import { Discover, Downloads, Engines, Library, Settings, Updates } from "./features";

const routerFactory = typeof window !== "undefined" && window.location.protocol === "file:"
  ? createHashRouter
  : createBrowserRouter;

export const router = routerFactory([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Discover },
      { path: "discover", Component: Discover },
      { path: "library", Component: Library },
      { path: "downloads", Component: Downloads },
      { path: "updates", Component: Updates },
      { path: "engines", Component: Engines },
      { path: "settings", Component: Settings },
    ],
  },
]);
