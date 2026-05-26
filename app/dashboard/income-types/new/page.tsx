import DashboardShell from "../../_components/DashboardShell";
import IncomeTypeFormContent from "../_components/IncomeTypeFormContent";

export default function IncomeTypeNewPage() {
  return (
    <DashboardShell requireAdmin>
      <IncomeTypeFormContent />
    </DashboardShell>
  );
}
