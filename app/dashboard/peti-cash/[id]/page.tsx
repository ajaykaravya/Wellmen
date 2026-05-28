"use client";

import { useParams } from "next/navigation";
import DashboardShell from "../../_components/DashboardShell";
import PetiCashFormContent from "../_components/PetiCashFormContent";

export default function PetiCashEditPage() {
  const params = useParams();
  const petiCashId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  if (!petiCashId || typeof petiCashId !== "string") return null;

  return (
    <DashboardShell requireAdmin>
      <PetiCashFormContent petiCashId={petiCashId} />
    </DashboardShell>
  );
}
