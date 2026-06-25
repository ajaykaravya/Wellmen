"use client";

import DashboardShell from "../_components/DashboardShell";
import EmployeeFinancialReportContent from "./_components/EmployeeFinancialReportContent";
import { useSearchParams } from "next/navigation";

export default function EmployeeFinancialReportPage() {
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId") || "";

  return (
    <DashboardShell requireAdmin>
      <EmployeeFinancialReportContent initialUserId={userId} />
    </DashboardShell>
  );
}
