"use client";

import { useParams } from "next/navigation";
import DashboardShell from "../../../_components/DashboardShell";
import ProjectLedgerContent from "./_components/ProjectLedgerContent";

export default function ProjectViewPage() {
  const params = useParams();
  const projectId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  if (!projectId || typeof projectId !== "string") return null;

  return (
    <DashboardShell requireAdmin>
      <ProjectLedgerContent projectId={projectId} />
    </DashboardShell>
  );
}
