import { Outlet } from "react-router";
import { Sidebar } from "./Sidebar";

export function Layout() {
  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background md:flex-row">
<Sidebar />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
