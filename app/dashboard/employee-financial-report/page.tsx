"use client";

import DashboardShell from "../_components/DashboardShell";
import EmployeeFinancialReportContent from "./_components/EmployeeFinancialReportContent";

export default function EmployeeFinancialReportPage() {
  return (
    <DashboardShell requireAdmin>
      <EmployeeFinancialReportContent />
    </DashboardShell>
  );
}
