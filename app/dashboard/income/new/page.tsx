import DashboardShell from "../../_components/DashboardShell";
import IncomeFormContent from "../_components/IncomeFormContent";

export default function IncomeNewPage() {
  return (
    <DashboardShell requireAdmin>
      <IncomeFormContent />
    </DashboardShell>
  );
}
