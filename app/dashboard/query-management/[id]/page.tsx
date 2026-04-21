"use client";

import { useParams } from "next/navigation";
import DashboardShell from "../../_components/DashboardShell";
import QueryFormContent from "../_components/QueryFormContent";

export default function QueryEditPage() {
  const params = useParams();
  const queryId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  if (!queryId || typeof queryId !== "string") return null;

  return (
    <DashboardShell>
      <QueryFormContent queryId={queryId} />
    </DashboardShell>
  );
}
