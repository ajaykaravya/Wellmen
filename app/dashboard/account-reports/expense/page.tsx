"use client";

import DashboardShell from "../../_components/DashboardShell";
import AccountReportContent from "../_components/AccountReportContent";

export default function ExpenseReportPage() {
  return (
    <DashboardShell requireAdmin>
      <AccountReportContent kind="expense" />
    </DashboardShell>
  );
}
