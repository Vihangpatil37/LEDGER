import * as React from "react";
import { getSettings } from "@/lib/server/settings";
import { CustomerNewForm } from "./CustomerNewForm";

export default async function NewCustomerPage() {
  const settings = await getSettings();
  const defaultStep = settings.defaultAlertStep || "500.00";

  return <CustomerNewForm defaultAlertStep={defaultStep} />;
}
