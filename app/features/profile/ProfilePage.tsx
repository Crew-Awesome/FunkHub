import { motion } from "motion/react";
import { UserCircle2 } from "lucide-react";

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
          We are still building account features. This section will include account linking
          and creator-focused profile tools.
        </p>
      </motion.div>
    </div>
  );
}
