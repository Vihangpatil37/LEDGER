import * as React from "react";
import { getSettings } from "@/lib/server/settings";
import { SettingsView } from "@/components/screens/SettingsView";

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <React.Suspense
      fallback={
        <div className="w-full max-w-lg flex flex-col gap-4">
          <div className="h-8 w-40 bg-[var(--rule)]/40 rounded-[var(--radius-chip)]" />
          <div className="h-4 w-64 bg-[var(--rule)]/20 rounded-[var(--radius-chip)]" />
          <div className="h-48 bg-[var(--sheet)] border border-[var(--rule)]" />
        </div>
      }
    >
      <SettingsView settings={settings} />
    </React.Suspense>
  );
}
