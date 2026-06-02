import { useState } from "react";
import { Folder, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useFunkHub, useI18n } from "../../providers";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../shared/ui/dialog";

type WipeMode = "records" | "disk" | "full";

export function Settings() {
  const { t } = useI18n();
  const {
    settings,
    installedEngines,
    installedMods,
    downloads,
    updateSettings,
    browseFolder,
    setDefaultEngine,
    wipeData,
    startOnboardingTour,
  } = useFunkHub();

  const [activeTab, setActiveTab] = useState<"folders" | "data">("folders");
  const [rootInput, setRootInput] = useState(settings.dataRootDirectory);
  const [downloadsInput, setDownloadsInput] = useState(settings.downloadsDirectory);
  const [confirmStage, setConfirmStage] = useState<0 | 1 | 2>(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [wipeMode, setWipeMode] = useState<WipeMode>("records");
  const [busy, setBusy] = useState(false);

  const defaultEngineId = installedEngines.find((engine) => engine.isDefault)?.id ?? "";

  const runWipe = async () => {
    setBusy(true);
    try {
      await wipeData(wipeMode);
      toast.success(wipeMode === "records" ? "Records cleared" : wipeMode === "disk" ? "Disk data cleared" : "Full wipe complete");
      setConfirmOpen(false);
      setConfirmStage(0);
      window.location.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Wipe failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-6 lg:p-8 space-y-6">
      <h1 className="text-3xl font-bold text-foreground">{t("settings.title", "Settings")}</h1>

      <div className="flex gap-2">
        <button type="button" onClick={() => setActiveTab("folders")} className={`rounded-lg border px-3 py-2 text-sm ${activeTab === "folders" ? "border-primary/25 bg-primary/10 text-primary" : "border-border bg-card text-foreground"}`}>
          Folders
        </button>
        <button type="button" onClick={() => setActiveTab("data")} className={`rounded-lg border px-3 py-2 text-sm ${activeTab === "data" ? "border-primary/25 bg-primary/10 text-primary" : "border-border bg-card text-foreground"}`}>
          Data Management
        </button>
      </div>

      {activeTab === "folders" && (
        <div className="space-y-5">
          <section className="bg-card border border-border rounded-xl p-5 space-y-4">
            <h2 className="text-lg font-semibold text-foreground">FunkHub Root Folder</h2>
            <div className="flex gap-2">
              <input value={rootInput} onChange={(event) => setRootInput(event.target.value)} onBlur={() => void updateSettings({ dataRootDirectory: rootInput.trim() })} className="flex-1 rounded-lg border border-border bg-input-background px-3 py-2 text-sm" />
              <button type="button" onClick={async () => { const selected = await browseFolder({ title: "Choose FunkHub root folder", defaultPath: rootInput || undefined }); if (selected) { setRootInput(selected); await updateSettings({ dataRootDirectory: selected }); } }} className="rounded-lg border border-border px-3 py-2 text-sm inline-flex items-center gap-2"><Folder className="w-4 h-4" />Browse</button>
            </div>
            <p className="text-xs text-muted-foreground">This is the single source folder for managed app data.</p>
          </section>

          <section className="bg-card border border-border rounded-xl p-5 space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Downloads Folder</h2>
            <div className="flex gap-2 items-center">
              <input value={downloadsInput} onChange={(event) => setDownloadsInput(event.target.value)} onBlur={() => void updateSettings({ downloadsDirectory: downloadsInput.trim() })} className="flex-1 rounded-lg border border-border bg-input-background px-3 py-2 text-sm" />
              <button type="button" onClick={async () => { const selected = await browseFolder({ title: "Choose downloads folder", defaultPath: downloadsInput || undefined }); if (selected) { setDownloadsInput(selected); await updateSettings({ downloadsDirectory: selected }); } }} className="rounded-lg border border-border px-3 py-2 text-sm">Browse</button>
            </div>
            <p className="text-xs text-muted-foreground">Optional override for where archive files are downloaded.</p>
          </section>

          <section className="bg-card border border-border rounded-xl p-5">
            <h2 className="text-lg font-semibold text-foreground mb-2">Default Engine</h2>
            <select value={defaultEngineId} onChange={(event) => event.target.value && setDefaultEngine(event.target.value)} className="w-full rounded-lg border border-border bg-input-background px-3 py-2 text-sm">
              <option value="" disabled={installedEngines.length > 0}>{installedEngines.length > 0 ? "Select default engine" : "No installed engines"}</option>
              {installedEngines.map((engine) => <option key={engine.id} value={engine.id}>{engine.name} ({engine.version})</option>)}
            </select>
            <div className="mt-4">
              <button
                type="button"
                onClick={() => void startOnboardingTour()}
                className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-secondary"
              >
                {t("settings.replayTutorial", "Replay Tutorial")}
              </button>
            </div>
          </section>
        </div>
      )}

      {activeTab === "data" && (
        <section className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Data Management</h2>
          <p className="text-sm text-muted-foreground">Installed mods: {installedMods.length} | Installed engines: {installedEngines.length} | Download records: {downloads.length}</p>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Wipe Mode</label>
            <select value={wipeMode} onChange={(event) => setWipeMode(event.target.value as WipeMode)} className="w-full rounded-lg border border-border bg-input-background px-3 py-2 text-sm">
              <option value="records">Records only</option>
              <option value="disk">Disk only</option>
              <option value="full">Full wipe</option>
            </select>
          </div>

          <button type="button" disabled={busy} onClick={() => { setConfirmStage(1); setConfirmOpen(true); }} className="inline-flex items-center gap-2 rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-60">
            <Trash2 className="w-4 h-4" /> Run Wipe
          </button>
        </section>
      )}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirmStage === 1 ? "Confirm wipe" : "Final confirmation"}</DialogTitle>
            <DialogDescription>{confirmStage === 1 ? `Mode: ${wipeMode}. This action may delete data permanently.` : "This cannot be undone. Continue?"}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button type="button" onClick={() => { setConfirmOpen(false); setConfirmStage(0); }} className="rounded-lg border border-border px-3 py-2 text-sm">Cancel</button>
            {confirmStage === 1 ? (
              <button type="button" onClick={() => setConfirmStage(2)} className="rounded-lg bg-destructive px-3 py-2 text-sm text-destructive-foreground">Continue</button>
            ) : (
              <button type="button" onClick={() => void runWipe()} disabled={busy} className="rounded-lg bg-destructive px-3 py-2 text-sm text-destructive-foreground disabled:opacity-60">Confirm Wipe</button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
