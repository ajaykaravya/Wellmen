"use client";

import DashboardShell from "../../_components/DashboardShell";
import QueryFormContent from "../../query-management/_components/QueryFormContent";

export default function MyQueryNewPage() {
  return (
    <DashboardShell>
      <QueryFormContent
        apiBase="/api/query-management"
        returnPath="/dashboard/my-query-management"
        title="Add New Query"
        submitLabel="Save"
      />
    </DashboardShell>
  );
}
