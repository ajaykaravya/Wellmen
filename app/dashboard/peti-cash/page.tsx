import DashboardShell from "../_components/DashboardShell";
import PetiCashListContent from "./_components/PetiCashListContent";

export default function PetiCashPage() {
  return (
    <DashboardShell requireAdmin>
      <PetiCashListContent />
    </DashboardShell>
  );
}
