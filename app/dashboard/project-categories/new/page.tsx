"use client";

import DashboardShell from "../../_components/DashboardShell";
import CategoryFormContent from "../_components/CategoryFormContent";

export default function CategoryNewPage() {
  return (
    <DashboardShell requireAdmin>
      <CategoryFormContent />
    </DashboardShell>
  );
}
