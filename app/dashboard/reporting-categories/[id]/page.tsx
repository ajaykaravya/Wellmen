"use client";

import { useParams } from "next/navigation";
import DashboardShell from "../../_components/DashboardShell";
import ReportingCategoryFormContent from "../_components/ReportingCategoryFormContent";

export default function ReportingCategoryEditPage() {
  const params = useParams();
  const categoryId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  if (!categoryId || typeof categoryId !== "string") return null;

  return (
    <DashboardShell requireAdmin>
      <ReportingCategoryFormContent categoryId={categoryId} />
    </DashboardShell>
  );
}
