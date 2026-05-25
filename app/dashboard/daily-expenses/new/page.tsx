"use client";

import DashboardShell from "../../_components/DashboardShell";
import DailyExpenseFormContent from "../_components/DailyExpenseFormContent";

export default function DailyExpenseNewPage() {
  return (
    <DashboardShell requireAdmin>
      <DailyExpenseFormContent />
    </DashboardShell>
  );
}
