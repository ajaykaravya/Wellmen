"use client";

import { useParams } from "next/navigation";
import DashboardShell from "../../_components/DashboardShell";
import CashInFormContent from "../_components/CashInFormContent";

export default function CashInEditPage() {
  const params = useParams();
  const cashInId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  if (!cashInId || typeof cashInId !== "string") return null;

  return (
    <DashboardShell requireAdmin>
      <CashInFormContent cashInId={cashInId} />
    </DashboardShell>
  );
}
