"use client";

import DashboardShell from "../../_components/DashboardShell";
import ReportingCategoryFormContent from "../_components/ReportingCategoryFormContent";

export default function ReportingCategoryNewPage() {
  return (
    <DashboardShell requireAdmin>
      <ReportingCategoryFormContent />
    </DashboardShell>
  );
}
