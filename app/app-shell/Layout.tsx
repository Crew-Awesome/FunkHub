import { Outlet, useLocation, useNavigate } from "react-router";
import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "./Sidebar";
import { useFunkHub } from "../providers";

export function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { settings, updateSettings, onboardingTourNonce } = useFunkHub();
  const [tourOpen, setTourOpen] = useState(!settings.firstRunCompleted);
  const [tourStep, setTourStep] = useState(0);
  const steps = useMemo(() => ([
    { route: "/discover", text: "Discover: browse/search/categories" },
    { route: "/library", text: "Library: launch and edit mods" },
    { route: "/engines", text: "Engines: install/manage engines" },
    { route: "/settings", text: "Settings: replay this tutorial anytime" },
  ]), []);

  useEffect(() => {
    if (onboardingTourNonce > 0) {
      setTourStep(0);
      setTourOpen(true);
      navigate(steps[0].route);
    }
  }, [onboardingTourNonce]);

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background md:flex-row">
      <Sidebar />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
      {tourOpen && (
        <div className="fixed inset-0 z-50 bg-black/55 p-4">
          <div className="mx-auto mt-[12vh] max-w-md rounded-xl border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">{steps[tourStep].text}</p>
            <div className="mt-3 flex justify-between">
              <button className="text-sm underline" onClick={async () => { setTourOpen(false); await updateSettings({ firstRunCompleted: true, onboardingTourSkippedAt: Date.now() }); }}>Skip</button>
              <div className="flex gap-2">
                <button className="px-3 py-2 rounded-lg bg-secondary text-sm" onClick={() => setTourOpen(false)}>Close</button>
                <button className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm" onClick={async () => { const next = Math.min(tourStep + 1, steps.length - 1); setTourStep(next); navigate(steps[next].route); if (next === steps.length - 1 && location.pathname === steps[next].route) { await updateSettings({ firstRunCompleted: true, onboardingTourCompleted: true }); } }}>Next</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
