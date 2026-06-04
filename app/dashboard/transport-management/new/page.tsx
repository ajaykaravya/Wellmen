"use client";

import DashboardShell from "../../_components/DashboardShell";
import TransportFormContent from "../_components/TransportFormContent";

export default function TransportNewPage() {
  return (
    <DashboardShell requireAdmin>
      <TransportFormContent />
    </DashboardShell>
  );
}
