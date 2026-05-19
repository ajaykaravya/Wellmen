import DashboardShell from "../../_components/DashboardShell";
import ProjectFormContent from "../_components/ProjectFormContent";

type ProjectNewPageProps = {
  searchParams?: Promise<{
    source?: string;
  }>;
};

export default async function ProjectNewPage({
  searchParams,
}: ProjectNewPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const isHospitalFlow = resolvedSearchParams?.source === "hospital";

  return (
    <DashboardShell requireAdmin>
      <ProjectFormContent
        entityType={isHospitalFlow ? "hospital" : "project"}
      />
    </DashboardShell>
  );
}
