"use client";

import { useParams } from "next/navigation";
import DashboardShell from "../../_components/DashboardShell";
import TransportFormContent from "../_components/TransportFormContent";

export default function TransportEditPage() {
  const params = useParams();
  const transportId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  if (!transportId || typeof transportId !== "string") return null;

  return (
    <DashboardShell>
      <TransportFormContent transportId={transportId} />
    </DashboardShell>
  );
}
