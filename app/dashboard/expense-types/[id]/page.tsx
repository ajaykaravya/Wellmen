"use client";

import { useParams } from "next/navigation";
import DashboardShell from "../../_components/DashboardShell";
import ExpenseTypeFormContent from "../_components/ExpenseTypeFormContent";

export default function ExpenseTypeEditPage() {
  const params = useParams();
  const expenseTypeId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  if (!expenseTypeId || typeof expenseTypeId !== "string") return null;

  return (
    <DashboardShell requireAdmin>
      <ExpenseTypeFormContent expenseTypeId={expenseTypeId} />
    </DashboardShell>
  );
}
