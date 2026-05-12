"use client";

import DashboardShell from "../../_components/DashboardShell";
import ExpenseTypeFormContent from "../_components/ExpenseTypeFormContent";

export default function ExpenseTypeNewPage() {
  return (
    <DashboardShell requireAdmin>
      <ExpenseTypeFormContent />
    </DashboardShell>
  );
}
