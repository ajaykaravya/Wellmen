"use client";

import DashboardShell from "../../_components/DashboardShell";
import ProjectFormContent from "../_components/ProjectFormContent";

export default function ProjectNewPage() {
  return (
    <DashboardShell requireAdmin>
      <ProjectFormContent />
    </DashboardShell>
  );
}
