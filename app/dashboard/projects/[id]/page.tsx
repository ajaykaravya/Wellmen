"use client";

import { useParams } from "next/navigation";
import DashboardShell from "../../_components/DashboardShell";
import ProjectFormContent from "../_components/ProjectFormContent";

export default function ProjectEditPage() {
  const params = useParams();
  const projectId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  if (!projectId || typeof projectId !== "string") return null;

  return (
    <DashboardShell requireAdmin>
      <ProjectFormContent projectId={projectId} />
    </DashboardShell>
  );
}
