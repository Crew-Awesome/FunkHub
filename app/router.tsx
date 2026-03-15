import { lazy } from "react";
import { createBrowserRouter, createHashRouter } from "react-router";
import { Layout } from "./app-shell";

const Discover = lazy(() => import("./features/discover").then((module) => ({ default: module.Discover })));
const Downloads = lazy(() => import("./features/downloads").then((module) => ({ default: module.Downloads })));
const Engines = lazy(() => import("./features/engines").then((module) => ({ default: module.Engines })));
const Library = lazy(() => import("./features/library").then((module) => ({ default: module.Library })));
const Settings = lazy(() => import("./features/settings").then((module) => ({ default: module.Settings })));
const Updates = lazy(() => import("./features/updates").then((module) => ({ default: module.Updates })));

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
