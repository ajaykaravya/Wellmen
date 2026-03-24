"use client";

import { useParams } from "next/navigation";
import DashboardShell from "../../_components/DashboardShell";
import ReportFormContent from "../_components/ReportFormContent";

export default function ReportEditPage() {
  const params = useParams();
  const reportId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  if (!reportId || typeof reportId !== "string") return null;

  return (
    <DashboardShell>
      <ReportFormContent reportId={reportId} />
    </DashboardShell>
  );
}
