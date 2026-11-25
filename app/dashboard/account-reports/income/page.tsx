"use client";

import DashboardShell from "../../_components/DashboardShell";
import AccountReportContent from "../_components/AccountReportContent";

export default function IncomeReportPage() {
  return (
    <DashboardShell requireAdmin>
      <AccountReportContent kind="income" />
    </DashboardShell>
  );
}
