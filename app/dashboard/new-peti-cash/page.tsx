"use client";

import DashboardShell from "../_components/DashboardShell";
import NewPetiCashContent from "./_components/NewPetiCashContent";

export default function NewPetiCashPage() {
  return (
    <DashboardShell requireAdmin>
      <NewPetiCashContent />
    </DashboardShell>
  );
}
