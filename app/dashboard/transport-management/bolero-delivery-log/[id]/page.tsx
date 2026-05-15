"use client";

import { useParams } from "next/navigation";
import DashboardShell from "../../../_components/DashboardShell";
import BoleroDeliveryLogFormContent from "../_components/BoleroDeliveryLogFormContent";

export default function BoleroDeliveryLogEditPage() {
  const params = useParams();
  const logId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  if (!logId || typeof logId !== "string") return null;

  return (
    <DashboardShell requireAdmin>
      <BoleroDeliveryLogFormContent logId={logId} />
    </DashboardShell>
  );
}
