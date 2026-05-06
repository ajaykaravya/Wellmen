"use client";

import DashboardShell from "../../_components/DashboardShell";
import ProjectFormContent from "../../projects/_components/ProjectFormContent";

export default function HospitalNewPage() {
  return (
    <DashboardShell requireAdmin>
      <ProjectFormContent entityType="hospital" />
    </DashboardShell>
  );
}
