import DashboardShell from "../_components/DashboardShell";
import TransportConfigListContent from "./_components/TransportConfigListContent";

export default function TransportConfigPage() {
  return (
    <DashboardShell requireAdmin>
      <TransportConfigListContent />
    </DashboardShell>
  )
}
