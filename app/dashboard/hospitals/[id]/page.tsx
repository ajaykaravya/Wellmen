"use client";

import { useParams } from "next/navigation";
import DashboardShell from "../../_components/DashboardShell";
import ProjectFormContent from "../../projects/_components/ProjectFormContent";

export default function HospitalEditPage() {
  const params = useParams();
  const hospitalId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  if (!hospitalId || typeof hospitalId !== "string") return null;

  return (
    <DashboardShell requireAdmin>
      <ProjectFormContent projectId={hospitalId} entityType="hospital" />
    </DashboardShell>
  );
}
