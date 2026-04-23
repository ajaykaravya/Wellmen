"use client";

import { useParams } from "next/navigation";
import DashboardShell from "../../_components/DashboardShell";
import QueryFormContent from "../../query-management/_components/QueryFormContent";

export default function MyQueryEditPage() {
  const params = useParams();
  const queryId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  if (!queryId || typeof queryId !== "string") return null;

  return (
    <DashboardShell>
      <QueryFormContent
        queryId={queryId}
        apiBase="/api/my-query-management"
        returnPath="/dashboard/my-query-management"
        title="Edit Query"
        submitLabel="Update"
      />
    </DashboardShell>
  );
}
