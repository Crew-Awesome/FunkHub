import { lazy } from "react";
import { createBrowserRouter, createHashRouter, useNavigate, useRouteError } from "react-router";
import { Layout } from "./app-shell";

const Home = lazy(() => import("./features/home").then((module) => ({ default: module.Home })));
const Discover = lazy(() => import("./features/discover").then((module) => ({ default: module.Discover })));
const Downloads = lazy(() => import("./features/downloads").then((module) => ({ default: module.Downloads })));
const Engines = lazy(() => import("./features/engines").then((module) => ({ default: module.Engines })));
const Library = lazy(() => import("./features/library").then((module) => ({ default: module.Library })));
const Settings = lazy(() => import("./features/settings").then((module) => ({ default: module.Settings })));
const Stats = lazy(() => import("./features/stats").then((module) => ({ default: module.Stats })));
const Updates = lazy(() => import("./features/updates").then((module) => ({ default: module.Updates })));

function RouteErrorPage() {
  const error = useRouteError() as { status?: number; statusText?: string; message?: string } | undefined;
  const navigate = useNavigate();
  const is404 = error?.status === 404;
  return (
    <div className="flex min-h-full items-center justify-center p-8">
      <div className="text-center max-w-sm">
        <p className="text-5xl font-bold text-primary mb-4">{is404 ? "404" : "Oops"}</p>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          {is404 ? "Page not found" : "Something went wrong"}
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          {error?.message || error?.statusText || "An unexpected error occurred."}
        </p>
        <button
          onClick={() => navigate("/")}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
        >
          Go Home
        </button>
      </div>
    </div>
  );
}

const routerFactory = typeof window !== "undefined" && window.location.protocol === "file:"
  ? createHashRouter
  : createBrowserRouter;

export const router = routerFactory([
  {
    path: "/",
    Component: Layout,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, Component: Home },
      { path: "home", Component: Home },
      { path: "discover", Component: Discover },
      { path: "library", Component: Library },
      { path: "downloads", Component: Downloads },
      { path: "updates", Component: Updates },
      { path: "engines", Component: Engines },
      { path: "settings", Component: Settings },
      { path: "stats", Component: Stats },
      { path: "*", Component: Discover },
    ],
  },
]);
