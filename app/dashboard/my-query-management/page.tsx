"use client";

import DashboardShell from "../_components/DashboardShell";
import QueryListContent from "../query-management/_components/QueryListContent";

export default function MyQueryManagementPage() {
  return (
    <DashboardShell>
      <QueryListContent
        apiBase="/api/query-management"
        basePath="/dashboard/my-query-management"
        title="My Query Management"
        addLabel="Add Query"
        emptyMessage="No queries found."
      />
    </DashboardShell>
  );
}
