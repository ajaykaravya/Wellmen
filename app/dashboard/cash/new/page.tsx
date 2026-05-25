"use client";

import DashboardShell from "../../_components/DashboardShell";
import CashInFormContent from "../_components/CashInFormContent";

export default function CashInNewPage() {
  return (
    <DashboardShell requireAdmin>
      <CashInFormContent />
    </DashboardShell>
  );
}
