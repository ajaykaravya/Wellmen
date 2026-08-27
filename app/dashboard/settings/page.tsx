"use client";

import DashboardShell from "../_components/DashboardShell";
import CompanySettingsContent from "./_components/CompanySettingsContent";

export default function SettingsPage() {
  return (
    <DashboardShell requireAdmin>
      <CompanySettingsContent />
    </DashboardShell>
  );
}
