import { Outlet } from "react-router";
import { Sidebar } from "./Sidebar";

export function Layout() {
  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background md:flex-row">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:rounded-lg focus:bg-primary focus:text-primary-foreground focus:font-medium"
      >
        Skip to main content
      </a>
      <Sidebar />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <main id="main-content" className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
