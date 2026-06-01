"use client";

import { useParams } from "next/navigation";
import DashboardShell from "../../_components/DashboardShell";
import IncomeTypeFormContent from "../_components/IncomeTypeFormContent";

export default function IncomeTypeEditPage() {
  const params = useParams();
  const incomeTypeId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  if (!incomeTypeId || typeof incomeTypeId !== "string") return null;

  return (
    <DashboardShell requireAdmin>
      <IncomeTypeFormContent incomeTypeId={incomeTypeId} />
    </DashboardShell>
  );
}
