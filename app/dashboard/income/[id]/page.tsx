import DashboardShell from "../../_components/DashboardShell";
import IncomeFormContent from "../_components/IncomeFormContent";

type IncomeEditPageProps = {
  params: Promise<{ id?: string | string[] }>;
};

export default async function IncomeEditPage({
  params,
}: IncomeEditPageProps) {
  const { id } = await params;
  const incomeId = Array.isArray(id) ? id[0] : id;

  if (!incomeId || typeof incomeId !== "string") return null;

  return (
    <DashboardShell requireAdmin>
      <IncomeFormContent incomeId={incomeId} />
    </DashboardShell>
  );
}
