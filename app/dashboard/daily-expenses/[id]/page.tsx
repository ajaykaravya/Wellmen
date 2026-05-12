"use client";

import { useParams } from "next/navigation";
import DashboardShell from "../../_components/DashboardShell";
import DailyExpenseFormContent from "../_components/DailyExpenseFormContent";

export default function DailyExpenseEditPage() {
  const params = useParams();
  const dailyExpenseId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  if (!dailyExpenseId || typeof dailyExpenseId !== "string") return null;

  return (
    <DashboardShell requireAdmin>
      <DailyExpenseFormContent dailyExpenseId={dailyExpenseId} />
    </DashboardShell>
  );
}
