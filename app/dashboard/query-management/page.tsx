import DashboardShell from "../_components/DashboardShell";
import QueryListContent from "./_components/QueryListContent";

export default function QueryManagementPage() {
  return (
    <DashboardShell>
      <QueryListContent
        apiBase="/api/query-management"
        basePath="/dashboard/query-management"
        title="Query Management"
        addLabel="Add Query"
        emptyMessage="No queries found."
      />
    </DashboardShell>
  );
}
