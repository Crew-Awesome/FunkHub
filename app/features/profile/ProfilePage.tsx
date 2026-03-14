import { motion } from "motion/react";
import { UserCircle2, Wrench, Clock3 } from "lucide-react";

export function Profile() {
  return (
    <div className="p-8 h-full flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl bg-card border border-border rounded-2xl p-8 text-center"
      >
        <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-5">
          <UserCircle2 className="w-10 h-10 text-primary" />
        </div>

        <h1 className="text-2xl font-bold text-foreground">Profile Coming Soon</h1>
        <p className="mt-3 text-muted-foreground">
          We are still building account features. This section will include account linking,
          cloud sync, preferences, and diagnostics export.
        </p>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
          <div className="rounded-lg border border-border p-3">
            <Wrench className="w-4 h-4 text-primary mb-2" />
            <p className="text-sm font-medium text-foreground">Account Linking</p>
            <p className="text-xs text-muted-foreground mt-1">GameBanana and itch.io integration</p>
          </div>
          <div className="rounded-lg border border-border p-3">
            <Clock3 className="w-4 h-4 text-primary mb-2" />
            <p className="text-sm font-medium text-foreground">Activity History</p>
            <p className="text-xs text-muted-foreground mt-1">Install, update, and launch timeline</p>
          </div>
          <div className="rounded-lg border border-border p-3">
            <Wrench className="w-4 h-4 text-primary mb-2" />
            <p className="text-sm font-medium text-foreground">Diagnostics</p>
            <p className="text-xs text-muted-foreground mt-1">One-click issue report package</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
