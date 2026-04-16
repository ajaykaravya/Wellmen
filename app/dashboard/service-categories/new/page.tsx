"use client";

import DashboardShell from "../../_components/DashboardShell";
import ServiceCategoryFormContent from "../_components/ServiceCategoryFormContent";

export default function ServiceCategoryNewPage() {
  return (
    <DashboardShell requireAdmin>
      <ServiceCategoryFormContent />
    </DashboardShell>
  );
}
