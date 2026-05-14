"use client";

import DashboardShell from "../../_components/DashboardShell";
import { useSearchParams } from "next/navigation";
import DailyExpenseFormContent from "../_components/DailyExpenseFormContent";

export default function DailyExpenseNewPage() {
  const searchParams = useSearchParams();
  const initialTransactionType =
    searchParams.get("type")?.toUpperCase() === "EXPENSE"
      ? "EXPENSE"
      : "INCOME";

  return (
    <DashboardShell requireAdmin>
      <DailyExpenseFormContent
        initialTransactionType={initialTransactionType}
      />
    </DashboardShell>
  );
}
