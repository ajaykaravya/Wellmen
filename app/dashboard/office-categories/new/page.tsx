"use client";

import DashboardShell from "../../_components/DashboardShell";
import OfficeCategoryFormContent from "../_components/OfficeCategoryFormContent";

export default function OfficeCategoryNewPage() {
  return (
    <DashboardShell requireAdmin>
      <OfficeCategoryFormContent />
    </DashboardShell>
  );
}
