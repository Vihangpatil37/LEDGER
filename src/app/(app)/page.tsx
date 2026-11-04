import * as React from "react";
import { getDashboard } from "@/lib/server/dashboard";
import { getSettings } from "@/lib/server/settings";
import { DashboardView } from "@/components/screens/DashboardView";

export default async function DashboardPage() {
  const [data, settings] = await Promise.all([
    getDashboard(),
    getSettings().catch(() => null),
  ]);

  return (
    <DashboardView
      data={data}
      reminderTemplate={settings?.reminderTemplate}
      shopName={settings?.shopName}
    />
  );
}
